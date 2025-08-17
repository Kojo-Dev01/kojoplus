import { NextResponse } from 'next/server';
import { getTokenFromCookies, verifyAccessToken } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Course from '@/models/Course';

export async function DELETE(request, { params }) {
  try {
    const { id, moduleId, sectionId, lessonId } = await params;
    
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

    const course = await Course.findById(id);
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const module2 = course.modules.id(moduleId);
    if (!module2) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    const section = module2.sections.id(sectionId);
    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    const lesson = section.lessons.id(lessonId);
    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    // Remove the lesson from the section
    section.lessons.pull(lessonId);
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
  console.log('=== SECTION LESSON UPDATE API CALLED ===');
  
  try {
    const { id, moduleId, sectionId, lessonId } = await params;
    console.log(`Course ID: ${id}, Module ID: ${moduleId}, Section ID: ${sectionId}, Lesson ID: ${lessonId}`);
    
    // Verify admin authentication using cookies
    const token = await getTokenFromCookies();
    
    if (!token) {
      console.log('❌ No authentication token found');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyAccessToken(token);
    
    if (!decoded || decoded.role !== 'admin') {
      console.log('❌ Invalid token or insufficient permissions');
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    console.log(`✅ Admin authenticated: ${decoded.email}`);

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

    const lesson = section.lessons.id(lessonId);
    if (!lesson) {
      console.log(`❌ Lesson not found with ID: ${lessonId} in section ${sectionId}`);
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    console.log(`✅ Found lesson: "${lesson.title}" in section: "${section.title}" in module: "${module.title}"`);

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
    section.updatedAt = new Date();
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
    console.error('❌ ERROR in section lesson update API:', error);
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