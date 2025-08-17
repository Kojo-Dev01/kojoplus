import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import connectDB from '@/lib/mongodb';
import Course from '@/models/Course';
import { uploadToWasabi } from '@/lib/s3Upload';

export async function GET(request) {
  try {
    // Verify admin authentication using cookies
    const token = await getTokenFromCookies();
    
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyAccessToken(token);
    
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    // Fix null slugs on first load (optional - run once)
    // Uncomment the line below to fix existing null slugs




    // Do not delete ......................
    // await Course.fixNullSlugs();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const section = searchParams.get('section');
    const level = searchParams.get('level');
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const courseType = searchParams.get('courseType'); // New filter
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;

    let query = {};

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by section
    if (section) {
      query.section = section;
    }

    // Filter by level
    if (level) {
      query.level = level;
    }

    // Filter by course type
    if (courseType) {
      query.courseType = courseType;
    }

    // Filter by status
    if (status === 'published') {
      query.isPublished = true;
    } else if (status === 'draft') {
      query.isPublished = false;
    }

    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { instructor: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
        { productId: { $regex: search, $options: 'i' } } // Include productId in search
      ];
    }

    const skip = (page - 1) * limit;

    const courses = await Course.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCount = await Course.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    // Get statistics
    const stats = await Course.getStats();
    const categoryStats = await Course.getCategoryStats();
    const sectionStats = await Course.getSectionStats();

    const statsData = stats[0] || {
      total: 0,
      published: 0,
      premium: 0,
      free: 0,
      paid: 0,
      totalEnrollments: 0,
      totalCompletions: 0,
      avgRating: 0,
      totalRevenue: 0
    };

    return NextResponse.json({
      courses,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      stats: statsData,
      categoryStats,
      sectionStats
    });

  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    // Verify admin authentication using cookies
    const token = await getTokenFromCookies();
    
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyAccessToken(token);
    
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const formData = await request.formData();
    
    // Basic course information
    const title = formData.get('title');
    const description = formData.get('description');
    const shortDescription = formData.get('shortDescription');
    const category = formData.get('category');
    const section = formData.get('section');
    const level = formData.get('level');
    const instructor = formData.get('instructor');
    
    // Course type and pricing
    const courseType = formData.get('courseType') || 'free';
    const price = parseFloat(formData.get('price')) || 0;
    const productId = formData.get('productId');
    const purchaseLink = formData.get('purchaseLink');
    
    const isPremium = formData.get('isPremium') === 'true';
    const accessLevel = formData.get('accessLevel');
    const isPublished = formData.get('isPublished') === 'true';
    const isFeatured = formData.get('isFeatured') === 'true';
    
    // Files
    const thumbnail = formData.get('thumbnail');
    const introVideo = formData.get('introVideo');
    
    // Arrays
    const tagsData = formData.get('tags');
    const prerequisitesData = formData.get('prerequisites');
    const learningOutcomesData = formData.get('learningOutcomes');

    // Validation
    if (!title || !description || !category || !section || !level) {
      return NextResponse.json(
        { error: 'Title, description, category, section, and level are required' },
        { status: 400 }
      );
    }

    if (courseType === 'paid') {
      if (!price || price <= 0) {
        return NextResponse.json(
          { error: 'Price is required and must be greater than 0 for paid courses' },
          { status: 400 }
        );
      }
      if (!productId || !productId.trim()) {
        return NextResponse.json(
          { error: 'Product ID is required for paid courses' },
          { status: 400 }
        );
      }
      if (!purchaseLink || !purchaseLink.trim()) {
        return NextResponse.json(
          { error: 'Purchase link is required for paid courses' },
          { status: 400 }
        );
      }
    }

    // Check for duplicate product ID if provided
    if (productId && productId.trim()) {
      const existingCourse = await Course.findByProductId(productId.trim());
      if (existingCourse) {
        return NextResponse.json(
          { error: 'A course with this product ID already exists' },
          { status: 400 }
        );
      }
    }

    let thumbnailUpload = null;
    let introVideoUpload = null;

    // Upload thumbnail if provided
    if (thumbnail && thumbnail.size > 0) {
      if (!thumbnail.type.startsWith('image/')) {
        return NextResponse.json(
          { error: 'Thumbnail must be an image file' },
          { status: 400 }
        );
      }

      if (thumbnail.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'Thumbnail size must be less than 5MB' },
          { status: 400 }
        );
      }

      thumbnailUpload = await uploadToWasabi(thumbnail, 'courses/thumbnails');
      if (!thumbnailUpload.success) {
        return NextResponse.json(
          { error: 'Failed to upload thumbnail' },
          { status: 500 }
        );
      }
    }

    // Upload intro video if provided
    if (introVideo && introVideo.size > 0) {
      if (!introVideo.type.startsWith('video/')) {
        return NextResponse.json(
          { error: 'Intro video must be a video file' },
          { status: 400 }
        );
      }

      if (introVideo.size > 500 * 1024 * 1024) { // 500MB limit
        return NextResponse.json(
          { error: 'Intro video size must be less than 100MB' },
          { status: 400 }
        );
      }

      introVideoUpload = await uploadToWasabi(introVideo, 'courses/intro-videos');
      if (!introVideoUpload.success) {
        return NextResponse.json(
          { error: 'Failed to upload intro video' },
          { status: 500 }
        );
      }
    }

    // Parse arrays
    let tags = [];
    if (tagsData) {
      try {
        tags = JSON.parse(tagsData).filter(tag => tag.trim());
      } catch (e) {
        tags = tagsData.split(',').map(tag => tag.trim()).filter(tag => tag);
      }
    }

    let prerequisites = [];
    if (prerequisitesData) {
      try {
        prerequisites = JSON.parse(prerequisitesData).filter(item => item.trim());
      } catch (e) {
        prerequisites = prerequisitesData.split(',').map(item => item.trim()).filter(item => item);
      }
    }

    let learningOutcomes = [];
    if (learningOutcomesData) {
      try {
        learningOutcomes = JSON.parse(learningOutcomesData).filter(item => item.trim());
      } catch (e) {
        learningOutcomes = learningOutcomesData.split(',').map(item => item.trim()).filter(item => item);
      }
    }

    // Create course
    const course = new Course({
      title: title.trim(),
      description: description.trim(),
      shortDescription: shortDescription?.trim() || '',
      category,
      section,
      level,
      instructor: instructor?.trim() || 'KojoForex',
      courseType,
      price: courseType === 'paid' ? price : 0,
      productId: courseType === 'paid' ? productId.trim() : null,
      purchaseLink: courseType === 'paid' ? purchaseLink.trim() : null,
      isPremium: courseType === 'paid' ? true : isPremium, // Auto-set for paid courses
      accessLevel,
      isPublished,
      isFeatured,
      thumbnailUrl: thumbnailUpload?.url || null,
      thumbnailKey: thumbnailUpload?.key || null,
      introVideoUrl: introVideoUpload?.url || null,
      introVideoKey: introVideoUpload?.key || null,
      tags,
      prerequisites,
      learningOutcomes,
      modules: [], // Start with empty modules array
      enrollments: 0,
      completions: 0,
      views: 0,
      rating: 0,
      ratingCount: 0,
      // slug: title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    });

    await course.save();

    return NextResponse.json(
      { success: true, course },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating course:', error);
    
    // Handle specific MongoDB errors
    
    return NextResponse.json(
      { error: error.message || 'Failed to create course' },
      { status: 500 }
    );
  }
}
