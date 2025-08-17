import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import connectDB from '@/lib/mongodb';
import Course from '@/models/Course';

export async function POST(request) {
  try {
    // Verify admin authentication
    const token = await getTokenFromCookies();
    
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyAccessToken(token);
    
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    // Fix null slugs
    const result = await Course.fixNullSlugs();

    if (result.success) {
      return NextResponse.json({ 
        message: `Successfully fixed ${result.fixed} courses with null slugs`,
        fixed: result.fixed
      });
    } else {
      return NextResponse.json({ 
        error: result.error 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error fixing slugs:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fix slugs' 
    }, { status: 500 });
  }
}
