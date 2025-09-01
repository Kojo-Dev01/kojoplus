import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import connectDB from '@/lib/mongodb';
import Affiliate from '@/models/Affiliate';

export async function GET(request) {
  console.log('🤝 Affiliates API: Starting affiliates fetch...');
  
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
    const country = searchParams.get('country');
    const telegramStatus = searchParams.get('telegramStatus');
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;
    const all = searchParams.get('all') === 'true';

    let query = {};

    // Filters
    if (country) query.country = country;
    if (telegramStatus) query.telegramInviteStatus = telegramStatus;
    if (isActive !== null && isActive !== '') query.isActive = isActive === 'true';
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    if (all) {
      // Return all affiliates for bulk operations
      const allAffiliates = await Affiliate.find(query)
        .select('firstName lastName email phone isActive telegramGroupJoined exnessVerificationStatus')
        .sort({ createdAt: -1 });

      return NextResponse.json({
        affiliates: allAffiliates,
        success: true
      });
    }

    // Paginated results
    const skip = (page - 1) * limit;
    const affiliates = await Affiliate.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCount = await Affiliate.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    // Calculate stats
    const stats = await Affiliate.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: ['$isActive', 1, 0] } },
          verified: { $sum: { $cond: [{ $eq: ['$exnessVerificationStatus', 'verified'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$exnessVerificationStatus', 'pending'] }, 1, 0] } },
          telegramGenerated: { $sum: { $cond: [{ $eq: ['$telegramInviteStatus', 'generated'] }, 1, 0] } },
          telegramJoined: { $sum: { $cond: ['$telegramGroupJoined', 1, 0] } }
        }
      }
    ]);

    const statsData = stats[0] || {
      total: 0,
      active: 0,
      verified: 0,
      pending: 0,
      telegramGenerated: 0,
      telegramJoined: 0
    };

    return NextResponse.json({
      affiliates,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      stats: statsData
    });

  } catch (error) {
    console.error('❌ Affiliates API: Error fetching affiliates:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
