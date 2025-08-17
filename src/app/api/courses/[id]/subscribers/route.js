import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import connectDB from '@/lib/mongodb';
import CourseSubscriber from '@/models/CourseSubscriber';
import User from '@/models/User'; // Add this import
import mongoose from 'mongoose';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    console.log(`=== SUBSCRIBERS API ENDPOINT ===`);
    console.log(`📊 Course ID: ${id}`);
    
    // Verify admin authentication using cookies
    const token = await getTokenFromCookies();
    
    if (!token) {
      console.log('❌ No authentication token found');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyAccessToken(token);
    
    if (!decoded || decoded.role !== 'admin') {
      console.log('❌ Invalid token or insufficient permissions');
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    console.log(`✅ Admin authenticated: ${decoded.email}`);

    await connectDB();

    // Validate courseId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log(`❌ Invalid course ID format: ${id}`);
      return NextResponse.json({ error: 'Invalid course ID format' }, { status: 400 });
    }

    // Convert to ObjectId
    const courseObjectId = new mongoose.Types.ObjectId(id);
    console.log(`🔍 Searching for subscribers with courseId: ${courseObjectId}`);

    // First, let's check if the course exists
    const Course = (await import('../../../../../../models/Course')).default;
    const course = await Course.findById(courseObjectId).lean();
    
    if (!course) {
      console.log(`❌ Course not found with ID: ${id}`);
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    
    console.log(`✅ Course found: "${course.title}"`);

    // Check if CourseSubscriber collection exists and has any documents
    const totalSubscribersInDb = await CourseSubscriber.countDocuments({});
    console.log(`📊 Total CourseSubscriber documents in database: ${totalSubscribersInDb}`);

    // Check subscribers for this specific course
    const subscribersForThisCourse = await CourseSubscriber.countDocuments({ courseId: courseObjectId });
    console.log(`📊 Subscribers for course ${id}: ${subscribersForThisCourse}`);

    // If no subscribers, let's see what courseIds exist in the collection
    if (subscribersForThisCourse === 0) {
      const allCourseIds = await CourseSubscriber.distinct('courseId');
      console.log(`📊 All courseIds in CourseSubscriber collection:`, allCourseIds);
      
      // Check if there are any subscribers with string courseId instead of ObjectId
      const stringCourseIdCount = await CourseSubscriber.countDocuments({ courseId: id });
      console.log(`📊 Subscribers with string courseId ${id}: ${stringCourseIdCount}`);
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;

    console.log(`📊 Request params - Search: "${search}", Status: "${status}", Page: ${page}`);

    // Build basic query
    let query = { courseId: new mongoose.Types.ObjectId(id) };

    // Filter by status
    if (status) {
      if (status === 'active') {
        query.isActive = true;
        query.progressPercentage = { $lt: 100 };
      } else if (status === 'completed') {
        query.progressPercentage = { $gte: 100 };
      } else if (status === 'inactive') {
        query.isActive = false;
      }
    }

    console.log(`🔍 Base query:`, JSON.stringify(query));

    // Search functionality - search in username field and populated user fields
    let searchQuery = {};
    if (search) {
      searchQuery = {
        $or: [
          { username: { $regex: search, $options: 'i' } }
        ]
      };
    }

    // Combine queries
    const finalQuery = search ? { ...query, ...searchQuery } : query;
    console.log(`🔍 Final query:`, JSON.stringify(finalQuery));

    // Get total count for pagination
    const total = await CourseSubscriber.countDocuments(finalQuery);
    console.log(`📊 Total subscribers found: ${total}`);
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit);

    // Fetch subscribers with populated user data
    const subscribers = await CourseSubscriber.find(finalQuery)
      .populate({
        path: 'userId',
        select: 'firstName lastName email phone',
        options: { lean: true }
      })
      .sort({ enrolledAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    console.log(`📦 Raw subscribers found: ${subscribers.length}`);

    // Filter by user data if searching (client-side filter for populated fields)
    let filteredSubscribers = subscribers;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredSubscribers = subscribers.filter(subscriber => {
        const user = subscriber.userId;
        if (!user) return false;
        
        return (
          (user.firstName && user.firstName.toLowerCase().includes(searchLower)) ||
          (user.lastName && user.lastName.toLowerCase().includes(searchLower)) ||
          (user.email && user.email.toLowerCase().includes(searchLower)) ||
          (subscriber.username && subscriber.username.toLowerCase().includes(searchLower))
        );
      });
    }

    console.log(`📦 Filtered subscribers: ${filteredSubscribers.length}`);

    // Calculate stats for all subscribers in this course
    const allSubscribers = await CourseSubscriber.find({ courseId: new mongoose.Types.ObjectId(id) }).lean();
    
    const stats = {
      total: allSubscribers.length,
      active: allSubscribers.filter(sub => sub.isActive && sub.progressPercentage < 100).length,
      completed: allSubscribers.filter(sub => sub.progressPercentage >= 100).length,
      inactive: allSubscribers.filter(sub => !sub.isActive).length,
      inProgress: allSubscribers.filter(sub => sub.isActive && sub.progressPercentage > 0 && sub.progressPercentage < 100).length
    };

    console.log(`📊 Stats calculated:`, stats);

    // Format subscribers data
    const formattedSubscribers = filteredSubscribers.map(sub => ({
      _id: sub._id,
      userId: sub.userId ? {
        _id: sub.userId._id,
        firstName: sub.userId.firstName,
        lastName: sub.userId.lastName,
        email: sub.userId.email,
        phone: sub.userId.phone
      } : null,
      username: sub.username,
      productId: sub.productId,
      transactionId: sub.transactionId,
      paymentAmount: sub.paymentAmount,
      currency: sub.currency,
      isActive: sub.isActive,
      completedLessons: sub.completedLessons,
      progressPercentage: sub.progressPercentage,
      enrolledAt: sub.enrolledAt,
      lastAccessedAt: sub.lastAccessedAt,
      completedAt: sub.completedAt,
      certificateIssued: sub.certificateIssued,
      certificateIssuedAt: sub.certificateIssuedAt
    }));

    console.log(`✅ Returning ${formattedSubscribers.length} formatted subscribers`);
    console.log(`📊 Stats:`, stats);

    return NextResponse.json({
      subscribers: formattedSubscribers,
      stats,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount: total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('❌ ERROR in subscribers API:', error);
    console.error('Stack trace:', error.stack);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch course subscribers' },
      { status: 500 }
    );
  }
}
