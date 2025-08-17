import { NextResponse } from 'next/server';
import { getTokenFromCookies, verifyAccessToken } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Course from '@/models/Course';

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
  
  const finalName = sanitizedName || 'module';
  const timestamp = Date.now();
  
  return `${finalName}_${timestamp}${extension.toLowerCase()}`;
}

export async function POST(request, { params }) {
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

    const moduleData = await request.json();
    
    // Validate required fields
    if (!moduleData.title || !moduleData.title.trim()) {
      return NextResponse.json({ error: 'Module title is required' }, { status: 400 });
    }

    // Create new module
    const newModule = {
      title: moduleData.title.trim(),
      description: moduleData.description?.trim() || '',
      order: moduleData.order || (course.modules ? course.modules.length + 1 : 1),
      sections: [],
      lessons: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add module to course
    if (!course.modules) {
      course.modules = [];
    }
    course.modules.push(newModule);

    // Update course metadata
    course.totalModules = course.modules.length;
    course.updatedAt = new Date();

    await course.save();

    return NextResponse.json({ 
      success: true, 
      course: {
        ...course.toObject(),
        modules: course.modules.sort((a, b) => a.order - b.order)
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating module:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create module' },
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

    // Sort modules and their content properly
    const sortedModules = course.modules
      .sort((a, b) => a.order - b.order)
      .map(module => {
        const moduleObj = module.toObject();
        
        // Sort sections and their lessons
        if (moduleObj.sections) {
          moduleObj.sections = moduleObj.sections
            .sort((a, b) => a.order - b.order)
            .map(section => {
              if (section.lessons) {
                section.lessons = section.lessons.sort((a, b) => a.order - b.order);
              }
              return section;
            });
        }
        
        // Sort direct lessons in module
        if (moduleObj.lessons) {
          moduleObj.lessons = moduleObj.lessons.sort((a, b) => a.order - b.order);
        }
        
        return moduleObj;
      });

    console.log('Returning modules data:', JSON.stringify(sortedModules, null, 2)); // Debug log

    return NextResponse.json({
      success: true,
      modules: sortedModules,
      course: {
        _id: course._id,
        title: course.title,
        totalModules: course.totalModules,
        totalSections: course.totalSections,
        totalLessons: course.totalLessons
      }
    });

  } catch (error) {
    console.error('Error fetching modules:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch modules' },
      { status: 500 }
    );
  }
}
