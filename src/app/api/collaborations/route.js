import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import connectDB from '@/lib/mongodb';
import Collaboration from '@/models/Collaboration';

export async function GET(request) {
  console.log('🤝 Collaborations API: Starting collaborations fetch...');
  
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
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const search = searchParams.get('search');   
    const collaborationType = searchParams.get('collaborationType');
    const priority = searchParams.get('priority');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;

    let query = {};

    if (status) {
      query.status = status;
    }

    if (type) {
      query.type = type;
    }

        // Filter by collaboration type
    if (collaborationType) {
      query.collaborationType = collaborationType;
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
        { company: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'partner.name': { $regex: search, $options: 'i' } },
        { 'partner.email': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const collaborations = await Collaboration.find(query)
      .populate('submittedBy')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCount = await Collaboration.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

        // Get stats
    const stats2 = await Collaboration.getStats();
    

    // Calculate stats
    const stats = await Collaboration.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } }
        }
      }
    ]);

    const statusCounts = stats2.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    const statsData = stats[0] || {
      total: 0,
      active: 0,
      pending: 0,
      completed: 0,
      cancelled: 0
    };

    console.log('✅ Collaborations API: Returning', collaborations.length, 'collaborations');

    return NextResponse.json({
      collaborations,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      stats: {
        total: totalCount,
        pending: statusCounts.pending || 0,
        reviewed: statusCounts.reviewed || 0,
        accepted: statusCounts.accepted || 0,
        rejected: statusCounts.rejected || 0,
        completed: statusCounts.completed || 0
      }

    });

  } catch (error) {
    console.error('❌ Collaborations API: Error fetching collaborations:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
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

    const body = await request.json();
    const { title, description, type, partner, terms, deliverables } = body;

    if (!title || !description || !type || !partner) {
      return NextResponse.json(
        { message: 'Title, description, type, and partner are required' },
        { status: 400 }
      );
    }

    const collaboration = new Collaboration({
      title: title.trim(),
      description: description.trim(),
      type,
      partner,
      terms,
      deliverables,
      status: 'pending',
      createdBy: authResult.user.userId
    });

    await collaboration.save();
    await collaboration.populate('createdBy', 'firstName lastName email');

    console.log('✅ Collaborations API: Collaboration created successfully');

    return NextResponse.json({
      collaboration,
      message: 'Collaboration created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Collaborations API: Error creating collaboration:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
