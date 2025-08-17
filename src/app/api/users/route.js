import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(request) {
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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const verification = searchParams.get('verification') || '';
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;
    const all = searchParams.get('all') === 'true';

    // Build query object
    let query = {};

    // Search by email, firstName, or lastName
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by status
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    // Filter by verification status
    if (verification === 'verified') {
      query.emailVerified = true;
    } else if (verification === 'unverified') {
      query.emailVerified = false;
    }

    // If requesting all users (for bulk operations)
    if (all) {
      const allUsers = await User.find(query)
        .select('firstName lastName email phone whatsapp isActive emailVerified createdAt')
        .sort({ createdAt: -1 })
        .lean();

      return NextResponse.json({
        success: true,
        users: allUsers,
        count: allUsers.length
      });
    }

    // Paginated response
    const skip = (page - 1) * limit;

    const [users, totalCount] = await Promise.all([
      User.find(query)
        .select('firstName lastName email phone whatsapp isActive emailVerified createdAt lastLoginAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const pagination = {
      currentPage: page,
      totalPages,
      totalCount,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };

    // Calculate statistics
    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: ['$isActive', 1, 0] } },
          inactive: { $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] } },
          verified: { $sum: { $cond: ['$emailVerified', 1, 0] } },
          unverified: { $sum: { $cond: [{ $eq: ['$emailVerified', false] }, 1, 0] } }
        }
      }
    ]);

    const statsData = stats[0] || {
      total: 0,
      active: 0,
      inactive: 0,
      verified: 0,
      unverified: 0
    };

    return NextResponse.json({
      success: true,
      users,
      pagination,
      stats: statsData
    });

  } catch (error) {
    console.error('❌ Users API: Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
