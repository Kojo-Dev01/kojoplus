import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import MentorshipBooking from '@/models/MentorshipBooking';

export async function GET(request) {
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

    // Build query
    const query = {};
    
    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sort = {};
    sort[sortBy] = sortOrder;

    // Fetch bookings with pagination
    const [bookings, totalCount] = await Promise.all([
      MentorshipBooking.find(query)
        .populate('userId', 'firstName lastName email phone')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      MentorshipBooking.countDocuments(query)
    ]);

    // Calculate stats
    const stats = await MentorshipBooking.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statsObject = {
      total: totalCount,
      pending: 0,
      contacted: 0,
      scheduled: 0,
      completed: 0,
      cancelled: 0
    };

    stats.forEach(stat => {
      statsObject[stat._id] = stat.count;
    });

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return NextResponse.json({
      success: true,
      bookings,
      stats: statsObject,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext,
        hasPrev,
        limit
      }
    });

  } catch (error) {
    console.error('Error fetching mentorship bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mentorship bookings' },
      { status: 500 }
    );
  }
}
