import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import connectDB from '@/lib/mongodb';
import Course from '@/models/Course';

export async function DELETE(request, { params }) {
  try {
    const { id, moduleId, lessonId } = await params;
    
    // Verify admin authentication using cookies
    const token = getTokenFromRequest(request);
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const payload = verifyToken(token);
    
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Verify user still exists and is active
    await connectDB();
    const course = await Course.findById(id);
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const module2 = course.modules.id(moduleId);
    if (!module2) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    const lesson = module2.lessons.id(lessonId);
    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    // Remove the lesson
    module2.lessons.pull(lessonId);
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

    await course.save();

    return NextResponse.json({
      success: true,
      course: course.toObject(),
      message: 'Lesson deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting lesson:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete lesson' },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  console.log('=== DIRECT MODULE LESSON UPDATE API CALLED ===');
  
  try {
    const { id, moduleId, lessonId } = await params;
    console.log(`Course ID: ${id}, Module ID: ${moduleId}, Lesson ID: ${lessonId}`);
    
    // Verify admin authentication using cookies
    
    const token = getTokenFromRequest(request);
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const payload = verifyToken(token);
    
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Verify user still exists and is active
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

    const lesson = module2.lessons.id(lessonId);
    if (!lesson) {
      console.log(`❌ Lesson not found with ID: ${lessonId} in module ${moduleId}`);
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    console.log(`✅ Found lesson: "${lesson.title}" in module: "${module2.title}"`);

    const updateData = await request.json();
    console.log('📝 Update data received:', updateData);

    // Update lesson fields
    if (updateData.title !== undefined) {
      lesson.title = updateData.title;
    }
    if (updateData.description !== undefined) {
      lesson.description = updateData.description;
    }
    if (updateData.videoUrl !== undefined) {
      lesson.videoUrl = updateData.videoUrl;
    }
    if (updateData.duration !== undefined) {
      lesson.duration = updateData.duration;
    }
    if (updateData.isPublished !== undefined) {
      lesson.isPublished = updateData.isPublished;
    }

    lesson.updatedAt = new Date();
    module2.updatedAt = new Date();
    course.updatedAt = new Date();

    console.log(`📚 Updated lesson: "${lesson.title}"`);

    await course.save();
    console.log('✅ Course saved successfully');

    return NextResponse.json({
      success: true,
      lesson: lesson.toObject(),
      course: course.toObject(),
      message: 'Lesson updated successfully'
    });

  } catch (error) {
    console.error('❌ ERROR in lesson update API:', error);
    console.error('Stack trace:', error.stack);
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to update lesson',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
