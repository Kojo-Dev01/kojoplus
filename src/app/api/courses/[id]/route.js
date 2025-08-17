import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import connectDB from '@/lib/mongodb';
import Course from '@/models/Course';
import { uploadToWasabi, deleteFromWasabi } from '@/lib/s3Upload';

// File name sanitization function
function sanitizeFilename(filename) {
  if (!filename) return 'untitled';
  
  // Get file extension
  const lastDotIndex = filename.lastIndexOf('.');
  const name = lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
  const extension = lastDotIndex > 0 ? filename.substring(lastDotIndex) : '';
  
  // Replace invalid characters with underscores
  // S3/Wasabi doesn't support: spaces, special chars except dash, underscore, period
  const sanitizedName = name
    .replace(/[^\w\-_.]/g, '_') // Replace invalid chars with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
    .substring(0, 100); // Limit length to avoid issues
  
  // Ensure we have a valid name
  const finalName = sanitizedName || 'course';
  
  // Add timestamp to ensure uniqueness
  const timestamp = Date.now();
  
  return `${finalName}_${timestamp}${extension.toLowerCase()}`;
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

    const course = await Course.findById(params.id)

    if (!course) {
      return NextResponse.json(
        { message: 'Course not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ course });

  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
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

    const course = await Course.findById(params.id)

    if (!course) {
      return NextResponse.json(
        { message: 'Course not found' },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    
    // Basic course information
    const title = formData.get('title');
    const description = formData.get('description');
    const shortDescription = formData.get('shortDescription');
    const category = formData.get('category');
    const section = formData.get('section');
    const level = formData.get('level');
    const instructor = formData.get('instructor');
    
    // Course type and pricing
    const courseType = formData.get('courseType');
    const price = formData.get('price') ? parseFloat(formData.get('price')) : undefined;
    const productId = formData.get('productId');
    const purchaseLink = formData.get('purchaseLink');
    
    const isPremium = formData.get('isPremium');
    const accessLevel = formData.get('accessLevel');
    const isPublished = formData.get('isPublished');
    const isFeatured = formData.get('isFeatured');
    
    // Files
    const thumbnail = formData.get('thumbnail');
    const introVideo = formData.get('introVideo');
    
    // Arrays
    const tagsData = formData.get('tags');
    const prerequisitesData = formData.get('prerequisites');
    const learningOutcomesData = formData.get('learningOutcomes');

    // Validation for course type change
    if (courseType && courseType !== course.courseType) {
      if (courseType === 'paid') {
        if (!price || price <= 0) {
          return NextResponse.json(
            { error: 'Price is required and must be greater than 0 for paid courses' },
            { status: 400 }
          );
        }
        if (!productId || !productId.trim()) {
          return NextResponse.json(
            { error: 'Product ID is required for paid courses' },
            { status: 400 }
          );
        }
        if (!purchaseLink || !purchaseLink.trim()) {
          return NextResponse.json(
            { error: 'Purchase link is required for paid courses' },
            { status: 400 }
          );
        }
      }
    }

    // Check for duplicate product ID if changed
    if (productId && productId.trim() && productId.trim() !== course.productId) {
      const existingCourse = await Course.findOne({ productId: productId.trim() });
      if (existingCourse && existingCourse._id.toString() !== params.id) {
        return NextResponse.json(
          { error: 'A course with this product ID already exists' },
          { status: 400 }
        );
      }
    }

    // Handle thumbnail upload
    if (thumbnail && thumbnail.size > 0) {
      if (!thumbnail.type.startsWith('image/')) {
        return NextResponse.json(
          { error: 'Thumbnail must be an image file' },
          { status: 400 }
        );
      }

      if (thumbnail.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'Thumbnail size must be less than 5MB' },
          { status: 400 }
        );
      }

      // Delete old thumbnail if exists
      if (course.thumbnailKey) {
        await deleteFromWasabi(course.thumbnailKey);
      }

      // Sanitize thumbnail filename
      const sanitizedThumbnailName = sanitizeFilename(thumbnail.name);
      
      // Create a new File object with sanitized name
      const sanitizedThumbnail = new File([thumbnail], sanitizedThumbnailName, {
        type: thumbnail.type,
        lastModified: thumbnail.lastModified
      });

      const thumbnailUpload = await uploadToWasabi(sanitizedThumbnail, 'courses/thumbnails');
      if (!thumbnailUpload.success) {
        return NextResponse.json(
          { error: 'Failed to upload thumbnail' },
          { status: 500 }
        );
      }

      course.thumbnailUrl = thumbnailUpload.url;
      course.thumbnailKey = thumbnailUpload.key;
    }

    // Handle intro video upload
    if (introVideo && introVideo.size > 0) {
      if (!introVideo.type.startsWith('video/')) {
        return NextResponse.json(
          { error: 'Intro video must be a video file' },
          { status: 400 }
        );
      }

      if (introVideo.size > 100 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'Intro video size must be less than 100MB' },
          { status: 400 }
        );
      }

      // Delete old intro video if exists
      if (course.introVideoKey) {
        await deleteFromWasabi(course.introVideoKey);
      }

      // Sanitize intro video filename
      const sanitizedVideoName = sanitizeFilename(introVideo.name);
      
      // Create a new File object with sanitized name
      const sanitizedIntroVideo = new File([introVideo], sanitizedVideoName, {
        type: introVideo.type,
        lastModified: introVideo.lastModified
      });

      const introVideoUpload = await uploadToWasabi(sanitizedIntroVideo, 'courses/intro-videos');
      if (!introVideoUpload.success) {
        return NextResponse.json(
          { error: 'Failed to upload intro video' },
          { status: 500 }
        );
      }

      course.introVideoUrl = introVideoUpload.url;
      course.introVideoKey = introVideoUpload.key;
    }

    // Update basic fields
    if (title) course.title = title.trim();
    if (description) course.description = description.trim();
    if (shortDescription !== undefined) course.shortDescription = shortDescription?.trim() || '';
    if (category) course.category = category;
    if (section) course.section = section;
    if (level) course.level = level;
    if (instructor) course.instructor = instructor.trim();
    
    // Update course type and pricing
    if (courseType) {
      course.courseType = courseType;
      if (courseType === 'paid') {
        course.price = price || course.price;
        course.productId = productId?.trim() || course.productId;
        course.purchaseLink = purchaseLink?.trim() || course.purchaseLink;
        course.isPremium = true; // Auto-set for paid courses
      } else if (courseType === 'free') {
        course.price = 0;
        course.productId = null;
        course.purchaseLink = null;
      }
    } else if (price !== undefined && course.courseType === 'paid') {
      course.price = price;
    }
    
    if (productId !== undefined && course.courseType === 'paid') {
      course.productId = productId?.trim() || null;
    }
    
    if (purchaseLink !== undefined && course.courseType === 'paid') {
      course.purchaseLink = purchaseLink?.trim() || null;
    }
    
    // Update other fields
    if (isPremium !== undefined && course.courseType === 'free') {
      course.isPremium = isPremium === 'true';
    }
    if (accessLevel) course.accessLevel = accessLevel;
    if (isPublished !== undefined) course.isPublished = isPublished === 'true';
    if (isFeatured !== undefined) course.isFeatured = isFeatured === 'true';

    // Parse and update arrays
    if (tagsData !== undefined) {
      try {
        course.tags = JSON.parse(tagsData).filter(tag => tag.trim());
      } catch (e) {
        course.tags = tagsData.split(',').map(tag => tag.trim()).filter(tag => tag);
      }
    }

    if (prerequisitesData !== undefined) {
      try {
        course.prerequisites = JSON.parse(prerequisitesData).filter(item => item.trim());
      } catch (e) {
        course.prerequisites = prerequisitesData.split(',').map(item => item.trim()).filter(item => item);
      }
    }

    if (learningOutcomesData !== undefined) {
      try {
        course.learningOutcomes = JSON.parse(learningOutcomesData).filter(item => item.trim());
      } catch (e) {
        course.learningOutcomes = learningOutcomesData.split(',').map(item => item.trim()).filter(item => item);
      }
    }

    await course.save();

    return NextResponse.json({ success: true, course });

  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update course' },
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

    const course = await Course.findByIdAndDelete(params.id);

    if (!course) {
      return NextResponse.json(
        { message: 'Course not found' },
        { status: 404 }
      );
    }

    // Delete associated files from storage
    if (course.thumbnailKey) {
      await deleteFromWasabi(course.thumbnailKey);
    }
    if (course.introVideoKey) {
      await deleteFromWasabi(course.introVideoKey);
    }

    // Delete course modules and their associated files
    for (const module2 of course.modules || []) {
      for (const section of module2.sections || []) {
        if (section.videoKey) {
          await deleteFromWasabi(section.videoKey);
        }
      }
    }

    return NextResponse.json({
      message: 'Course deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
