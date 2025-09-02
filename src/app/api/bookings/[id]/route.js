import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';

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

    const { id } = await params;
    const updates = await request.json();

    const booking = await Booking.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('bookingSlotId');

    if (!booking) {
      return NextResponse.json(
        { message: 'Booking not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Booking updated successfully',
      booking
    });

  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
