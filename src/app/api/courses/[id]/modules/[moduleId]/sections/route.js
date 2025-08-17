import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import connectDB from '@/lib/mongodb';
import Course from '@/models/Course';

export async function POST(request, { params }) {
  try {
    const { id, moduleId } = await params;
   
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
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const module2 = course.modules.id(moduleId);
    if (!module2) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    const { title, description, isPublished } = await request.json();

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Section title is required' }, { status: 400 });
    }

    // Calculate order for new section - find the highest current order
    const existingItems = [];
    if (module2.sections) {
      module2.sections.forEach(section => existingItems.push({ order: section.order || 0 }));
    }
    if (module2.lessons) {
      module2.lessons.forEach(lesson => existingItems.push({ order: lesson.order || 0 }));
    }
    
    // Get the next order number (highest + 1)
    const maxOrder = existingItems.length > 0 ? Math.max(...existingItems.map(item => item.order || 0)) : 0;

    const newSection = {
      title: title.trim(),
      description: description?.trim(),
      isPublished: isPublished || false,
      order: maxOrder + 1, // This ensures new sections don't interfere with existing order
      lessons: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    module2.sections.push(newSection);
    module2.updatedAt = new Date();
    course.updatedAt = new Date();

    // Recalculate totals
    const totalSections = course.modules.reduce((total, mod) => {
      return total + (mod.sections ? mod.sections.length : 0);
    }, 0);

    course.totalSections = totalSections;

    await course.save();

    return NextResponse.json({
      success: true,
      section: newSection,
      course: course.toObject(),
      message: 'Section created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating section:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create section' },
      { status: 500 }
    );
  }
}
