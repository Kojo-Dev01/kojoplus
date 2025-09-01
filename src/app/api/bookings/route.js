import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';

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
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const dateRange = searchParams.get('dateRange');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;

    let query = {};

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Search functionality
    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } }
      ];
    }

    // Date range filter
    if (dateRange) {
      const now = new Date();
      let startDate;
      
      switch (dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          query.bookingDate = {
            $gte: startDate,
            $lt: new Date(startDate.getTime() + 24 * 60 * 60 * 1000)
          };
          break;
        case 'tomorrow':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
          query.bookingDate = {
            $gte: startDate,
            $lt: new Date(startDate.getTime() + 24 * 60 * 60 * 1000)
          };
          break;
        case 'week':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          query.bookingDate = {
            $gte: startDate,
            $lt: new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000)
          };
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          query.bookingDate = {
            $gte: startDate,
            $lt: new Date(now.getFullYear(), now.getMonth() + 1, 1)
          };
          break;
      }
    }

    const skip = (page - 1) * limit;
    const bookings = await Booking.find(query)
      .populate('bookingSlotId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalBookings = await Booking.countDocuments(query);
    const totalPages = Math.ceil(totalBookings / limit);

    // Get stats
    const stats = await Booking.getBookingStats();
    const totalRevenue = await Booking.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$paymentAmount' } } }
    ]);

    return NextResponse.json({
      bookings,
      pagination: {
        currentPage: page,
        totalPages,
        totalBookings,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      stats: {
        ...stats.reduce((acc, stat) => ({ ...acc, [stat._id]: stat.count }), {}),
        total: totalBookings,
        revenue: totalRevenue[0]?.total || 0
      }
    });

  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
