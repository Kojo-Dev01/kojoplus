import { NextResponse } from 'next/server';
import { getTokenFromCookies, verifyAccessToken } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Course from '@/models/Course';

export async function PATCH(request, { params }) {
  console.log('=== SECTION UPDATE API CALLED ===');
  
  try {
    const { id, moduleId, sectionId } = await params;
    console.log(`Course ID: ${id}, Module ID: ${moduleId}, Section ID: ${sectionId}`);
    
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

    console.log(`✅ Found section: "${section.title}" in module: "${module2.title}"`);

    const updateData = await request.json();
    console.log('📝 Update data received:', updateData);

    // Update section fields
    if (updateData.title !== undefined) {
      section.title = updateData.title;
    }
    if (updateData.description !== undefined) {
      section.description = updateData.description;
    }
    if (updateData.isPublished !== undefined) {
      section.isPublished = updateData.isPublished;
    }
    if (updateData.order !== undefined) {
      section.order = updateData.order;
    }

    section.updatedAt = new Date();
    module2.updatedAt = new Date();
    course.updatedAt = new Date();

    console.log(`📚 Updated section: "${section.title}", Published: ${section.isPublished}`);

    await course.save();
    console.log('✅ Course saved successfully');

    return NextResponse.json({
      success: true,
      section: section.toObject(),
      course: course.toObject(),
      message: 'Section updated successfully'
    });

  } catch (error) {
    console.error('❌ ERROR in section update API:', error);
    console.error('Stack trace:', error.stack);
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to update section',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  console.log('=== SECTION DELETE API CALLED ===');
  
  try {
    const { id, moduleId, sectionId } = await params;
    console.log(`Course ID: ${id}, Module ID: ${moduleId}, Section ID: ${sectionId}`);
    
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

    console.log(`✅ Found section: "${section.title}" in module: "${module2.title}"`);

    // Remove the section
    module2.sections.pull(sectionId);
    module2.updatedAt = new Date();
    course.updatedAt = new Date();

    // Recalculate totals
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

    console.log(`📊 Updated course totals - Sections: ${totalSections}, Lessons: ${totalLessons}`);

    await course.save();
    console.log('✅ Section deleted and course saved successfully');

    return NextResponse.json({
      success: true,
      course: course.toObject(),
      message: 'Section deleted successfully'
    });

  } catch (error) {
    console.error('❌ ERROR in section delete API:', error);
    console.error('Stack trace:', error.stack);
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to delete section',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
