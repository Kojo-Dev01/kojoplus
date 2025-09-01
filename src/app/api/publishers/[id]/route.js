import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import connectDB from '@/lib/mongodb';
import Publisher from '@/models/Publisher';

export async function GET(request, { params }) {
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
    const publisher = await Publisher.findById(id)
      .populate('userId', 'firstName lastName email phone whatsapp emailVerified');

    if (!publisher) {
      return NextResponse.json(
        { error: 'Publisher not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      publisher
    });

  } catch (error) {
    console.error('Error fetching publisher:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch publisher' },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.role !== 'admin') {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 }
      );
    }

    await connectDB();

    const { id } = params;
    const updateData = await request.json();

    // Only allow specific fields to be updated
    const allowedUpdates = ['displayName', 'bio', 'isActive', 'isVerified'];
    const filteredUpdate = {};
    
    allowedUpdates.forEach(field => {
      if (updateData.hasOwnProperty(field)) {
        filteredUpdate[field] = updateData[field];
      }
    });

    const publisher = await Publisher.findByIdAndUpdate(
      id,
      filteredUpdate,
      { new: true, runValidators: true }
    ).populate('userId', 'firstName lastName email phone whatsapp emailVerified');

    if (!publisher) {
      return NextResponse.json(
        { error: 'Publisher not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      publisher
    });

  } catch (error) {
    console.error('Error updating publisher:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update publisher' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.role !== 'admin') {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 }
      );
    }

    await connectDB();

    const { id } = params;
    const publisher = await Publisher.findByIdAndDelete(id);

    if (!publisher) {
      return NextResponse.json(
        { error: 'Publisher not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Publisher deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting publisher:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete publisher' },
      { status: 500 }
    );
  }
}
