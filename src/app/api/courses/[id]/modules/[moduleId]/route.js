import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import connectDB from '@/lib/mongodb';
import Course from '@/models/Course';

export async function DELETE(request, { params }) {
  try {
    // Verify admin authentication
   
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

    const course = await Course.findById(params.id);
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Find and remove the module
    const moduleIndex = course.modules.findIndex(m => m._id.toString() === params.moduleId);
    if (moduleIndex === -1) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    course.modules.splice(moduleIndex, 1);

    // Reorder remaining modules
    course.modules.forEach((module, index) => {
      module.order = index + 1;
    });

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
    });

  } catch (error) {
    console.error('Error deleting module:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete module' },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  console.log('=== MODULE UPDATE API CALLED ===');
  
  try {
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

    const updateData = await request.json();
    console.log('📝 Update data received:', updateData);

    // Update module fields
    if (updateData.title !== undefined) {
      module2.title = updateData.title;
    }
    if (updateData.description !== undefined) {
      module2.description = updateData.description;
    }
    if (updateData.isPublished !== undefined) {
      module2.isPublished = updateData.isPublished;
    }

    module2.updatedAt = new Date();
    course.updatedAt = new Date();

    console.log(`📚 Updated module: "${module2.title}"`);

    await course.save();
    console.log('✅ Course saved successfully');

    return NextResponse.json({
      success: true,
      module: module2.toObject(),
      course: course.toObject(),
      message: 'Module updated successfully'
    });

  } catch (error) {
    console.error('❌ ERROR in module update API:', error);
    console.error('Stack trace:', error.stack);
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to update module',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
