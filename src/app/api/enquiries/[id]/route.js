import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import connectDB from '@/lib/mongodb';
import Enquiry from '@/models/Enquiry';

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

    const enquiry = await Enquiry.findById(id);
    
    if (!enquiry) {
      return NextResponse.json(
        { message: 'Enquiry not found' },
        { status: 404 }
      );
    }

    // If status is being updated, use the updateStatus method
    if (updates.status) {
      await enquiry.updateStatus(updates.status, decoded.username);
    } else {
      // For other updates
      Object.assign(enquiry, updates);
      await enquiry.save();
    }

    await enquiry.populate('submittedBy');

    return NextResponse.json({
      message: 'Enquiry updated successfully',
      enquiry
    });

  } catch (error) {
    console.error('Error updating enquiry:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
