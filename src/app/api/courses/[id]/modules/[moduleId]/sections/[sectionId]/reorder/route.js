import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Course from '@/models/Course';

export async function PATCH(request, { params }) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'admin') {
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

    const { direction } = await request.json();
    
    const sectionIndex = module2.sections.findIndex(s => s._id.toString() === params.sectionId);
    if (sectionIndex === -1) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    const sections = [...module2.sections];
    
    if (direction === 'up' && sectionIndex > 0) {
      // Swap with previous section
      [sections[sectionIndex], sections[sectionIndex - 1]] = [sections[sectionIndex - 1], sections[sectionIndex]];
    } else if (direction === 'down' && sectionIndex < sections.length - 1) {
      // Swap with next section
      [sections[sectionIndex], sections[sectionIndex + 1]] = [sections[sectionIndex + 1], sections[sectionIndex]];
    } else {
      return NextResponse.json({ error: 'Invalid move direction' }, { status: 400 });
    }

    // Update order numbers
    sections.forEach((section, index) => {
      section.order = index + 1;
    });

    module2.sections = sections;
    course.updatedAt = new Date();

    await course.save();

    return NextResponse.json({ 
      success: true, 
      course: {
        ...course.toObject(),
        modules: course.modules.map(m => ({
          ...m.toObject(),
          sections: m.sections ? m.sections.sort((a, b) => a.order - b.order) : []
        })).sort((a, b) => a.order - b.order)
      }
    });

  } catch (error) {
    console.error('Error reordering section:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reorder section' },
      { status: 500 }
    );
  }
}
