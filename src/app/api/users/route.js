import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import COUNTRY_CODES from '@/data/countryCodes.json';

// Helper function to get country from phone number
function getCountryFromPhoneNumber(phoneNumber) {
  if (!phoneNumber) return null;
  
  // Clean the number (remove spaces, dashes, etc.)
  const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
  
  // Sort country codes by length (longest first) to match longer codes first
  const sortedCodes = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
  
  for (const countryData of sortedCodes) {
    if (cleanNumber.startsWith(countryData.code)) {
      return countryData.country;
    }
  }
  
  return null;
}

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
    const country = searchParams.get('country') || '';
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;
    const all = searchParams.get('all') === 'true';
    const exportCsv = searchParams.get('export') === 'csv';

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

    // Handle country filtering - this is the complex part
    let countryFilteredUsers = [];
    let shouldFilterByCountry = false;

    if (country) {
      shouldFilterByCountry = true;
      
      // Get all users first, then filter by country
      const allUsersForCountryFilter = await User.find(query)
        .select('firstName lastName email phone whatsapp isActive emailVerified createdAt lastLoginAt')
        .lean();

      // Filter by country on the backend
      countryFilteredUsers = allUsersForCountryFilter.filter(user => {
        const userCountry = getCountryFromPhoneNumber(user.phone || user.whatsapp);
        return userCountry === country;
      });

      console.log(`Country filter: ${country}, Found ${countryFilteredUsers.length} users`);
    }

    // Handle CSV export
    if (exportCsv) {
      let exportUsers;
      
      if (shouldFilterByCountry) {
        exportUsers = countryFilteredUsers;
      } else {
        exportUsers = await User.find(query)
          .select('firstName lastName email phone whatsapp isActive emailVerified createdAt lastLoginAt')
          .sort({ createdAt: -1 })
          .lean();
      }

      // Generate CSV content
      const csvHeaders = [
        'First Name',
        'Last Name', 
        'Email',
        'Phone',
        'WhatsApp',
        'Country',
        'Status',
        'Email Verified',
        'Created Date',
        'Last Login'
      ];

      const csvRows = exportUsers.map(user => {
        const userCountry = getCountryFromPhoneNumber(user.phone || user.whatsapp);
        return [
          user.firstName || '',
          user.lastName || '',
          user.email || '',
          user.phone || '',
          user.whatsapp || '',
          userCountry || 'Unknown',
          user.isActive ? 'Active' : 'Inactive',
          user.emailVerified ? 'Verified' : 'Unverified',
          user.createdAt ? new Date(user.createdAt).toISOString().split('T')[0] : '',
          user.lastLoginAt ? new Date(user.lastLoginAt).toISOString().split('T')[0] : 'Never'
        ];
      });

      // Create CSV content
      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
      ].join('\n');

      // Generate filename with current date and filters
      const today = new Date().toISOString().split('T')[0];
      let filename = `users-export-${today}`;
      
      if (country) filename += `-${country.toLowerCase().replace(/\s+/g, '-')}`;
      if (status) filename += `-${status}`;
      if (verification) filename += `-${verification}`;
      if (search) filename += `-search`;
      
      filename += '.csv';

      return new Response(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-cache'
        }
      });
    }

    // If requesting all users (for bulk operations)
    if (all) {
      let allUsers;
      
      if (shouldFilterByCountry) {
        allUsers = countryFilteredUsers;
      } else {
        allUsers = await User.find(query)
          .select('firstName lastName email phone whatsapp isActive emailVerified createdAt')
          .sort({ createdAt: -1 })
          .lean();
      }

      return NextResponse.json({
        success: true,
        users: allUsers,
        count: allUsers.length
      });
    }

    // Handle pagination for country-filtered results
    if (shouldFilterByCountry) {
      // Sort the filtered results
      countryFilteredUsers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      // Apply pagination manually
      const skip = (page - 1) * limit;
      const paginatedUsers = countryFilteredUsers.slice(skip, skip + limit);
      
      // Calculate pagination info
      const totalCount = countryFilteredUsers.length;
      const totalPages = Math.ceil(totalCount / limit);
      const pagination = {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1
      };

      // Calculate statistics for country-filtered results
      const stats = {
        total: totalCount,
        active: countryFilteredUsers.filter(user => user.isActive).length,
        inactive: countryFilteredUsers.filter(user => !user.isActive).length,
        verified: countryFilteredUsers.filter(user => user.emailVerified).length,
        unverified: countryFilteredUsers.filter(user => !user.emailVerified).length
      };

      return NextResponse.json({
        success: true,
        users: paginatedUsers,
        pagination,
        stats
      });
    }

    // Regular paginated response (no country filter)
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
      { $match: query },
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
