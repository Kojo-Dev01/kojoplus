import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  slotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BookingSlot',
    required: true,
    index: true
  },
  timeSlotIndex: {
    type: Number,
    required: true
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
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  notes: {
    type: String,
    trim: true,
    maxLength: [500, 'Notes cannot exceed 500 characters']
  },
  bookedDate: {
    type: Date,
    required: true
  },
  timeSlot: {
    start: String,
    end: String
  }
}, {
  timestamps: true
});

// Compound index for efficient querying
BookingSchema.index({ userId: 1, status: 1 });
BookingSchema.index({ slotId: 1, timeSlotIndex: 1 });
BookingSchema.index({ bookedDate: 1, status: 1 });

// Virtual for booking reference
BookingSchema.virtual('bookingReference').get(function() {
  return `BK-${this._id.toString().slice(-8).toUpperCase()}`;
});

// Virtual for full name
BookingSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Static method to get user bookings
BookingSchema.statics.getUserBookings = function(userId, options = {}) {
  const query = { userId };
  
  if (options.status) {
    query.status = options.status;
  }
  
  return this.find(query)
    .populate('slotId')
    .sort({ bookedDate: -1 });
};

// Static method to check if slot is already booked by user
BookingSchema.statics.isSlotBookedByUser = function(userId, slotId, timeSlotIndex) {
  return this.findOne({
    userId,
    slotId,
    timeSlotIndex,
    status: { $in: ['pending', 'confirmed'] }
  });
};

// Instance method to cancel booking
BookingSchema.methods.cancelBooking = async function() {
  this.status = 'cancelled';
  
  // Also unbook the time slot in BookingSlot
  const BookingSlot = mongoose.model('BookingSlot');
  const bookingSlot = await BookingSlot.findById(this.slotId);
  if (bookingSlot && bookingSlot.timeSlots[this.timeSlotIndex]) {
    bookingSlot.timeSlots[this.timeSlotIndex].isBooked = false;
    await bookingSlot.save();
  }
  
  return this.save();
};

// Pre-save middleware to ensure email is lowercase
BookingSchema.pre('save', function(next) {
  if (this.email) {
    this.email = this.email.toLowerCase().trim();
  }
  next();
});

export default mongoose.models.Booking || mongoose.model('Booking', BookingSchema);
