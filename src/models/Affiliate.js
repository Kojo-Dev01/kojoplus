import mongoose from 'mongoose';

const AffiliateSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
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
  phone: {
    type: String,
    trim: true
  },
  exnessVerificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'failed', 'not_found'],
    default: 'verified'
  },
  exnessData: {
    isAffiliated: {
      type: Boolean,
      default: true
    },
    affiliationDate: {
      type: Date,
      default: Date.now
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  telegramInviteLink: {
    type: String,
    default: null
  },
  telegramInviteStatus: {
    type: String,
    enum: ['pending', 'generated', 'failed'],
    default: 'generated'
  },
  telegramGroupJoined: {
    type: Boolean,
    default: false
  },
  telegramGroupJoinedAt: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    trim: true,
    maxLength: [500, 'Notes cannot exceed 500 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound indexes for efficient querying
AffiliateSchema.index({ userId: 1, email: 1 }, { unique: true });
AffiliateSchema.index({ email: 1, exnessVerificationStatus: 1 });
AffiliateSchema.index({ exnessVerificationStatus: 1, createdAt: -1 });

// Virtual for full name
AffiliateSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Static method to create or update affiliate
AffiliateSchema.statics.createOrUpdateAffiliate = async function(affiliateData) {
  try {
    const existingAffiliate = await this.findOne({
      userId: affiliateData.userId,
      email: affiliateData.email
    });

    if (existingAffiliate) {
      // Update existing affiliate
      Object.assign(existingAffiliate, affiliateData);
      await existingAffiliate.save();
      return existingAffiliate;
    } else {
      // Create new affiliate
      const affiliate = new this(affiliateData);
      await affiliate.save();
      return affiliate;
    }
  } catch (error) {
    throw new Error(`Failed to create/update affiliate: ${error.message}`);
  }
};

// Static method to find affiliate by email
AffiliateSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase().trim() });
};

// Static method to find affiliates by user
AffiliateSchema.statics.findByUser = function(userId) {
  return this.find({ userId }).sort({ createdAt: -1 });
};

// Pre-save middleware to ensure email is lowercase
AffiliateSchema.pre('save', function(next) {
  if (this.email) {
    this.email = this.email.toLowerCase().trim();
  }
  next();
});

export default mongoose.models.Affiliate || mongoose.model('Affiliate', AffiliateSchema);
