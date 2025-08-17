import { NextResponse } from 'next/server';
import { getTokenFromCookies, verifyAccessToken } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Course from '@/models/Course';

export async function PATCH(request, { params }) {
  console.log('=== REORDER API CALLED ===');
  
  try {
    // Await params to fix Next.js 15 issue
    const { id, moduleId } = await params;
    console.log(`Course ID: ${id}, Module ID: ${moduleId}`);
    
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

    console.log(`✅ Found module: "${module2.title}"`);

    const { orderedItems } = await request.json();

    console.log('📥 Incoming ordered items:', orderedItems?.length || 0);

    if (!orderedItems || !Array.isArray(orderedItems)) {
      console.log('❌ Invalid orderedItems format');
      return NextResponse.json({ error: 'Invalid orderedItems format' }, { status: 400 });
    }

    // Log current state before update
    console.log('📊 BEFORE UPDATE:');
    console.log(`- Current sections count: ${module2.sections?.length || 0}`);
    console.log(`- Current lessons count: ${module2.lessons?.length || 0}`);
    
    if (module2.sections?.length > 0) {
      console.log('Current sections order:');
      module2.sections.forEach((section, index) => {
        console.log(`  ${index + 1}. "${section.title}" (order: ${section.order || 'undefined'})`);
      });
    }
    
    if (module2.lessons?.length > 0) {
      console.log('Current lessons order:');
      module2.lessons.forEach((lesson, index) => {
        console.log(`  ${index + 1}. "${lesson.title}" (order: ${lesson.order || 'undefined'})`);
      });
    }

    // Store original arrays for reference
    const originalSections = module2.sections ? [...module2.sections] : [];
    const originalLessons = module2.lessons ? [...module2.lessons] : [];

    // Clear existing arrays
    module2.sections = [];
    module2.lessons = [];

    // Process the ordered items with continuous sequential numbering
    console.log('🔄 Processing ordered items with continuous numbering:');
    
    const newSections = [];
    const newLessons = [];

    orderedItems.forEach((item, index) => {
      const sequentialOrder = index + 1; // Continuous numbering starting from 1
      
      console.log(`  Processing item ${sequentialOrder}: "${item.title}" (type: ${item.type})`);

      if (item.type === 'section') {
        // Find existing section to preserve all fields
        const existingSection = originalSections.find(s => s._id.toString() === item._id);
        
        if (existingSection) {
          console.log(`    ✅ Found existing section, assigning order: ${sequentialOrder}`);
          
          // Create updated section with new sequential order
          const updatedSection = {
            ...existingSection.toObject(),
            order: sequentialOrder,
            updatedAt: new Date()
          };
          
          newSections.push(updatedSection);
          console.log(`    📌 Section "${item.title}" assigned order: ${sequentialOrder}`);
        } else {
          console.log(`    ⚠️ Section not found in originals, creating new entry`);
          
          newSections.push({
            ...item,
            order: sequentialOrder,
            updatedAt: new Date()
          });
        }
      } else if (item.type === 'lesson') {
        // Find existing lesson to preserve all fields
        const existingLesson = originalLessons.find(l => l._id.toString() === item._id);
        
        if (existingLesson) {
          console.log(`    ✅ Found existing lesson, assigning order: ${sequentialOrder}`);
          
          // Create updated lesson with new sequential order
          const updatedLesson = {
            ...existingLesson.toObject(),
            order: sequentialOrder,
            updatedAt: new Date()
          };
          
          newLessons.push(updatedLesson);
          console.log(`    📌 Lesson "${item.title}" assigned order: ${sequentialOrder}`);
        } else {
          console.log(`    ⚠️ Lesson not found in originals, creating new entry`);
          
          newLessons.push({
            ...item,
            order: sequentialOrder,
            updatedAt: new Date()
          });
        }
      }
    });

    // Assign the new arrays to the module
    module2.sections = newSections;
    module2.lessons = newLessons;

    // Update module timestamp
    module2.updatedAt = new Date();
    course.updatedAt = new Date();

    console.log('📊 AFTER UPDATE:');
    console.log(`- Final sections count: ${module2.sections?.length || 0}`);
    console.log(`- Final lessons count: ${module2.lessons?.length || 0}`);
    
    if (module2.sections?.length > 0) {
      console.log('Final sections order:');
      module2.sections.forEach((section, index) => {
        console.log(`  ${index + 1}. "${section.title}" (order: ${section.order})`);
      });
    }
    
    if (module2.lessons?.length > 0) {
      console.log('Final lessons order:');
      module2.lessons.forEach((lesson, index) => {
        console.log(`  ${index + 1}. "${lesson.title}" (order: ${lesson.order})`);
      });
    }

    // Recalculate course totals
    const totalSections = course.modules.reduce((total, mod) => {
      return total + (mod.sections ? mod.sections.length : 0);
    }, 0);

    const totalLessons = course.modules.reduce((total, mod) => {
      const moduleLessons = mod.lessons ? mod.lessons.length : 0;
      const sectionLessons = mod.sections ? mod.sections.reduce((sectionTotal, section) => {
        return sectionTotal + (section.lessons ? section.lessons.length : 0);
      }, 0) : 0;
      return total + moduleLessons + sectionLessons;
    }, 0);

    course.totalSections = totalSections;
    course.totalLessons = totalLessons;

    console.log(`📊 Course totals: ${totalSections} sections, ${totalLessons} lessons`);

    // Save the course
    console.log('💾 Saving course to database...');
    await course.save();
    console.log('✅ Course saved successfully');

    // Fetch fresh data to verify persistence
    console.log('🔍 Fetching fresh data to verify...');
    const updatedCourse = await Course.findById(id);
    const verifyModule = updatedCourse.modules.id(moduleId);
    
    console.log('🔍 VERIFICATION:');
    if (verifyModule.sections?.length > 0) {
      console.log('Verified sections order:');
      verifyModule.sections.forEach((section, index) => {
        console.log(`  ${index + 1}. "${section.title}" (order: ${section.order})`);
      });
    }
    
    if (verifyModule.lessons?.length > 0) {
      console.log('Verified lessons order:');
      verifyModule.lessons.forEach((lesson, index) => {
        console.log(`  ${index + 1}. "${lesson.title}" (order: ${lesson.order})`);
      });
    }

    console.log('=== REORDER COMPLETED SUCCESSFULLY ===');

    return NextResponse.json({ 
      success: true, 
      course: updatedCourse.toObject(),
      message: 'Content reordered successfully',
      stats: {
        totalSections,
        totalLessons,
        updatedModule: module2.title,
        processedItems: orderedItems.length,
        finalSectionsCount: newSections.length,
        finalLessonsCount: newLessons.length
      }
    });

  } catch (error) {
    console.error('❌ ERROR in reorder API:', error);
    console.error('Stack trace:', error.stack);
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to reorder content',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
