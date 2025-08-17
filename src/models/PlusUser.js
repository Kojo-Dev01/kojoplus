import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { ALLOWED_ROLES, ALLOWED_ACCESS_LEVELS, ALLOWED_FEATURES, ALLOWED_TAB_ACCESS } from '@/constants/index.js';

const plusUserSchema = new mongoose.Schema({
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
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    lowercase: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Please provide a valid email address'
    ]
  },
  // Store password in both formats
  password: {
    type: String,
    required: [true, 'Password is required']
  },
  encryptedPassword: {
    type: String,
    required: [true, 'Encrypted password is required']
  },
  plusCode: {
    type: String,
    required: [true, 'Plus code is required'],
    trim: true,
    uppercase: true,
    length: 6
  },
  isActive: {
    type: Boolean,
    default: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  lastLoginAt: Date,
  loginCount: {
    type: Number,
    default: 0
  },
  // Role system - administrator or none
  role: {
    type: String,
    enum: ALLOWED_ROLES,
    default: 'none'
  },
  // Access level only applies to non-administrator users
  accessLevel: {
    type: String,
    enum: ALLOWED_ACCESS_LEVELS,
    default: 'standard',
    // Only required if role is not administrator
    required: function() {
      return this.role !== 'administrator';
    }
  },
  // Features for regular plus users
  features: [{
    type: String,
    enum: ALLOWED_FEATURES,
    // Only allow features for non-administrator users
    validate: {
      validator: function(value) {
        return this.role !== 'administrator' || value.length === 0;
      },
      message: 'Features are not applicable for administrator users'
    }
  }],
  // Tab access for administrators
  tabAccess: [{
    type: String,
    enum: ALLOWED_TAB_ACCESS,
    // Only allow tab access for administrator users
    validate: {
      validator: function(value) {
        return this.role === 'administrator' || value.length === 0;
      },
      message: 'Tab access is only applicable for administrator users'
    }
  }],
  
  subscription: {
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: Date,
    status: {
      type: String,
      enum: ['active', 'expired', 'suspended'],
      default: 'active'
    }
  },
  createdBy: {
    type: String,
    default: 'Admin',
    required: true
  },
  metadata: {
    registrationIp: String,
    userAgent: String,
    notes: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
plusUserSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual to check if user is administrator
plusUserSchema.virtual('isAdministrator').get(function() {
  return this.role === 'administrator';
});

// Index for performance - removed duplicates
plusUserSchema.index({ email: 1 });
plusUserSchema.index({ username: 1 });
plusUserSchema.index({ plusCode: 1 });
plusUserSchema.index({ isActive: 1 });
plusUserSchema.index({ role: 1 });
plusUserSchema.index({ createdAt: -1 });

// Encryption utilities with proper AES implementation
const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.AES_ENCRYPTION_KEY || 'default-32-character-key-change';
const FIXED_IV = process.env.AES_IV ? Buffer.from(process.env.AES_IV) : Buffer.alloc(16, 0);

// Ensure the key is exactly 32 bytes for AES-256
const getProperKey = () => {
  const key = ENCRYPTION_KEY;
  if (key.length === 32) {
    return Buffer.from(key, 'utf8');
  } else if (key.length > 32) {
    return Buffer.from(key.substring(0, 32), 'utf8');
  } else {
    // Pad with zeros if too short
    const paddedKey = key + '0'.repeat(32 - key.length);
    return Buffer.from(paddedKey, 'utf8');
  }
};

// Method to encrypt password with proper AES-256-CBC
plusUserSchema.statics.encryptPassword = function(password) {
  try {
    const key = getProperKey();
    const cipher = crypto.createCipheriv(ALGORITHM, key, FIXED_IV);
    
    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Return the encrypted string with IV prepended for consistency
    return FIXED_IV.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('AES Encryption error:', error);
    // Fallback to base64 if AES fails
    return 'fallback:' + Buffer.from(password).toString('base64');
  }
};

// Method to decrypt password with proper AES-256-CBC
plusUserSchema.statics.decryptPassword = function(encryptedPassword) {
  try {
    // Handle fallback format
    if (encryptedPassword.startsWith('fallback:')) {
      return Buffer.from(encryptedPassword.substring(9), 'base64').toString('utf8');
    }
    
    // Handle new AES format
    if (encryptedPassword.includes(':')) {
      const parts = encryptedPassword.split(':');
      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      
      const key = getProperKey();
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    }
    
    // Handle legacy base64 format (for backwards compatibility)
    return Buffer.from(encryptedPassword, 'base64').toString('utf8');
    
  } catch (error) {
    console.error('AES Decryption error:', error);
    
    // Try fallback decryption methods
    try {
      // Try base64 decode
      return Buffer.from(encryptedPassword, 'base64').toString('utf8');
    } catch (fallbackError) {
      console.error('All decryption methods failed:', fallbackError);
      return 'Unable to decrypt password';
    }
  }
};

// Generate random password (8 characters)
plusUserSchema.statics.generatePassword = function() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// Generate random plus code (6 characters)
plusUserSchema.statics.generatePlusCode = function() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Pre-save middleware to handle both password formats
plusUserSchema.pre('save', async function(next) {
  // Clear features if user is administrator
  if (this.role === 'administrator') {
    this.features = [];
    // Clear access level for administrators
    this.accessLevel = undefined;
  } else {
    // Clear tab access if user is not administrator
    this.tabAccess = [];
  }
  
  // Handle password encryption and hashing
  if (this.isModified('password')) {
    try {
      const originalPassword = this.password;
      
      // Create encrypted version for storage
      this.encryptedPassword = this.constructor.encryptPassword(originalPassword);
      
      // Hash password for authentication
      const salt = await bcrypt.genSalt(12);
      this.password = await bcrypt.hash(originalPassword, salt);
      
    } catch (error) {
      return next(error);
    }
  }
  
  next();
});

// Method to check password
plusUserSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Method to get decrypted password (for admin viewing)
plusUserSchema.methods.getDecryptedPassword = function() {
  return this.constructor.decryptPassword(this.encryptedPassword);
};

// Method to update login info
plusUserSchema.methods.updateLoginInfo = function() {
  this.lastLoginAt = new Date();
  this.loginCount += 1;
  return this.save();
};

// Static method to find active users
plusUserSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

const PlusUser = mongoose.models.PlusUser || mongoose.model('PlusUser', plusUserSchema);

export default PlusUser;
