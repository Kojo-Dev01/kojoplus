import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxLength: [1000, 'Comment cannot exceed 1000 characters']
  },
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  replies: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxLength: [500, 'Reply cannot exceed 500 characters']
    },
    likes: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const forecastSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxLength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  imageKey: {
    type: String,
    required: true // Store S3 key for deletion purposes
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.Mixed, // Can be ObjectId or String
    required: true,
    validate: {
      validator: function(value) {
        // If it's a string, it should represent an admin
        if (typeof value === 'string') {
          return value.trim().length > 0;
        }
        // If it's an ObjectId, it should be valid
        if (mongoose.Types.ObjectId.isValid(value)) {
          return true;
        }
        return false;
      },
      message: 'createdBy must be a valid User ID or admin identifier'
    }
  },
  creatorType: {
    type: String,
    enum: ['user', 'admin'],
    required: true,
    default: 'admin'
  },
  // Track users who liked this forecast
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Comments on this forecast
  comments: [CommentSchema],
  views: {
    type: Number,
    default: 0
  },
  // Track unique users who viewed this forecast
  viewedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isPublished: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Virtual for like count
forecastSchema.virtual('likeCount').get(function() {
  return this.likes?.length || 0;
});

// Virtual for comment count
forecastSchema.virtual('commentCount').get(function() {
  return this.comments?.length || 0;
});

// Method to check if user liked forecast
forecastSchema.methods.isLikedBy = function(userId) {
  return this.likes.some(like => like.user.toString() === userId.toString());
};

// Method to check if user viewed forecast
forecastSchema.methods.isViewedBy = function(userId) {
  return this.viewedBy.some(view => view.user.toString() === userId.toString());
};

// Method to get creator information
forecastSchema.methods.getCreatorInfo = function() {
  if (this.creatorType === 'admin') {
    return {
      type: 'admin',
      name: this.createdBy,
      id: this.createdBy
    };
  } else {
    return {
      type: 'user',
      userId: this.createdBy,
      // Note: You'll need to populate this field to get user details
    };
  }
};

// Static method to create forecast with proper creator handling
forecastSchema.statics.createForecast = function(forecastData, creatorInfo) {
  const { isAdmin, userId, adminName } = creatorInfo;
  
  if (isAdmin) {
    return new this({
      ...forecastData,
      createdBy: adminName || 'Admin',
      creatorType: 'admin'
    });
  } else {
    return new this({
      ...forecastData,
      createdBy: userId,
      creatorType: 'user'
    });
  }
};

// Ensure virtuals are included when converting to JSON
forecastSchema.set('toJSON', { virtuals: true });
forecastSchema.set('toObject', { virtuals: true });

// Update indexes to include creatorType
forecastSchema.index({ createdAt: -1 });
forecastSchema.index({ isActive: 1 });
forecastSchema.index({ isPublished: 1 });
forecastSchema.index({ 'likes.user': 1 });
forecastSchema.index({ 'viewedBy.user': 1 });
forecastSchema.index({ tags: 1 });
forecastSchema.index({ creatorType: 1 });

export default mongoose.models.Forecast || mongoose.model('Forecast', forecastSchema);
