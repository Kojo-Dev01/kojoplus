import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import connectDB from '@/lib/mongodb';
import Collaboration from '@/models/Collaboration';

export async function PATCH(request, { params }) {
  try {
        // Verify admin authentication
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

    const collaboration = await Collaboration.findById(id);
    
    if (!collaboration) {
      return NextResponse.json(
        { message: 'Collaboration not found' },
        { status: 404 }
      );
    }

    // If status is being updated, use the updateStatus method
    if (updates.status) {
      await collaboration.updateStatus(updates.status, decoded.username);
    } else {
      // For other updates
      Object.assign(collaboration, updates);
      await collaboration.save();
    }

    await collaboration.populate('submittedBy');

    return NextResponse.json({
      message: 'Collaboration updated successfully',
      collaboration
    });

  } catch (error) {
    console.error('Error updating collaboration:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
