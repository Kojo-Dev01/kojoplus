import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxLength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxLength: [2000, 'Description cannot exceed 2000 characters']
  },
  type: {
    type: String,
    required: true,
    enum: ['video', 'article', 'ebook', 'webinar', 'podcast', 'infographic', 'tool', 'template', 'course'],
    default: 'article'
  },
  category: {
    type: String,
    required: true,
    enum: ['trading', 'analysis', 'education', 'strategy', 'market-news', 'tutorial', 'beginner', 'advanced', 'tools', 'general'],
    default: 'general'
  },
  // For videos, articles, external links
  url: {
    type: String,
    trim: true,
    validate: {
      validator: function(value) {
        // Only validate URL format if it's provided
        if (!value) return true;
        const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
        return urlRegex.test(value);
      },
      message: 'Please provide a valid URL'
    }
  },
  // For uploaded files (PDFs, images, etc.)
  fileUrl: {
    type: String,
    trim: true
  },
  fileKey: {
    type: String,
    trim: true // S3/Wasabi key for deletion
  },
  fileName: {
    type: String,
    trim: true
  },
  fileSize: {
    type: Number // in bytes
  },
  fileMimeType: {
    type: String,
    trim: true
  },
  // Thumbnail/preview image
  thumbnailUrl: {
    type: String,
    trim: true
  },
  thumbnailKey: {
    type: String,
    trim: true
  },
  // Content details
  content: {
    type: String, // For articles or rich text content
    trim: true
  },
  duration: {
    type: String, // For videos/podcasts (e.g., "15:30")
    trim: true
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'beginner'
  },
  // SEO and metadata
  tags: [{
    type: String,
    trim: true
  }],
  metaDescription: {
    type: String,
    trim: true,
    maxLength: [300, 'Meta description cannot exceed 300 characters']
  },
  // Publishing
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date
  },
  scheduledFor: {
    type: Date // For scheduling resources
  },
  // Access control
  isPremium: {
    type: Boolean,
    default: false
  },
  accessLevel: {
    type: String,
    enum: ['public', 'members', 'premium', 'admin'],
    default: 'public'
  },
  // Engagement metrics
  views: {
    type: Number,
    default: 0
  },
  downloads: {
    type: Number,
    default: 0
  },
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    likedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Creator information
  createdBy: {
    type: String, // Admin identifier
    required: true,
    default: 'Admin'
  },
  author: {
    type: String, // Display author name
    trim: true
  },
  // External resource details
  externalSource: {
    type: String, // YouTube, Vimeo, etc.
    trim: true
  },
  externalId: {
    type: String, // Video ID, etc.
    trim: true
  },
  // Status and workflow
  status: {
    type: String,
    enum: ['draft', 'review', 'approved', 'published', 'archived'],
    default: 'draft'
  },
  // Analytics
  lastViewedAt: {
    type: Date
  },
  popularityScore: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for better query performance
resourceSchema.index({ type: 1, category: 1 });
resourceSchema.index({ isPublished: 1, publishedAt: -1 });
resourceSchema.index({ tags: 1 });
resourceSchema.index({ createdAt: -1 });
resourceSchema.index({ views: -1 });
resourceSchema.index({ status: 1 });
resourceSchema.index({ accessLevel: 1 });

// Virtual for like count
resourceSchema.virtual('likeCount').get(function() {
  return this.likes?.length || 0;
});

// Method to increment views
resourceSchema.methods.incrementViews = function() {
  this.views += 1;
  this.lastViewedAt = new Date();
  return this.save();
};

// Method to add like
resourceSchema.methods.toggleLike = function(userId) {
  const existingLikeIndex = this.likes.findIndex(
    like => like.user.toString() === userId.toString()
  );

  if (existingLikeIndex > -1) {
    // Remove like
    this.likes.splice(existingLikeIndex, 1);
    return false;
  } else {
    // Add like
    this.likes.push({ user: userId });
    return true;
  }
};

// Method to calculate popularity score
resourceSchema.methods.calculatePopularityScore = function() {
  const viewWeight = 1;
  const likeWeight = 5;
  const downloadWeight = 3;
  const ageWeight = 0.1;
  
  const daysSinceCreation = Math.floor((new Date() - this.createdAt) / (1000 * 60 * 60 * 24));
  const ageFactor = Math.max(1, daysSinceCreation * ageWeight);
  
  this.popularityScore = Math.floor(
    ((this.views * viewWeight) + 
     (this.likeCount * likeWeight) + 
     (this.downloads * downloadWeight)) / ageFactor
  );
  
  return this.popularityScore;
};

// Pre-save middleware to update publishedAt
resourceSchema.pre('save', function(next) {
  if (this.isModified('isPublished') && this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

// Static methods
resourceSchema.statics.getTypeStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        published: { $sum: { $cond: ['$isPublished', 1, 0] } },
        totalViews: { $sum: '$views' },
        totalDownloads: { $sum: '$downloads' }
      }
    }
  ]);
};

resourceSchema.statics.getCategoryStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        published: { $sum: { $cond: ['$isPublished', 1, 0] } }
      }
    }
  ]);
};

// Ensure virtuals are included when converting to JSON
resourceSchema.set('toJSON', { virtuals: true });
resourceSchema.set('toObject', { virtuals: true });

export default mongoose.models.Resource || mongoose.model('Resource', resourceSchema);
