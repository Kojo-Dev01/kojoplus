import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const courseSubscriberSchema = new mongoose.Schema({
  // User reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Course reference
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  
  // Product reference
  productId: {
    type: String,
    required: true,
    trim: true
  },
  
  // Login credentials for course access
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  
  password: {
    type: String,
    required: true
  },
  
  // Payment information
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  
  paymentAmount: {
    type: Number,
    required: true
  },
  
  currency: {
    type: String,
    required: true,
    default: 'USD'
  },
  
  // Access status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Progress tracking
  completedLessons: [{
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    completedAt: {
      type: Date,
      default: Date.now
    },
    timeSpent: {
      type: Number, // in minutes
      default: 0
    }
  }],
  
  // Course progress
  progressPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  // Access dates
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  
  lastAccessedAt: {
    type: Date,
    default: Date.now
  },
  
  // Completion status
  completedAt: {
    type: Date
  },
  
  certificateIssued: {
    type: Boolean,
    default: false
  },
  
  certificateIssuedAt: {
    type: Date
  },
  
  // Notes
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes
courseSubscriberSchema.index({ userId: 1, courseId: 1 }, { unique: true });
courseSubscriberSchema.index({ username: 1 }, { unique: true });
courseSubscriberSchema.index({ transactionId: 1 }, { unique: true });
courseSubscriberSchema.index({ productId: 1 });
courseSubscriberSchema.index({ isActive: 1 });
courseSubscriberSchema.index({ enrolledAt: -1 });

// Virtual for checking if course is completed
courseSubscriberSchema.virtual('isCompleted').get(function() {
  return this.progressPercentage >= 100;
});

// Method to generate random password
courseSubscriberSchema.statics.generatePassword = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// Method to hash password
courseSubscriberSchema.methods.hashPassword = async function(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Method to verify password
courseSubscriberSchema.methods.verifyPassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// Method to mark lesson as complete
courseSubscriberSchema.methods.markLessonComplete = function(lessonId, timeSpent = 0) {
  const existingIndex = this.completedLessons.findIndex(
    lesson => lesson.lessonId.toString() === lessonId.toString()
  );

  if (existingIndex === -1) {
    this.completedLessons.push({
      lessonId,
      completedAt: new Date(),
      timeSpent
    });
    return true; // Lesson was newly completed
  } else {
    // Update time spent if lesson already completed
    this.completedLessons[existingIndex].timeSpent = timeSpent;
    return false; // Lesson was already completed
  }
};

// Method to unmark lesson as complete
courseSubscriberSchema.methods.unmarkLessonComplete = function(lessonId) {
  const initialLength = this.completedLessons.length;
  this.completedLessons = this.completedLessons.filter(
    lesson => lesson.lessonId.toString() !== lessonId.toString()
  );
  return this.completedLessons.length < initialLength; // Returns true if lesson was removed
};

// Method to check if lesson is completed
courseSubscriberSchema.methods.isLessonCompleted = function(lessonId) {
  return this.completedLessons.some(
    lesson => lesson.lessonId.toString() === lessonId.toString()
  );
};

// Method to get completion stats
courseSubscriberSchema.methods.getCompletionStats = function() {
  return {
    completedLessons: this.completedLessons.length,
    progressPercentage: this.progressPercentage,
    isCompleted: this.progressPercentage >= 100,
    completedAt: this.completedAt,
    totalTimeSpent: this.completedLessons.reduce((total, lesson) => total + lesson.timeSpent, 0)
  };
};

// Static method to create subscription from payment
courseSubscriberSchema.statics.createFromPayment = async function(paymentData) {
  const { userId, courseId, productId, transactionId, amount, currency, userEmail } = paymentData;
  
  // Generate credentials
  const username = userEmail.toLowerCase();
  const plainPassword = this.generatePassword();
  
  // Create subscription
  const subscription = new this({
    userId,
    courseId,
    productId,
    username,
    transactionId,
    paymentAmount: amount,
    currency: currency || 'USD'
  });
  
  // Hash password
  subscription.password = await subscription.hashPassword(plainPassword);
  
  // Save subscription
  await subscription.save();
  
  // Return subscription with plain password for email
  return {
    subscription,
    plainPassword
  };
};

// Static method to get user's subscriptions
courseSubscriberSchema.statics.getUserSubscriptions = function(userId) {
  return this.find({ userId, isActive: true })
    .populate('courseId', 'title description thumbnailUrl totalLessons totalDuration')
    .sort({ enrolledAt: -1 });
};

// Static method to check if user has access to course
courseSubscriberSchema.statics.hasAccess = async function(userId, courseId) {
  const subscription = await this.findOne({
    userId,
    courseId,
    isActive: true
  });
  
  return !!subscription;
};

// Static method to update progress percentage
courseSubscriberSchema.statics.updateProgress = async function(subscriptionId, totalLessons) {
  const subscription = await this.findById(subscriptionId);
  if (!subscription) return null;

  const completedCount = subscription.completedLessons.length;
  const progressPercentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  
  subscription.progressPercentage = progressPercentage;
  subscription.lastAccessedAt = new Date();

  // Mark as completed if 100%
  if (progressPercentage >= 100 && !subscription.completedAt) {
    subscription.completedAt = new Date();
  } else if (progressPercentage < 100 && subscription.completedAt) {
    subscription.completedAt = null;
  }

  await subscription.save();
  return subscription;
};

export default mongoose.models.CourseSubscriber || mongoose.model('CourseSubscriber', courseSubscriberSchema);
