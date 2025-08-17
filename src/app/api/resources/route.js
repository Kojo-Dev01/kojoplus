import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Resource from '@/models/Resource';
import { uploadToWasabi } from '@/lib/s3Upload';

// Helper function to sanitize filename for Wasabi S3 compatibility
function sanitizeFilename(filename) {
  if (!filename) return 'untitled';
  
  // Get file extension
  const lastDotIndex = filename.lastIndexOf('.');
  const name = lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
  const extension = lastDotIndex > 0 ? filename.substring(lastDotIndex) : '';
  
  // Replace invalid characters with underscores
  // S3/Wasabi doesn't support: spaces, special chars except dash, underscore, period
  const sanitizedName = name
    .replace(/[^\w\-_.]/g, '_') // Replace invalid chars with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
    .substring(0, 100); // Limit length to avoid issues
  
  // Ensure we have a valid name
  const finalName = sanitizedName || 'resource';
  
  // Add timestamp to ensure uniqueness
  const timestamp = Date.now();
  
  return `${finalName}_${timestamp}${extension.toLowerCase()}`;
}

export async function GET(request) {
  console.log('📚 Resources API: Starting resources fetch...');
  
  try {
    // Use cookie-based authentication like courses API
    await connectDB();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const all = searchParams.get('all');

    let query = {};

    // Filter by type
    if (type) {
      query.type = type;
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
        { author: { $regex: search, $options: 'i' } }
      ];
    }

    // If requesting all resources (for bulk operations)
    if (all === 'true') {
      const resources = await Resource.find(query)
        .sort({ createdAt: -1 });

      return NextResponse.json({
        resources
      });
    }

    // Paginated response
    const skip = (page - 1) * limit;

    const resources = await Resource.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCount = await Resource.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    // Calculate stats
    const stats = await Resource.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          published: { $sum: { $cond: ['$isPublished', 1, 0] } },
          draft: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
          totalViews: { $sum: '$views' },
          totalDownloads: { $sum: '$downloads' },
          totalLikes: { $sum: { $size: { $ifNull: ['$likes', []] } } }
        }
      }
    ]);

    // Get type breakdown
    const typeStats = await Resource.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    const statsData = stats[0] || {
      total: 0,
      published: 0,
      draft: 0,
      totalViews: 0,
      totalDownloads: 0,
      totalLikes: 0
    };

    // Add type breakdown to stats
    statsData.typeBreakdown = typeStats.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    return NextResponse.json({
      resources,
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
    console.error('❌ Resources API: Error fetching resources:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    // Use cookie-based authentication like courses API
    await connectDB();

    const formData = await request.formData();
    const title = formData.get('title');
    const description = formData.get('description');
    const type = formData.get('type');
    const category = formData.get('category');
    const url = formData.get('url');
    const content = formData.get('content');
    const duration = formData.get('duration');
    const difficulty = formData.get('difficulty');
    const author = formData.get('author');
    const isPremium = formData.get('isPremium') === 'true';
    const accessLevel = formData.get('accessLevel');
    const isPublished = formData.get('isPublished') === 'true';
    const metaDescription = formData.get('metaDescription');
    const tagsData = formData.get('tags');

    // Handle file uploads
    const file = formData.get('file');
    const thumbnail = formData.get('thumbnail');

    if (!title || !description || !type || !category) {
      return NextResponse.json(
        { error: 'Title, description, type, and category are required' },
        { status: 400 }
      );
    }

    // Parse tags
    let tags = [];
    if (tagsData) {
      try {
        tags = JSON.parse(tagsData);
      } catch (e) {
        tags = tagsData
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag);
      }
    }

    let fileUrl = null;
    let fileKey = null;
    let fileName = null;
    let fileSize = null;
    let fileMimeType = null;
    let thumbnailUrl = null;
    let thumbnailKey = null;

    // Handle main file upload
    if (file && file.size > 0) {
      // Validate file size (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'File size must be less than 100MB' },
          { status: 400 }
        );
      }

      // Sanitize filename for S3/Wasabi compatibility
      const sanitizedFilename = sanitizeFilename(file.name);
      
      // Create a new File object with sanitized name
      const sanitizedFile = new File([file], sanitizedFilename, {
        type: file.type,
        lastModified: file.lastModified,
      });

      console.log(`Original filename: ${file.name}, Sanitized: ${sanitizedFilename}`);

      const uploadResult = await uploadToWasabi(sanitizedFile, 'resources');
      
      if (!uploadResult.success) {
        return NextResponse.json(
          { error: 'Failed to upload file: ' + uploadResult.error },
          { status: 500 }
        );
      }

      fileUrl = uploadResult.url;
      fileKey = uploadResult.key;
      fileName = sanitizedFilename; // Store sanitized filename
      fileSize = file.size;
      fileMimeType = file.type;
    }

    // Handle thumbnail upload
    if (thumbnail && thumbnail.size > 0) {
      if (!thumbnail.type.startsWith('image/')) {
        return NextResponse.json(
          { error: 'Thumbnail must be an image file' },
          { status: 400 }
        );
      }

      // Validate thumbnail size (max 10MB)
      if (thumbnail.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'Thumbnail size must be less than 10MB' },
          { status: 400 }
        );
      }

      // Sanitize thumbnail filename
      const sanitizedThumbnailName = sanitizeFilename(thumbnail.name);
      
      // Create a new File object with sanitized name
      const sanitizedThumbnail = new File([thumbnail], sanitizedThumbnailName, {
        type: thumbnail.type,
        lastModified: thumbnail.lastModified,
      });

      console.log(`Original thumbnail: ${thumbnail.name}, Sanitized: ${sanitizedThumbnailName}`);

      const thumbnailResult = await uploadToWasabi(sanitizedThumbnail, 'resources/thumbnails');
      
      if (!thumbnailResult.success) {
        return NextResponse.json(
          { error: 'Failed to upload thumbnail: ' + thumbnailResult.error },
          { status: 500 }
        );
      }

      thumbnailUrl = thumbnailResult.url;
      thumbnailKey = thumbnailResult.key;
    }

    // Create resource
    const resource = new Resource({
      title: title.trim(),
      description: description.trim(),
      type,
      category,
      url: url?.trim() || null,
      fileUrl,
      fileKey,
      fileName,
      fileSize,
      fileMimeType,
      thumbnailUrl,
      thumbnailKey,
      content: content?.trim() || null,
      duration: duration?.trim() || null,
      difficulty: difficulty || 'beginner',
      tags,
      metaDescription: metaDescription?.trim() || null,
      isPremium,
      accessLevel: accessLevel || 'public',
      isPublished,
      status: isPublished ? 'published' : 'draft',
      createdBy: 'Admin', // You can update this to get from session
      author: author?.trim() || 'Kojo Team'
    });

    await resource.save();

    return NextResponse.json({
      success: true,
      resource,
      message: 'Resource created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Resources API: Error creating resource:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
