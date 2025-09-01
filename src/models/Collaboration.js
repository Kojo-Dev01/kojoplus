import mongoose from 'mongoose';

const CollaborationSchema = new mongoose.Schema({
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
  company: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxLength: [100, 'Company name cannot exceed 100 characters']
  },
  website: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Allow empty values
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Website must be a valid URL'
    }
  },
  collaborationType: {
    type: String,
    required: [true, 'Collaboration type is required'],
    enum: [
      'Sponsored Content',
      'Product Review',
      'Brand Partnership',
      'Affiliate Program',
      'Event Collaboration',
      'Long-term Partnership',
      'Other'
    ]
  },
  description: {
    type: String,
    required: [true, 'Project description is required'],
    trim: true,
    minLength: [50, 'Description must be at least 50 characters'],
    maxLength: [2000, 'Description cannot exceed 2000 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'accepted', 'rejected', 'completed'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  notes: {
    type: String,
    trim: true,
    maxLength: [1000, 'Notes cannot exceed 1000 characters']
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
  reviewedAt: {
    type: Date,
    default: null
  },
  reviewedBy: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
CollaborationSchema.index({ status: 1, createdAt: -1 });
CollaborationSchema.index({ collaborationType: 1, createdAt: -1 });
CollaborationSchema.index({ email: 1 });
CollaborationSchema.index({ company: 1 });

// Static method to get collaborations by status
CollaborationSchema.statics.getByStatus = function(status, options = {}) {
  const query = status ? { status } : {};
  
  return this.find(query)
    .populate('submittedBy', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .limit(options.limit || 50);
};

// Static method to get collaboration statistics
CollaborationSchema.statics.getStats = function() {
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
CollaborationSchema.methods.updateStatus = function(status, reviewedBy = null) {
  this.status = status;
  this.reviewedAt = new Date();
  this.reviewedBy = reviewedBy;
  return this.save();
};

export default mongoose.models.Collaboration || mongoose.model('Collaboration', CollaborationSchema);
