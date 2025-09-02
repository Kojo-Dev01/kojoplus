import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import Affiliate from '@/models/Affiliate';

export async function GET(request, { params }) {
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

    const { id } = params;

    const affiliate = await Affiliate.findById(id)
      .populate('userId', 'firstName lastName email phone createdAt');

    if (!affiliate) {
      return NextResponse.json(
        { error: 'Affiliate not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      affiliate
    });

  } catch (error) {
    console.error('Error fetching affiliate:', error);
    return NextResponse.json(
      { error: 'Failed to fetch affiliate' },
      { status: 500 }
    );
  }
}

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

    const { id } = params;
    const updateData = await request.json();

    const affiliate = await Affiliate.findById(id);
    if (!affiliate) {
      return NextResponse.json(
        { error: 'Affiliate not found' },
        { status: 404 }
      );
    }

    // Update allowed fields
    const allowedFields = [
      'exnessVerificationStatus',
      'telegramInviteStatus',
      'telegramGroupJoined',
      'notes',
      'isActive'
    ];

    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        affiliate[field] = updateData[field];
      }
    });

    // Handle nested exnessData updates
    if (updateData.exnessData) {
      affiliate.exnessData = { ...affiliate.exnessData, ...updateData.exnessData };
    }

    // Set telegram join date if joining for the first time
    if (updateData.telegramGroupJoined && !affiliate.telegramGroupJoinedAt) {
      affiliate.telegramGroupJoinedAt = new Date();
    }

    await affiliate.save();

    // Populate and return updated affiliate
    await affiliate.populate('userId', 'firstName lastName email phone createdAt');

    return NextResponse.json({
      success: true,
      affiliate,
      message: 'Affiliate updated successfully'
    });

  } catch (error) {
    console.error('Error updating affiliate:', error);
    return NextResponse.json(
      { error: 'Failed to update affiliate' },
      { status: 500 }
    );
  }
}
