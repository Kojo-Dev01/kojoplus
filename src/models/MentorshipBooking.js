import mongoose from 'mongoose';

const MentorshipBookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
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
    required: [true, 'Phone number is required'],
    trim: true
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxLength: [1000, 'Message cannot exceed 1000 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'contacted', 'scheduled', 'completed', 'cancelled'],
    default: 'pending'
  },
  scheduledDate: {
    type: Date,
    default: null
  },
  meetingLink: {
    type: String,
    trim: true,
    default: null
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  paymentReference: {
    type: String,
    trim: true,
    default: null
  },
  notes: {
    type: String,
    trim: true,
    maxLength: [500, 'Notes cannot exceed 500 characters']
  },
  contactedAt: {
    type: Date,
    default: null
  },
  adminNotes: {
    type: String,
    trim: true,
    maxLength: [1000, 'Admin notes cannot exceed 1000 characters']
  }
}, {
  timestamps: true
});

// Compound indexes for efficient querying
MentorshipBookingSchema.index({ userId: 1, status: 1 });
MentorshipBookingSchema.index({ status: 1, createdAt: -1 });
MentorshipBookingSchema.index({ email: 1, status: 1 });

// Virtual for booking reference
MentorshipBookingSchema.virtual('bookingReference').get(function() {
  return `MB-${this._id.toString().slice(-8).toUpperCase()}`;
});

// Virtual for full name
MentorshipBookingSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Static method to get user bookings
MentorshipBookingSchema.statics.getUserBookings = function(userId, options = {}) {
  const query = { userId };
  
  if (options.status) {
    query.status = options.status;
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .populate('userId', 'firstName lastName email');
};

// Static method to get admin bookings with pagination
MentorshipBookingSchema.statics.getAdminBookings = function(options = {}) {
  const {
    page = 1,
    limit = 20,
    status = null,
    sortBy = 'createdAt',
    sortOrder = -1
  } = options;

  const skip = (page - 1) * limit;
  const query = {};

  if (status) {
    query.status = status;
  }

  const sort = {};
  sort[sortBy] = sortOrder;

  return this.find(query)
    .populate('userId', 'firstName lastName email')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Instance method to update status
MentorshipBookingSchema.methods.updateStatus = function(newStatus, additionalData = {}) {
  this.status = newStatus;
  
  if (newStatus === 'contacted' && !this.contactedAt) {
    this.contactedAt = new Date();
  }
  
  if (additionalData.scheduledDate) {
    this.scheduledDate = additionalData.scheduledDate;
  }
  
  if (additionalData.meetingLink) {
    this.meetingLink = additionalData.meetingLink;
  }
  
  if (additionalData.notes) {
    this.notes = additionalData.notes;
  }
  
  return this.save();
};

// Pre-save middleware to ensure email is lowercase
MentorshipBookingSchema.pre('save', function(next) {
  if (this.email) {
    this.email = this.email.toLowerCase().trim();
  }
  next();
});

export default mongoose.models.MentorshipBooking || mongoose.model('MentorshipBooking', MentorshipBookingSchema);
