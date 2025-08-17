import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true
  },
  otp: {
    type: String,
    required: [true, 'OTP is required'],
    length: 6
  },
  attempts: {
    type: Number,
    default: 0,
    max: [3, 'Maximum 3 attempts allowed']
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries - removed duplicates
otpSchema.index({ email: 1, isUsed: 1 });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to create new OTP
otpSchema.statics.createOTP = async function(email, otp) {
  // Remove any existing unused OTPs for this email
  await this.deleteMany({ 
    email: email.toLowerCase(), 
    isUsed: false 
  });
  
  // Create new OTP
  return await this.create({
    email: email.toLowerCase(),
    otp,
    attempts: 0,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000)
  });
};

// Static method to verify OTP
otpSchema.statics.verifyOTP = async function(email, providedOTP) {
  const otpRecord = await this.findOne({
    email: email.toLowerCase(),
    isUsed: false,
    expiresAt: { $gt: new Date() }
  });

  if (!otpRecord) {
    return { valid: false, error: 'OTP not found or expired' };
  }

  if (otpRecord.attempts >= 3) {
    // Mark as used to prevent further attempts
    await this.updateOne(
      { _id: otpRecord._id },
      { isUsed: true }
    );
    return { valid: false, error: 'Too many attempts. Please request a new OTP' };
  }

  if (otpRecord.otp !== providedOTP) {
    // Increment attempts
    await this.updateOne(
      { _id: otpRecord._id },
      { $inc: { attempts: 1 } }
    );
    return { valid: false, error: 'Invalid OTP' };
  }

  // OTP is valid, mark as used
  await this.updateOne(
    { _id: otpRecord._id },
    { isUsed: true }
  );

  return { valid: true };
};

// Static method to cleanup expired OTPs (optional, since TTL index handles this)
otpSchema.statics.cleanupExpired = async function() {
  return await this.deleteMany({
    expiresAt: { $lt: new Date() }
  });
};

const PlusOTP = mongoose.models.PlusOTP || mongoose.model('PlusOTP', otpSchema);

export default PlusOTP;
