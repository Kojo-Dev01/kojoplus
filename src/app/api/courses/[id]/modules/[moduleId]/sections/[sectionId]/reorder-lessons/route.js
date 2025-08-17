import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import connectDB from '@/lib/mongodb';
import Course from '@/models/Course';

export async function PATCH(request, { params }) {
  console.log('=== SECTION LESSON REORDER API CALLED ===');
  
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

    const { lessons } = await request.json();

    console.log('📥 Incoming lesson reorder data:');
    console.log(`- Lessons to reorder: ${lessons?.length || 0}`);

    if (!lessons || !Array.isArray(lessons)) {
      console.log('❌ Invalid lessons array');
      return NextResponse.json({ error: 'Invalid lessons array' }, { status: 400 });
    }

    // Log current state before update
    console.log('📊 BEFORE UPDATE:');
    console.log(`- Current lessons count: ${section.lessons?.length || 0}`);
    
    if (section.lessons?.length > 0) {
      console.log('Current section lessons order:');
      section.lessons.forEach((lesson, index) => {
        console.log(`  ${index + 1}. "${lesson.title}" (order: ${lesson.order || 'undefined'})`);
      });
    }

    // Store original lessons for comparison
    const originalLessons = section.lessons ? [...section.lessons] : [];

    // Clear existing lessons array
    section.lessons = [];

    // Update lessons with new order and preserve all data
    console.log('🔄 Processing lessons reorder:');
    
    lessons.forEach((lessonData, index) => {
      console.log(`  Processing lesson ${index + 1}: "${lessonData.title}"`);
      
      // Find existing lesson to preserve all fields
      const existingLesson = originalLessons.find(l => l._id.toString() === lessonData._id);
      
      if (existingLesson) {
        console.log(`    ✅ Found existing lesson, updating order to ${index + 1}`);
        
        // Create updated lesson with new order
        const updatedLesson = {
          ...existingLesson.toObject(),
          order: index + 1,
          updatedAt: new Date()
        };
        
        section.lessons.push(updatedLesson);
        console.log(`    📌 Lesson "${lessonData.title}" assigned order: ${index + 1}`);
      } else {
        console.log(`    ⚠️ Lesson not found in originals, creating new entry`);
        
        section.lessons.push({
          ...lessonData,
          order: index + 1,
          updatedAt: new Date()
        });
      }
    });
    
    console.log(`✅ Updated ${lessons.length} lessons in section`);

    // Update timestamps
    section.updatedAt = new Date();
    module2.updatedAt = new Date();
    course.updatedAt = new Date();

    console.log('📊 AFTER UPDATE:');
    console.log(`- Final lessons count: ${section.lessons?.length || 0}`);
    
    if (section.lessons?.length > 0) {
      console.log('Final section lessons order:');
      section.lessons.forEach((lesson, index) => {
        console.log(`  ${index + 1}. "${lesson.title}" (order: ${lesson.order})`);
      });
    }

    // Recalculate course totals
    const totalLessons = course.modules.reduce((total, mod) => {
      const moduleLessons = mod.lessons ? mod.lessons.length : 0;
      const sectionLessons = mod.sections ? mod.sections.reduce((sectionTotal, section) => {
        return sectionTotal + (section.lessons ? section.lessons.length : 0);
      }, 0) : 0;
      return total + moduleLessons + sectionLessons;
    }, 0);

    course.totalLessons = totalLessons;

    console.log(`📊 Course total lessons: ${totalLessons}`);

    // Save the course
    console.log('💾 Saving course to database...');
    await course.save();
    console.log('✅ Course saved successfully');

    // Fetch fresh data to verify persistence
    console.log('🔍 Fetching fresh data to verify...');
    const updatedCourse = await Course.findById(id);
    const verifyModule = updatedCourse.modules.id(moduleId);
    const verifySection = verifyModule.sections.id(sectionId);
    
    console.log('🔍 VERIFICATION:');
    if (verifySection.lessons?.length > 0) {
      console.log('Verified section lessons order:');
      verifySection.lessons.forEach((lesson, index) => {
        console.log(`  ${index + 1}. "${lesson.title}" (order: ${lesson.order})`);
      });
    }

    console.log('=== SECTION LESSON REORDER COMPLETED SUCCESSFULLY ===');

    return NextResponse.json({ 
      success: true, 
      course: updatedCourse.toObject(),
      message: `Successfully reordered ${lessons.length} lessons in section "${section.title}"`,
      stats: {
        totalLessons,
        updatedSection: section.title,
        updatedModule: module2.title,
        processedLessons: lessons.length
      }
    });

  } catch (error) {
    console.error('❌ ERROR in section lesson reorder API:', error);
    console.error('Stack trace:', error.stack);
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to reorder section lessons',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
