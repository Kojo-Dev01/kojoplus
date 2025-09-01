import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import connectDB from '@/lib/mongodb';
import Course from '@/models/Course';

export async function GET(request) {
  console.log('🎓 Academy API: Starting academy overview fetch...');
  
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
    // Get academy overview stats
    const courseStats = await Course.aggregate([
      {
        $group: {
          _id: null,
          totalCourses: { $sum: 1 },
          publishedCourses: { $sum: { $cond: ['$isPublished', 1, 0] } },
          draftCourses: { $sum: { $cond: [{ $not: '$isPublished' }, 1, 0] } },
          totalModules: { $sum: { $size: { $ifNull: ['$modules', []] } } },
          totalLessons: { 
            $sum: { 
              $sum: { 
                $map: { 
                  input: '$modules', 
                  as: 'module', 
                  in: { $size: { $ifNull: ['$$module.lessons', []] } } 
                } 
              } 
            } 
          },
          averagePrice: { $avg: '$price' }
        }
      }
    ]);

    // Get category breakdown
    const categoryStats = await Course.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          published: { $sum: { $cond: ['$isPublished', 1, 0] } }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get recent courses
    const recentCourses = await Course.find()
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title description category isPublished createdAt updatedAt');

    const stats = courseStats[0] || {
      totalCourses: 0,
      publishedCourses: 0,
      draftCourses: 0,
      totalModules: 0,
      totalLessons: 0,
      averagePrice: 0
    };

    console.log('✅ Academy API: Returning academy overview');

    return NextResponse.json({
      stats,
      categoryBreakdown: categoryStats,
      recentCourses,
      success: true
    });

  } catch (error) {
    console.error('❌ Academy API: Error fetching academy overview:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
