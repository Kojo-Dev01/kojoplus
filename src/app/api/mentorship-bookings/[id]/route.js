import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import MentorshipBooking from '@/models/MentorshipBooking';

export async function PATCH(request, { params }) {
  try {
        // Verify admin authentication using JWT
        const token = getTokenFromRequest(request);
        
        if (!token) {
          return NextResponse.json({ error: 'No token provided' }, { status: 401 });
        }
    
        const payload = verifyToken(token);
        
        if (!payload) {
          return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }
    
        await connectDB();

    const { id } = params;
    const updateData = await request.json();

    // Find the booking
    const booking = await MentorshipBooking.findById(id);
    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Update the booking using the instance method
    if (updateData.status) {
      await booking.updateStatus(updateData.status, {
        scheduledDate: updateData.scheduledDate,
        meetingLink: updateData.meetingLink,
        notes: updateData.notes
      });
    } else {
      // Direct field updates
      Object.keys(updateData).forEach(key => {
        if (booking.schema.paths[key]) {
          booking[key] = updateData[key];
        }
      });
      await booking.save();
    }

    // Populate and return updated booking
    await booking.populate('userId', 'firstName lastName email phone');

    return NextResponse.json({
      success: true,
      booking,
      message: 'Booking updated successfully'
    });

  } catch (error) {
    console.error('Error updating mentorship booking:', error);
    return NextResponse.json(
      { error: 'Failed to update booking' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
        // Verify admin authentication using JWT
        const token = getTokenFromRequest(request);
        
        if (!token) {
          return NextResponse.json({ error: 'No token provided' }, { status: 401 });
        }
    
        const payload = verifyToken(token);
        
        if (!payload) {
          return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }
    
        await connectDB();

    const { id } = params;

    // Find and delete the booking
    const booking = await MentorshipBooking.findByIdAndDelete(id);
    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Booking deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting mentorship booking:', error);
    return NextResponse.json(
      { error: 'Failed to delete booking' },
      { status: 500 }
    );
  }
}
