import mongoose from 'mongoose';

const EnquiryResponseSchema = new mongoose.Schema({
  enquiryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enquiry',
    required: true,
    index: true
  },
  // Enhanced response tracking
  responseType: {
    type: String,
    enum: ['admin_response', 'user_response', 'system_message'],
    required: true
  },
  // Admin response fields
  adminId: {
    type: String, // Admin username/email
    required: function() { return this.responseType === 'admin_response'; }
  },
  // User response fields  
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() { return this.responseType === 'user_response'; }
  },
  // Response content
  message: {
    type: String,
    required: [true, 'Response message is required'],
    trim: true,
    minLength: [1, 'Response must not be empty'],
    maxLength: [5000, 'Response cannot exceed 5000 characters']
  },
  // File attachments with Wasabi integration
  attachments: [{
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    key: {
      type: String, // Wasabi object key for deletion
      required: true
    },
    fileType: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Response metadata
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'failed'],
    default: 'sent'
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  // Tracking fields
  readAt: Date,
  readBy: [{
    userId: mongoose.Schema.Types.ObjectId,
    readAt: Date
  }],
  metadata: {
    ipAddress: String,
    userAgent: String,
    source: {
      type: String,
      enum: ['web', 'mobile', 'api', 'email'],
      default: 'web'
    }
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
EnquiryResponseSchema.index({ enquiryId: 1, createdAt: 1 });
EnquiryResponseSchema.index({ responseType: 1, createdAt: -1 });
EnquiryResponseSchema.index({ adminId: 1, createdAt: -1 });
EnquiryResponseSchema.index({ userId: 1, createdAt: -1 });

// Virtual for response author display
EnquiryResponseSchema.virtual('authorDisplay').get(function() {
  if (this.responseType === 'admin_response') {
    return this.adminId || 'Admin';
  } else if (this.responseType === 'user_response' && this.userId) {
    return this.userId.firstName ? `${this.userId.firstName} ${this.userId.lastName}` : 'User';
  }
  return 'System';
});

// Virtual for response author type
EnquiryResponseSchema.virtual('isAdminResponse').get(function() {
  return this.responseType === 'admin_response';
});

// Static method to get responses for an enquiry with populated data
EnquiryResponseSchema.statics.getResponsesForEnquiry = function(enquiryId) {
  return this.find({ enquiryId })
    .populate('userId', 'firstName lastName email')
    .sort({ createdAt: 1 });
};

// Static method to create admin response
EnquiryResponseSchema.statics.createAdminResponse = async function(data) {
  const { enquiryId, adminId, message, attachments = [], metadata = {} } = data;
  
  const response = new this({
    enquiryId,
    responseType: 'admin_response',
    adminId,
    message,
    attachments,
    metadata
  });
  
  return await response.save();
};

// Static method to create user response
EnquiryResponseSchema.statics.createUserResponse = async function(data) {
  const { enquiryId, userId, message, attachments = [], metadata = {} } = data;
  
  const response = new this({
    enquiryId,
    responseType: 'user_response',
    userId,
    message,
    attachments,
    metadata
  });
  
  return await response.save();
};

// Static method to create response with enquiry update
EnquiryResponseSchema.statics.createWithEnquiryUpdate = async function(responseData, enquiryStatus = null, updatedBy = null) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Create the response
    const response = new this(responseData);
    await response.save({ session });

    // Update the enquiry if status provided
    if (enquiryStatus) {
      const Enquiry = mongoose.model('Enquiry');
      const updateData = { status: enquiryStatus };
      
      if (enquiryStatus === 'resolved' || enquiryStatus === 'closed') {
        updateData.resolvedAt = new Date();
        updateData.resolvedBy = updatedBy;
      }
      
      await Enquiry.findByIdAndUpdate(responseData.enquiryId, updateData, { session });
    }

    await session.commitTransaction();
    return response;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// Instance method to mark as read
EnquiryResponseSchema.methods.markAsRead = function(userId = null) {
  if (userId && !this.readBy.some(read => read.userId.toString() === userId.toString())) {
    this.readBy.push({
      userId,
      readAt: new Date()
    });
  }
  this.readAt = new Date();
  return this.save();
};

export default mongoose.models.EnquiryResponse || mongoose.model('EnquiryResponse', EnquiryResponseSchema);
