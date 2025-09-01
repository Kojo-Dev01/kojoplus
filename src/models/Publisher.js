import mongoose from 'mongoose';

const publisherSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  nickname: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minLength: [3, 'Nickname must be at least 3 characters'],
    maxLength: [20, 'Nickname cannot exceed 20 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Nickname can only contain letters, numbers, and underscores']
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
    maxLength: [50, 'Display name cannot exceed 50 characters']
  },
  bio: {
    type: String,
    default: '',
    maxLength: [500, 'Bio cannot exceed 500 characters']
  },
  avatar: {
    type: String,
    default: ''
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  followers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    followedAt: {
      type: Date,
      default: Date.now
    }
  }],
  following: [{
    publisher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Publisher',
      required: true
    },
    followedAt: {
      type: Date,
      default: Date.now
    }
  }],
  stats: {
    totalForecasts: {
      type: Number,
      default: 0
    },
    totalViews: {
      type: Number,
      default: 0
    },
    totalLikes: {
      type: Number,
      default: 0
    },
    totalComments: {
      type: Number,
      default: 0
    }
  },
  termsAcceptedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  termsVersion: {
    type: String,
    required: true,
    default: '1.0'
  }
}, {
  timestamps: true
});

// Virtual for follower count
publisherSchema.virtual('followerCount').get(function() {
  return this.followers?.length || 0;
});

// Virtual for following count
publisherSchema.virtual('followingCount').get(function() {
  return this.following?.length || 0;
});

// Method to check if a user is following this publisher
publisherSchema.methods.isFollowedBy = function(userId) {
  return this.followers.some(follower => follower.user.toString() === userId.toString());
};

// Method to follow/unfollow
publisherSchema.methods.toggleFollow = function(userId) {
  const existingFollowIndex = this.followers.findIndex(
    follower => follower.user.toString() === userId.toString()
  );

  if (existingFollowIndex > -1) {
    // Unfollow
    this.followers.splice(existingFollowIndex, 1);
    return false;
  } else {
    // Follow
    this.followers.push({ user: userId });
    return true;
  }
};

// Ensure virtuals are included when converting to JSON
publisherSchema.set('toJSON', { virtuals: true });
publisherSchema.set('toObject', { virtuals: true });

// Indexes
publisherSchema.index({ userId: 1 });
publisherSchema.index({ nickname: 1 });
publisherSchema.index({ isActive: 1 });
publisherSchema.index({ 'followers.user': 1 });
publisherSchema.index({ createdAt: -1 });

export default mongoose.models.Publisher || mongoose.model('Publisher', publisherSchema);
