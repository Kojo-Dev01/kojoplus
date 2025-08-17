import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import connectDB from '@/lib/mongodb';
import Resource from '@/models/Resource';
import { uploadToWasabi, deleteFromWasabi } from '@/lib/s3Upload';

// Helper function to sanitize filename for Wasabi S3 compatibility
function sanitizeFilename(filename) {
  if (!filename) return 'untitled';
  
  // Get file extension
  const lastDotIndex = filename.lastIndexOf('.');
  const name = lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
  const extension = lastDotIndex > 0 ? filename.substring(lastDotIndex) : '';
  
  // Replace invalid characters with underscores
  const sanitizedName = name
    .replace(/[^\w\-_.]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 100);
  
  const finalName = sanitizedName || 'resource';
  const timestamp = Date.now();
  
  return `${finalName}_${timestamp}${extension.toLowerCase()}`;
}

export async function GET(request, { params }) {
  try {
    await connectDB();
    
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Resource ID is required' },
        { status: 400 }
      );
    }

    const resource = await Resource.findById(id);
    
    if (!resource) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      resource
    });

  } catch (error) {
    console.error('❌ Resources API: Error fetching resource:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
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

    // Verify user still exists and is active
    await connectDB();

    const resource = await Resource.findById(params.id);
    if (!resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

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
    const thumbnail = formData.get('thumbnail');

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
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

    // Handle thumbnail upload if provided
    let thumbnailUrl = resource.thumbnailUrl;
    let thumbnailKey = resource.thumbnailKey;

    if (thumbnail && thumbnail.size > 0) {
      if (!thumbnail.type.startsWith('image/')) {
        return NextResponse.json(
          { error: 'Thumbnail must be an image file' },
          { status: 400 }
        );
      }

      if (thumbnail.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'Thumbnail size must be less than 10MB' },
          { status: 400 }
        );
      }

      // Delete old thumbnail if it exists
      if (resource.thumbnailKey) {
        try {
          await deleteFromWasabi(resource.thumbnailKey);
        } catch (error) {
          console.warn('Failed to delete old thumbnail:', error);
        }
      }

      // Upload new thumbnail
      const sanitizedThumbnailName = sanitizeFilename(thumbnail.name);
      const sanitizedThumbnail = new File([thumbnail], sanitizedThumbnailName, {
        type: thumbnail.type,
        lastModified: thumbnail.lastModified,
      });

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

    // Update resource data
    const updateData = {
      title: title.trim(),
      description: description.trim(),
      type,
      category,
      url: url?.trim() || null,
      content: content?.trim() || null,
      duration: duration?.trim() || null,
      difficulty: difficulty || 'beginner',
      tags,
      metaDescription: metaDescription?.trim() || null,
      isPremium,
      accessLevel: accessLevel || 'public',
      isPublished,
      status: isPublished ? 'published' : 'draft',
      author: author?.trim() || 'Kojo Team',
      thumbnailUrl,
      thumbnailKey
    };

    const updatedResource = await Resource.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      resource: updatedResource,
      message: 'Resource updated successfully'
    });

  } catch (error) {
    console.error('Error updating resource:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update resource' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
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

    // Verify user still exists and is active
    await connectDB();

    const resource = await Resource.findById(params.id);
    if (!resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    // Delete files from Wasabi S3 if they exist
    const filesToDelete = [];
    
    if (resource.fileKey) {
      filesToDelete.push(resource.fileKey);
    }
    
    if (resource.thumbnailKey) {
      filesToDelete.push(resource.thumbnailKey);
    }

    // Delete files from storage (don't fail if deletion fails)
    for (const fileKey of filesToDelete) {
      try {
        await deleteFromWasabi(fileKey);
        console.log(`Successfully deleted file: ${fileKey}`);
      } catch (error) {
        console.warn(`Failed to delete file ${fileKey}:`, error);
        // Continue with database deletion even if file deletion fails
      }
    }

    // Delete from database
    await Resource.findByIdAndDelete(params.id);

    return NextResponse.json({
      success: true,
      message: 'Resource deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting resource:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete resource' },
      { status: 500 }
    );
  }
}
