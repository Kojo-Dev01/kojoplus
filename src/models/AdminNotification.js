import mongoose from 'mongoose';

const AdminNotificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    trim: true,
    maxLength: [100, 'Title cannot exceed 100 characters']
  },
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    trim: true,
    maxLength: [500, 'Message cannot exceed 500 characters']
  },
  type: {
    type: String,
    required: true,
    enum: ['user', 'system', 'payment', 'alert', 'security', 'course_purchase'],
    default: 'system'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  relatedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Index for efficient querying
AdminNotificationSchema.index({ isRead: 1, createdAt: -1 });
AdminNotificationSchema.index({ type: 1, createdAt: -1 });

// Static method to create notification
AdminNotificationSchema.statics.createNotification = function(notificationData) {
  return this.create(notificationData);
};

// Static method to mark as read
AdminNotificationSchema.statics.markAsRead = function(id) {
  return this.findByIdAndUpdate(id, { isRead: true }, { new: true });
};

// Static method to get unread count
AdminNotificationSchema.statics.getUnreadCount = function() {
  return this.countDocuments({ isRead: false });
};

export default mongoose.models.AdminNotification || mongoose.model('AdminNotification', AdminNotificationSchema);
