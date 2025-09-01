import mongoose from 'mongoose';

const EnquirySchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxLength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxLength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    trim: true
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxLength: [100, 'Subject cannot exceed 100 characters']
  },
  enquiryType: {
    type: String,
    required: [true, 'Enquiry type is required'],
    enum: [
      'General Question',
      'Technical Support',
      'Billing Inquiry',
      'Partnership',
      'Course Information',
      'Signal Service',
      'Other'
    ]
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    minLength: [20, 'Message must be at least 20 characters'],
    maxLength: [1000, 'Message cannot exceed 1000 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'resolved', 'closed'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  ip: {
    type: String,
    default: 'unknown'
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  resolvedBy: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
EnquirySchema.index({ status: 1, createdAt: -1 });
EnquirySchema.index({ enquiryType: 1, createdAt: -1 });
EnquirySchema.index({ email: 1 });
EnquirySchema.index({ submittedBy: 1, createdAt: -1 });

// Static method to get enquiries by status
EnquirySchema.statics.getByStatus = function(status, options = {}) {
  const query = status ? { status } : {};
  
  return this.find(query)
    .populate('submittedBy', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .limit(options.limit || 50);
};

// Static method to get enquiry statistics
EnquirySchema.statics.getStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

// Instance method to update status
EnquirySchema.methods.updateStatus = function(status, resolvedBy = null) {
  this.status = status;
  if (status === 'resolved' || status === 'closed') {
    this.resolvedAt = new Date();
    this.resolvedBy = resolvedBy;
  }
  return this.save();
};

export default mongoose.models.Enquiry || mongoose.model('Enquiry', EnquirySchema);
