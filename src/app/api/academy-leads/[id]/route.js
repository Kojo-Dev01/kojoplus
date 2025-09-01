import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb';
import AcademyLead from '../../../../../models/AcademyLead';

export async function PATCH(request, { params }) {
  try {
    await connectDB();

    const { id } = params;
    const updates = await request.json();

    const lead = await AcademyLead.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    if (!lead) {
      return NextResponse.json(
        { error: 'Academy lead not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      lead,
      message: 'Academy lead updated successfully'
    });

  } catch (error) {
    console.error('Error updating academy lead:', error);
    return NextResponse.json(
      { error: 'Failed to update academy lead' },
      { status: 500 }
    );
  }
}

export async function GET(request, { params }) {
  try {
    await connectDB();

    const { id } = params;
    const lead = await AcademyLead.findById(id);

    if (!lead) {
      return NextResponse.json(
        { error: 'Academy lead not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ lead });

  } catch (error) {
    console.error('Error fetching academy lead:', error);
    return NextResponse.json(
      { error: 'Failed to fetch academy lead' },
      { status: 500 }
    );
  }
}
