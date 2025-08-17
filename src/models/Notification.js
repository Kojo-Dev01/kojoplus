import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['signal', 'course', 'booking', 'system', 'message', 'info', 'payment', 'mentorship', 'security', 'course_purchase'],
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxLength: 100
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxLength: 500
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  actionUrl: {
    type: String,
    trim: true
  },
  expiresAt: {
    type: Date,
    index: { expireAfterSeconds: 0 }
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, type: 1, createdAt: -1 });

// Static method to create a notification
NotificationSchema.statics.createNotification = async function(notificationData) {
  try {
    const notification = new this(notificationData);
    await notification.save();
    return notification;
  } catch (error) {
    throw new Error(`Failed to create notification: ${error.message}`);
  }
};

// Static method to get user notifications with pagination
NotificationSchema.statics.getUserNotifications = async function(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    unreadOnly = false,
    type = null
  } = options;

  const skip = (page - 1) * limit;
  const query = { userId };

  if (unreadOnly) {
    query.read = false;
  }

  if (type) {
    query.type = type;
  }

  const notifications = await this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await this.countDocuments(query);
  const unreadCount = await this.countDocuments({ userId, read: false });

  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    unreadCount
  };
};

// Static method to mark notifications as read
NotificationSchema.statics.markAsRead = async function(userId, notificationIds) {
  const result = await this.updateMany(
    { 
      userId, 
      _id: { $in: notificationIds },
      read: false 
    },
    { 
      read: true,
      readAt: new Date()
    }
  );

  return result;
};

// Static method to mark all notifications as read
NotificationSchema.statics.markAllAsRead = async function(userId) {
  const result = await this.updateMany(
    { userId, read: false },
    { 
      read: true,
      readAt: new Date()
    }
  );

  return result;
};

// Instance method to mark single notification as read
NotificationSchema.methods.markAsRead = async function() {
  if (!this.read) {
    this.read = true;
    this.readAt = new Date();
    await this.save();
  }
  return this;
};

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
