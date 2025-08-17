import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import connectDB from '@/lib/mongodb';
import Course from '@/models/Course';
import { uploadToWasabi } from '@/lib/s3Upload';

// File name sanitization function
function sanitizeFilename(filename) {
  if (!filename) return 'untitled';
  
  const lastDotIndex = filename.lastIndexOf('.');
  const name = lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
  const extension = lastDotIndex > 0 ? filename.substring(lastDotIndex) : '';
  
  const sanitizedName = name
    .replace(/[^\w\-_.]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 100);
  
  const finalName = sanitizedName || 'lesson';
  const timestamp = Date.now();
  
  return `${finalName}_${timestamp}${extension.toLowerCase()}`;
}

export async function POST(request, { params }) {
  console.log('=== SECTION LESSON CREATION API CALLED ===');
  
  try {
    const { id, moduleId, sectionId } = await params;
    console.log(`Course ID: ${id}, Module ID: ${moduleId}, Section ID: ${sectionId}`);
    
    // Verify admin authentication using cookies
    
        // Verify admin token
        const token = getTokenFromRequest(request);
        
        if (!token) {
          return NextResponse.json({ error: 'No token provided' }, { status: 401 });
        }
    
        const payload = verifyToken(token);
        
        if (!payload) {
          return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }
    
        await connectDB();

    const course = await Course.findById(id);
    if (!course) {
      console.log(`❌ Course not found with ID: ${id}`);
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const module2 = course.modules.id(moduleId);
    if (!module2) {
      console.log(`❌ Module not found with ID: ${moduleId} in course ${id}`);
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    const section = module2.sections.id(sectionId);
    if (!section) {
      console.log(`❌ Section not found with ID: ${sectionId} in module ${moduleId}`);
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    console.log(`✅ Found section: "${section.title}" in module: "${module2.title}"`);

    // Check content type to determine how to parse the request
    const contentType = request.headers.get('content-type') || '';
    let lessonData;
    let videoUrl = null;

    console.log('📥 Content-Type:', contentType);

    if (contentType.includes('multipart/form-data')) {
      // Handle FormData (file upload)
      console.log('🔄 Processing FormData request for video upload');
      try {
        const formData = await request.formData();
        
        lessonData = {
          title: formData.get('title'),
          description: formData.get('description') || undefined,
          duration: formData.get('duration') ? parseInt(formData.get('duration')) : undefined,
          isPublished: formData.get('isPublished') === 'true'
        };

        console.log('📝 Lesson data extracted:', lessonData);

        // Handle video file upload to Wasabi
        const videoFile = formData.get('video');
        if (videoFile && videoFile.size > 0) {
          console.log(`📹 Video file received: ${videoFile.name}, Size: ${(videoFile.size / (1024 * 1024)).toFixed(2)}MB`);
          
          // Validate file type
          const fileType = videoFile.type;
          const fileName = videoFile.name.toLowerCase();
          // Validate file type
          if (!fileType.startsWith("video/") && !fileName.endsWith(".ts")) {
            console.log("❌ Invalid file type:", fileType);
            return NextResponse.json(
              { error: "Only video files are allowed" },
              { status: 400 }
            );
          }

          // Validate file size (max 500MB)
          if (videoFile.size > 500 * 1024 * 1024) {
            console.log('❌ File too large:', videoFile.size);
            return NextResponse.json({ error: 'Video size must be less than 500MB' }, { status: 400 });
          }

          try {
            console.log('☁️ Uploading video to Wasabi...');
            const uploadResult = await uploadToWasabi(videoFile, 'videos');
            videoUrl = uploadResult.url;
            console.log('✅ Video uploaded successfully to:', videoUrl);
          } catch (uploadError) {
            console.error('❌ Video upload failed:', uploadError);
            return NextResponse.json({ 
              error: 'Failed to upload video file',
              details: uploadError.message 
            }, { status: 500 });
          }
        }
      } catch (formDataError) {
        console.error('❌ FormData parsing error:', formDataError);
        return NextResponse.json({ error: 'Invalid FormData format' }, { status: 400 });
      }
    } else if (contentType.includes('application/json')) {
      // Handle JSON (URL-based video)
      console.log('🔄 Processing JSON request for video URL');
      try {
        const jsonData = await request.json();
        lessonData = {
          title: jsonData.title,
          description: jsonData.description,
          duration: jsonData.duration ? parseInt(jsonData.duration) : undefined,
          isPublished: jsonData.isPublished || false
        };

        // Use provided video URL
        videoUrl = jsonData.videoUrl?.trim();
        console.log('📝 Lesson data extracted:', lessonData);
        console.log('🔗 Video URL provided:', videoUrl);
      } catch (jsonError) {
        console.error('❌ JSON parsing error:', jsonError);
        return NextResponse.json({ 
          error: 'Invalid JSON format in request body',
          details: jsonError.message 
        }, { status: 400 });
      }
    } else {
      console.log('❌ Unknown content type, attempting JSON fallback');
      try {
        const jsonData = await request.json();
        lessonData = {
          title: jsonData.title,
          description: jsonData.description,
          duration: jsonData.duration ? parseInt(jsonData.duration) : undefined,
          isPublished: jsonData.isPublished || false
        };
        videoUrl = jsonData.videoUrl?.trim();
        console.log('✅ Fallback JSON parsing successful');
      } catch (jsonError) {
        console.error('❌ Fallback JSON parsing failed:', jsonError);
        return NextResponse.json({ 
          error: 'Unable to parse request body. Please ensure you are sending valid JSON or FormData.',
          contentType: contentType
        }, { status: 400 });
      }
    }

    if (!lessonData.title?.trim()) {
      console.log('❌ Lesson title is required');
      return NextResponse.json({ error: 'Lesson title is required' }, { status: 400 });
    }

    // Calculate order for new lesson within section
    const maxOrder = section.lessons && section.lessons.length > 0 
      ? Math.max(...section.lessons.map(lesson => lesson.order || 0)) 
      : 0;

    const newOrder = maxOrder + 1;
    console.log(`📊 Calculated lesson order: ${newOrder}`);

    const newLesson = {
      title: lessonData.title.trim(),
      description: lessonData.description?.trim(),
      videoUrl: videoUrl || undefined,
      duration: lessonData.duration,
      isPublished: lessonData.isPublished,
      order: newOrder,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('📚 Creating lesson:', newLesson);

    section.lessons.push(newLesson);
    section.updatedAt = new Date();
    module2.updatedAt = new Date();
    course.updatedAt = new Date();

    // Recalculate totals
    const totalLessons = course.modules.reduce((total, mod) => {
      const moduleLessons = mod.lessons ? mod.lessons.length : 0;
      const sectionLessons = mod.sections ? mod.sections.reduce((sectionTotal, section) => {
        return sectionTotal + (section.lessons ? section.lessons.length : 0);
      }, 0) : 0;
      return total + moduleLessons + sectionLessons;
    }, 0);

    course.totalLessons = totalLessons;

    console.log(`📊 Updated course totals - Lessons: ${totalLessons}`);

    await course.save();
    console.log('✅ Course saved successfully');

    return NextResponse.json({
      success: true,
      lesson: newLesson,
      course: course.toObject(),
      message: 'Lesson created successfully',
      videoUploaded: !!videoUrl && videoUrl.includes('wasabisys.com')
    }, { status: 201 });

  } catch (error) {
    console.error('❌ ERROR in section lesson creation API:', error);
    console.error('Stack trace:', error.stack);
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to create lesson',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(request, { params }) {
  try {
    // Verify admin authentication using cookies
    const token = await getTokenFromCookies();
    
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyAccessToken(token);
    
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const course = await Course.findById(params.id);
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const module2 = course.modules.id(params.moduleId);
    if (!module2) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    const section = module2.sections.id(params.sectionId);
    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      lesson: section.lessons || [],
      message: 'Lessons retrieved successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching lessons:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch lessons' },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    // Verify admin authentication using cookies
    const token = await getTokenFromCookies();
    
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyAccessToken(token);
    
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const course = await Course.findById(params.id);
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const module2 = course.modules.id(params.moduleId);
    if (!module2) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    const section = module2.sections.id(params.sectionId);
    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    const formData = await request.formData();
    
    const title = formData.get('title');
    const description = formData.get('description');
    const duration = parseInt(formData.get('duration')) || 0;
    const isPublished = formData.get('isPublished') === 'true';
    const video = formData.get('video');

    console.log('Section lesson form data (PATCH):', { title, description, duration, isPublished, hasVideo: !!video }); // Debug log

    // Validate required fields
    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Lesson title is required' }, { status: 400 });
    }

    let videoUpload = null;

    // Upload video if provided
    if (video && video.size > 0) {
      console.log('Uploading video for section lesson (PATCH):', video.name, video.size); // Debug log
      
      if (!video.type.startsWith('video/')) {
        return NextResponse.json({ error: 'Video must be a video file' }, { status: 400 });
      }

      if (video.size > 100 * 1024 * 1024) { // 100MB limit
        return NextResponse.json({ error: 'Video size must be less than 100MB' }, { status: 400 });
      }

      // Sanitize video filename
      const sanitizedVideoName = sanitizeFilename(video.name);
      
      // Create a new File object with sanitized name
      const sanitizedVideo = new File([video], sanitizedVideoName, {
        type: video.type,
        lastModified: video.lastModified
      });

      videoUpload = await uploadToWasabi(sanitizedVideo, 'courses/lessons');
      if (!videoUpload.success) {
        return NextResponse.json({ error: 'Failed to upload video' }, { status: 500 });
      }
      
      console.log('Video uploaded successfully for section lesson (PATCH):', videoUpload.url); // Debug log
    }

    // Update lesson details
    const updatedLesson = {
      title: title.trim(),
      description: description?.trim() || '',
      duration: duration,
      isPublished: isPublished,
      videoUrl: videoUpload ? videoUpload.url : null,
      videoKey: videoUpload ? videoUpload.key : null,
      updatedAt: new Date()
    };

    console.log('Updating lesson in section:', updatedLesson); // Debug log

    // Find and update the lesson in the section
    const lessonIndex = section.lessons.findIndex(lesson => lesson.title === title.trim());
    if (lessonIndex === -1) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    section.lessons[lessonIndex] = { ...section.lessons[lessonIndex], ...updatedLesson };

    // Update timestamps
    section.updatedAt = new Date();
    module2.updatedAt = new Date();
    course.updatedAt = new Date();

    await course.save();
    
    console.log('Course updated with section lesson changes'); // Debug log

    return NextResponse.json({ 
      success: true, 
      course: course.toObject(),
      lesson: section.lessons[lessonIndex],
      message: 'Lesson updated successfully in section'
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating lesson:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update lesson' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    // Verify admin authentication using cookies
    const token = await getTokenFromCookies();
    
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyAccessToken(token);
    
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const course = await Course.findById(params.id);
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const module2 = course.modules.id(params.moduleId);
    if (!module2) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    const section = module2.sections.id(params.sectionId);
    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const title = formData.get('title');

    // Find and remove the lesson from the section
    const lessonIndex = section.lessons.findIndex(lesson => lesson.title === title.trim());
    if (lessonIndex === -1) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    // Remove video from Wasabi if it exists
    const lessonToDelete = section.lessons[lessonIndex];
    if (lessonToDelete.videoKey) {
      // TODO: Implement video deletion from Wasabi using lessonToDelete.videoKey
      console.log('Deleting video from Wasabi:', lessonToDelete.videoKey); // Debug log
    }

    section.lessons.splice(lessonIndex, 1);

    // Update timestamps
    section.updatedAt = new Date();
    module2.updatedAt = new Date();
    course.updatedAt = new Date();

    await course.save();
    
    console.log('Course updated with lesson deletion'); // Debug log

    return NextResponse.json({ 
      success: true, 
      message: 'Lesson deleted successfully from section'
    }, { status: 200 });

  } catch (error) {
    console.error('Error deleting lesson:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete lesson' },
      { status: 500 }
    );
  }
}
