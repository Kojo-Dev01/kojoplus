import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import connectDB from '@/lib/mongodb';
import Enquiry from '@/models/Enquiry';

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
    const enquiryType = searchParams.get('enquiryType');
    const priority = searchParams.get('priority');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;

    let query = {};

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by enquiry type
    if (enquiryType) {
      query.enquiryType = enquiryType;
    }

    // Filter by priority
    if (priority) {
      query.priority = priority;
    }

    // Search functionality
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const enquiries = await Enquiry.find(query)
      .populate('submittedBy')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalEnquiries = await Enquiry.countDocuments(query);
    const totalPages = Math.ceil(totalEnquiries / limit);

    // Get stats
    const stats = await Enquiry.getStats();
    const statusCounts = stats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    return NextResponse.json({
      enquiries,
      pagination: {
        currentPage: page,
        totalPages,
        totalEnquiries,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      stats: {
        total: totalEnquiries,
        pending: statusCounts.pending || 0,
        'in-progress': statusCounts['in-progress'] || 0,
        resolved: statusCounts.resolved || 0,
        closed: statusCounts.closed || 0
      }
    });

  } catch (error) {
    console.error('Error fetching enquiries:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
