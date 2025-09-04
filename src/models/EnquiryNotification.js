import mongoose from 'mongoose';

const EnquiryNotificationSchema = new mongoose.Schema({
  // Core identification
  enquiryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enquiry',
    required: true,
    index: true
  },
  responseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EnquiryResponse',
    required: true,
    index: true
  },
  
  // Recipient information
  recipientUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() { return this.recipientType === 'user'; }
  },
  recipientEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  recipientName: {
    type: String,
    required: true,
    trim: true
  },
  recipientType: {
    type: String,
    enum: ['user', 'guest'],
    required: true
  },
  
  // Notification details
  type: {
    type: String,
    enum: [
      'new_response',
      'enquiry_resolved', 
      'enquiry_reopened',
      'enquiry_closed',
      'status_update',
      'admin_message'
    ],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxLength: [200, 'Title cannot exceed 200 characters']
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxLength: [1000, 'Message cannot exceed 1000 characters']
  },
  
  // Sender information
  senderType: {
    type: String,
    enum: ['admin', 'user', 'system'],
    required: true
  },
  senderName: {
    type: String,
    required: true,
    trim: true
  },
  senderEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  
  // Status and tracking
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'read', 'failed'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  // Read status tracking
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: {
    type: Date,
    index: true
  },
  readBy: {
    type: String, // Can store user ID, email, or identifier of who read it
    trim: true
  },
  
  // Delivery tracking
  sentAt: Date,
  deliveredAt: Date,
  failedAt: Date,
  
  // Email delivery details
  emailDelivery: {
    attempted: {
      type: Boolean,
      default: false
    },
    success: {
      type: Boolean,
      default: false
    },
    messageId: String,
    provider: String,
    error: String,
    attemptedAt: Date,
    deliveredAt: Date
  },
  
  // Additional context
  metadata: {
    enquirySubject: String,
    enquiryType: String,
    hasAttachments: {
      type: Boolean,
      default: false
    },
    attachmentCount: {
      type: Number,
      default: 0
    },
    responsePreview: String, // First 100 chars of response
    previousStatus: String,
    newStatus: String,
    ipAddress: String,
    userAgent: String,
    source: {
      type: String,
      enum: ['web', 'api', 'email', 'mobile'],
      default: 'web'
    }
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
EnquiryNotificationSchema.index({ enquiryId: 1, createdAt: -1 });
EnquiryNotificationSchema.index({ recipientEmail: 1, status: 1 });
EnquiryNotificationSchema.index({ recipientUserId: 1, createdAt: -1 });
EnquiryNotificationSchema.index({ type: 1, createdAt: -1 });
EnquiryNotificationSchema.index({ status: 1, createdAt: -1 });
EnquiryNotificationSchema.index({ 'emailDelivery.success': 1 });
EnquiryNotificationSchema.index({ isRead: 1, createdAt: -1 });
EnquiryNotificationSchema.index({ recipientUserId: 1, isRead: 1 });
EnquiryNotificationSchema.index({ recipientEmail: 1, isRead: 1 });

// Virtual for notification age
EnquiryNotificationSchema.virtual('ageInMinutes').get(function() {
  return Math.floor((new Date() - this.createdAt) / (1000 * 60));
});

// Virtual for read status
EnquiryNotificationSchema.virtual('isReadVirtual').get(function() {
  return this.isRead || this.status === 'read';
});

// Virtual for delivery status
EnquiryNotificationSchema.virtual('isDelivered').get(function() {
  return ['delivered', 'read'].includes(this.status);
});

// Pre-save middleware to sync isRead with status
EnquiryNotificationSchema.pre('save', function(next) {
  // If status is set to 'read', automatically set isRead to true
  if (this.status === 'read' && !this.isRead) {
    this.isRead = true;
    if (!this.readAt) {
      this.readAt = new Date();
    }
  }
  
  // If isRead is set to true, update status if it's not already 'read'
  if (this.isRead && this.status !== 'read' && this.status !== 'failed') {
    this.status = 'read';
    if (!this.readAt) {
      this.readAt = new Date();
    }
  }
  
  next();
});

// Static method to create notification
EnquiryNotificationSchema.statics.createNotification = async function(notificationData) {
  const {
    enquiryId,
    responseId,
    recipientUserId,
    recipientEmail,
    recipientName,
    recipientType,
    type,
    title,
    message,
    senderType,
    senderName,
    senderEmail,
    priority = 'normal',
    metadata = {}
  } = notificationData;

  const notification = new this({
    enquiryId,
    responseId,
    recipientUserId,
    recipientEmail,
    recipientName,
    recipientType,
    type,
    title,
    message,
    senderType,
    senderName,
    senderEmail,
    priority,
    metadata,
    status: 'pending'
  });

  return await notification.save();
};

// Static method to create notification for enquiry response
EnquiryNotificationSchema.statics.createForResponse = async function(enquiry, response, additionalData = {}) {
  try {
    // Determine recipient information
    let recipientUserId = null;
    let recipientType = 'guest';
    let recipientEmail = enquiry.email;
    let recipientName = `${enquiry.firstName} ${enquiry.lastName}`;

    if (enquiry.submittedBy) {
      recipientUserId = enquiry.submittedBy._id || enquiry.submittedBy;
      recipientType = 'user';
      
      // If submittedBy is populated, use that email and name
      if (enquiry.submittedBy.email) {
        recipientEmail = enquiry.submittedBy.email;
        recipientName = `${enquiry.submittedBy.firstName} ${enquiry.submittedBy.lastName}`;
      }
    }

    // Determine notification type and content
    let type = 'new_response';
    let title = 'New Response to Your Enquiry';
    let message = `You have received a new response to your enquiry "${enquiry.subject}".`;

    if (enquiry.status === 'resolved') {
      type = 'enquiry_resolved';
      title = 'Your Enquiry Has Been Resolved';
      message = `Your enquiry "${enquiry.subject}" has been resolved. Please check the response for details.`;
    } else if (enquiry.status === 'closed') {
      type = 'enquiry_closed';
      title = 'Your Enquiry Has Been Closed';
      message = `Your enquiry "${enquiry.subject}" has been closed.`;
    }

    // Get sender information from response
    let senderType = response.responseType === 'admin_response' ? 'admin' : 'user';
    let senderName = response.adminId || 'Support Team';
    let senderEmail = null;

    if (response.responseType === 'user_response' && response.userId) {
      senderType = 'user';
      if (response.userId.firstName) {
        senderName = `${response.userId.firstName} ${response.userId.lastName}`;
        senderEmail = response.userId.email;
      }
    }

    // Prepare metadata
    const metadata = {
      enquirySubject: enquiry.subject,
      enquiryType: enquiry.enquiryType,
      hasAttachments: response.attachments && response.attachments.length > 0,
      attachmentCount: response.attachments ? response.attachments.length : 0,
      responsePreview: response.message.substring(0, 100) + (response.message.length > 100 ? '...' : ''),
      previousStatus: additionalData.previousStatus,
      newStatus: enquiry.status,
      ipAddress: response.metadata?.ipAddress,
      userAgent: response.metadata?.userAgent,
      source: response.metadata?.source || 'web',
      ...additionalData.metadata
    };

    return await this.createNotification({
      enquiryId: enquiry._id,
      responseId: response._id,
      recipientUserId,
      recipientEmail,
      recipientName,
      recipientType,
      type,
      title,
      message,
      senderType,
      senderName,
      senderEmail,
      priority: enquiry.priority === 'high' ? 'high' : 'normal',
      metadata
    });

  } catch (error) {
    console.error('Error creating enquiry notification:', error);
    throw error;
  }
};

// Instance method to mark as sent
EnquiryNotificationSchema.methods.markAsSent = function(emailData = {}) {
  this.status = 'sent';
  this.sentAt = new Date();
  
  if (emailData.messageId) {
    this.emailDelivery.attempted = true;
    this.emailDelivery.success = true;
    this.emailDelivery.messageId = emailData.messageId;
    this.emailDelivery.provider = emailData.provider;
    this.emailDelivery.attemptedAt = new Date();
    this.emailDelivery.deliveredAt = new Date();
  }
  
  return this.save();
};

// Instance method to mark as failed
EnquiryNotificationSchema.methods.markAsFailed = function(error = '') {
  this.status = 'failed';
  this.failedAt = new Date();
  
  this.emailDelivery.attempted = true;
  this.emailDelivery.success = false;
  this.emailDelivery.error = error;
  this.emailDelivery.attemptedAt = new Date();
  
  return this.save();
};

// Enhanced method to mark as read
EnquiryNotificationSchema.methods.markAsRead = function(readBy = null) {
  this.isRead = true;
  this.status = 'read';
  this.readAt = new Date();
  if (readBy) {
    this.readBy = readBy;
  }
  return this.save();
};

// Method to mark as unread
EnquiryNotificationSchema.methods.markAsUnread = function() {
  this.isRead = false;
  this.readAt = undefined;
  this.readBy = undefined;
  // Revert status to previous state (delivered if it was delivered, otherwise sent)
  if (this.deliveredAt) {
    this.status = 'delivered';
  } else if (this.sentAt) {
    this.status = 'sent';
  } else {
    this.status = 'pending';
  }
  return this.save();
};

// Instance method to mark as delivered
EnquiryNotificationSchema.methods.markAsDelivered = function() {
  if (this.status === 'sent') {
    this.status = 'delivered';
    this.deliveredAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Static method to mark multiple notifications as read
EnquiryNotificationSchema.statics.markMultipleAsRead = async function(notificationIds, readBy = null) {
  const updateData = {
    isRead: true,
    status: 'read',
    readAt: new Date()
  };
  
  if (readBy) {
    updateData.readBy = readBy;
  }
  
  return await this.updateMany(
    { _id: { $in: notificationIds } },
    updateData
  );
};

// Static method to mark all notifications as read for an enquiry
EnquiryNotificationSchema.statics.markEnquiryNotificationsAsRead = async function(enquiryId, userId, email) {
  const query = {
    enquiryId,
    status: { $in: ['pending', 'sent', 'delivered'] },
    $or: []
  };

  // Add userId condition if provided
  if (userId) {
    query.$or.push({ recipientUserId: userId });
  }

  // Add email condition if provided
  if (email) {
    query.$or.push({ recipientEmail: email.toLowerCase() });
  }

  // If no conditions were added, return without doing anything
  if (query.$or.length === 0) {
    return { modifiedCount: 0 };
  }

  return await this.updateMany(query, {
    $set: {
      isRead: true,
      readAt: new Date()
    }
  });
};

// Static method to get notifications for user
EnquiryNotificationSchema.statics.getForUser = function(userId, options = {}) {
  const query = { recipientUserId: userId };
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.type) {
    query.type = options.type;
  }
  
  return this.find(query)
    .populate('enquiryId', 'subject enquiryType status priority')
    .populate('responseId', 'message createdAt')
    .sort({ createdAt: -1 })
    .limit(options.limit || 50);
};

// Static method to get unread notifications for user
EnquiryNotificationSchema.statics.getUnreadForUser = function(userId, options = {}) {
  const query = { 
    recipientUserId: userId,
    isRead: false
  };
  
  if (options.type) {
    query.type = options.type;
  }
  
  return this.find(query)
    .populate('enquiryId', 'subject enquiryType status priority')
    .populate('responseId', 'message createdAt')
    .sort({ createdAt: -1 })
    .limit(options.limit || 50);
};

// Static method to get unread notifications for email
EnquiryNotificationSchema.statics.getUnreadForEmail = function(email, options = {}) {
  const query = { 
    recipientEmail: email.toLowerCase(),
    isRead: false
  };
  
  if (options.type) {
    query.type = options.type;
  }
  
  return this.find(query)
    .populate('enquiryId', 'subject enquiryType status priority')
    .populate('responseId', 'message createdAt')
    .sort({ createdAt: -1 })
    .limit(options.limit || 50);
};

// Static method to get unread count for user
EnquiryNotificationSchema.statics.getUnreadCountForUser = function(userId) {
  return this.countDocuments({
    recipientUserId: userId,
    isRead: false
  });
};

// Static method to get unread count for email
EnquiryNotificationSchema.statics.getUnreadCountForEmail = function(email) {
  return this.countDocuments({
    recipientEmail: email.toLowerCase(),
    isRead: false
  });
};

// Static method to get notifications for email
EnquiryNotificationSchema.statics.getForEmail = function(email, options = {}) {
  const query = { recipientEmail: email.toLowerCase() };
  
  if (options.status) {
    query.status = options.status;
  }
  
  return this.find(query)
    .populate('enquiryId', 'subject enquiryType status priority')
    .populate('responseId', 'message createdAt')
    .sort({ createdAt: -1 })
    .limit(options.limit || 50);
};

// Static method to get notification statistics
EnquiryNotificationSchema.statics.getStats = function(timeframe = 'day') {
  const now = new Date();
  let startDate;
  
  switch (timeframe) {
    case 'hour':
      startDate = new Date(now.getTime() - (60 * 60 * 1000));
      break;
    case 'day':
      startDate = new Date(now.getTime() - (24 * 60 * 60 * 1000));
      break;
    case 'week':
      startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
      break;
    case 'month':
      startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      break;
    default:
      startDate = new Date(now.getTime() - (24 * 60 * 60 * 1000));
  }
  
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

// Enhanced stats method to include read/unread stats
EnquiryNotificationSchema.statics.getReadStats = function(timeframe = 'day') {
  const now = new Date();
  let startDate;
  
  switch (timeframe) {
    case 'hour':
      startDate = new Date(now.getTime() - (60 * 60 * 1000));
      break;
    case 'day':
      startDate = new Date(now.getTime() - (24 * 60 * 60 * 1000));
      break;
    case 'week':
      startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
      break;
    case 'month':
      startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      break;
    default:
      startDate = new Date(now.getTime() - (24 * 60 * 60 * 1000));
  }
  
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          status: '$status',
          isRead: '$isRead'
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$count' },
        read: {
          $sum: {
            $cond: [{ $eq: ['$_id.isRead', true] }, '$count', 0]
          }
        },
        unread: {
          $sum: {
            $cond: [{ $eq: ['$_id.isRead', false] }, '$count', 0]
          }
        },
        byStatus: {
          $push: {
            status: '$_id.status',
            isRead: '$_id.isRead',
            count: '$count'
          }
        }
      }
    }
  ]);
};

export default mongoose.models.EnquiryNotification || mongoose.model('EnquiryNotification', EnquiryNotificationSchema);
