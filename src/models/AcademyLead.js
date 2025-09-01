import mongoose from 'mongoose';

const academyLeadSchema = new mongoose.Schema({
  // Personal Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
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
    trim: true,
    validate: {
      validator: function(v) {
        return /^\+?[\d\s\-\(\)]+$/.test(v);
      },
      message: 'Please enter a valid phone number'
    }
  },
  
  // Course Information
  category: {
    type: String,
    required: [true, 'Course category is required'],
    enum: ['beginner', 'advanced', 'prop-firm'],
    index: true
  },
  experienceLevel: {
    type: String,
    required: [true, 'Experience level is required'],
    enum: ['complete-beginner', 'some-knowledge', 'intermediate', 'experienced']
  },
  
  // Training Schedule Information
  preferredMonth: {
    type: String,
    required: [true, 'Preferred training month is required'],
    enum: ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'],
    index: true
  },
  preferredYear: {
    type: Number,
    required: [true, 'Preferred training year is required'],
    min: [new Date().getFullYear(), 'Cannot select a year in the past'],
    max: [new Date().getFullYear() + 2, 'Cannot select more than 2 years in advance'],
    index: true
  },
  preferredSchedule: {
    type: String,
    required: [true, 'Preferred schedule is required'],
    enum: ['weekdays-morning', 'weekdays-afternoon', 'weekdays-evening', 'weekends', 'flexible']
  },
  
  // Additional Information
  motivation: {
    type: String,
    required: [true, 'Motivation is required'],
    trim: true,
    minlength: [10, 'Please provide more details about your motivation'],
    maxlength: [1000, 'Motivation cannot exceed 1000 characters']
  },
  goals: {
    type: String,
    required: [true, 'Goals are required'],
    trim: true,
    minlength: [10, 'Please provide more details about your goals'],
    maxlength: [1000, 'Goals cannot exceed 1000 characters']
  },
  
  // Application Status
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'accepted', 'rejected', 'completed'],
    default: 'pending',
    index: true
  },
  
  // Pricing Information (based on category)
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative'],
    default: 0
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  },
  
  // Payment Information
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'failed'],
    default: 'pending',
    index: true
  },
  paymentMethod: {
    type: String,
    enum: ['stripe', 'paypal', 'bank_transfer', 'cash', 'other'],
    default: null
  },
  paymentId: {
    type: String,
    default: null
  },
  
  // Admin Notes
  adminNotes: {
    type: String,
    default: '',
    maxlength: [1000, 'Admin notes cannot exceed 1000 characters']
  },
  
  // Course Details (to be filled after acceptance)
  scheduledStartDate: {
    type: Date,
    default: null
  },
  scheduledEndDate: {
    type: Date,
    default: null
  },
  courseLocation: {
    type: String,
    default: null
  },
  instructor: {
    type: String,
    default: null
  },
  
  // Communication History
  communications: [{
    type: {
      type: String,
      enum: ['email', 'sms', 'call', 'meeting'],
      required: true
    },
    message: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    sender: {
      type: String,
      enum: ['admin', 'applicant'],
      required: true
    }
  }],
  
  // Course Feedback (after completion)
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    comment: {
      type: String,
      maxlength: [500, 'Feedback comment cannot exceed 500 characters'],
      default: ''
    },
    submittedAt: {
      type: Date,
      default: null
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
academyLeadSchema.index({ email: 1 });
academyLeadSchema.index({ category: 1, status: 1 });
academyLeadSchema.index({ preferredMonth: 1, preferredYear: 1 });
academyLeadSchema.index({ paymentStatus: 1 });
academyLeadSchema.index({ scheduledStartDate: 1 });
academyLeadSchema.index({ createdAt: -1 });

// Virtual for full name
academyLeadSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for application reference
academyLeadSchema.virtual('applicationReference').get(function() {
  return `ACA-${this._id.toString().slice(-8).toUpperCase()}`;
});

// Virtual for course title
academyLeadSchema.virtual('courseTitle').get(function() {
  const titles = {
    'beginner': 'Beginner Forex Course',
    'advanced': 'Advanced Strategy Course',
    'prop-firm': 'Prop Firm One-on-One'
  };
  return titles[this.category] || 'Unknown Course';
});

// Virtual for preferred training period
academyLeadSchema.virtual('preferredTrainingPeriod').get(function() {
  if (this.preferredMonth && this.preferredYear) {
    const monthNames = {
      'january': 'January', 'february': 'February', 'march': 'March',
      'april': 'April', 'may': 'May', 'june': 'June',
      'july': 'July', 'august': 'August', 'september': 'September',
      'october': 'October', 'november': 'November', 'december': 'December'
    };
    return `${monthNames[this.preferredMonth]} ${this.preferredYear}`;
  }
  return 'Not specified';
});

// Method to add communication
academyLeadSchema.methods.addCommunication = function(type, message, sender) {
  this.communications.push({
    type,
    message,
    sender,
    timestamp: new Date()
  });
  return this.save();
};

// Method to update status
academyLeadSchema.methods.updateStatus = function(newStatus, adminNote = '') {
  this.status = newStatus;
  if (adminNote) {
    this.adminNotes = adminNote;
  }
  return this.save();
};

// Method to schedule course
academyLeadSchema.methods.scheduleCourse = function(startDate, endDate, location, instructor = null) {
  this.scheduledStartDate = startDate;
  this.scheduledEndDate = endDate;
  this.courseLocation = location;
  if (instructor) {
    this.instructor = instructor;
  }
  this.status = 'accepted';
  return this.save();
};

// Static method to get applications by category
academyLeadSchema.statics.getByCategory = function(category) {
  return this.find({ category }).sort({ createdAt: -1 });
};

// Static method to get applications by status
academyLeadSchema.statics.getByStatus = function(status) {
  return this.find({ status }).sort({ createdAt: -1 });
};

// Static method to get applications by month/year
academyLeadSchema.statics.getByTrainingPeriod = function(month, year) {
  const query = {};
  if (month) query.preferredMonth = month;
  if (year) query.preferredYear = year;
  return this.find(query).sort({ createdAt: -1 });
};

// Pre-save middleware to set price based on category and validate month/year
academyLeadSchema.pre('save', function(next) {
  // Set price based on category BEFORE validation
  if (this.isNew || this.isModified('category')) {
    const prices = {
      'beginner': 700, // GHS 700
      'advanced': 250, // USD 250
      'prop-firm': 500 // USD 500
    };
    
    this.price = prices[this.category] || 0;
    
    // Set currency based on category
    if (this.category === 'beginner') {
      this.currency = 'GHS';
    } else {
      this.currency = 'USD';
    }
  }
  
  // Ensure price is set even if no category is provided (fallback)
  if (!this.price && this.price !== 0) {
    this.price = 0;
  }
  
  // Validate month/year combination
  if (this.preferredMonth && this.preferredYear) {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); // 0-indexed
    
    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                       'july', 'august', 'september', 'october', 'november', 'december'];
    const selectedMonthIndex = monthNames.indexOf(this.preferredMonth);
    
    // Check if the selected month/year is in the past
    if (this.preferredYear < currentYear || 
        (this.preferredYear === currentYear && selectedMonthIndex < currentMonth)) {
      return next(new Error('Cannot select a training period in the past'));
    }
  }
  
  if (this.email) {
    this.email = this.email.toLowerCase().trim();
  }
  
  next();
});

const AcademyLead = mongoose.models.AcademyLead || mongoose.model('AcademyLead', academyLeadSchema);

export default AcademyLead;