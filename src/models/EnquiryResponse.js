import mongoose from 'mongoose';

const EnquiryResponseSchema = new mongoose.Schema({
  enquiryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enquiry',
    required: true,
    index: true
  },
  respondedBy: {
    type: String,
    required: true,
    trim: true
  },
  responseMessage: {
    type: String,
    required: [true, 'Response message is required'],
    trim: true,
    minLength: [10, 'Response must be at least 10 characters'],
    maxLength: [2000, 'Response cannot exceed 2000 characters']
  },
  responseType: {
    type: String,
    enum: ['resolution', 'update', 'info', 'closure'],
    default: 'resolution'
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  attachments: [{
    filename: String,
    url: String,
    fileType: String,
    fileSize: Number
  }],
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
EnquiryResponseSchema.index({ enquiryId: 1, createdAt: -1 });
EnquiryResponseSchema.index({ respondedBy: 1, createdAt: -1 });

// Static method to get responses for an enquiry
EnquiryResponseSchema.statics.getResponsesForEnquiry = function(enquiryId) {
  return this.find({ enquiryId })
    .sort({ createdAt: 1 })
    .lean();
};

// Static method to create response with enquiry update
EnquiryResponseSchema.statics.createWithEnquiryUpdate = async function(responseData, enquiryStatus = null, resolvedBy = null) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Create the response
    const response = new this(responseData);
    await response.save({ session });

    // Update the enquiry if status provided
    if (enquiryStatus) {
      const Enquiry = mongoose.model('Enquiry');
      await Enquiry.findByIdAndUpdate(
        responseData.enquiryId,
        {
          status: enquiryStatus,
          resolvedAt: enquiryStatus === 'resolved' || enquiryStatus === 'closed' ? new Date() : null,
          resolvedBy: resolvedBy
        },
        { session }
      );
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

export default mongoose.models.EnquiryResponse || mongoose.model('EnquiryResponse', EnquiryResponseSchema);
