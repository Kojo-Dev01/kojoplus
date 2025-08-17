import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import connectDB from '@/lib/mongodb';
import Forecast from '@/models/Forecast';

export async function DELETE(request, { params }) {
  try {
    // Verify admin authentication
    const token = getTokenFromRequest(request);
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const payload = verifyToken(token);
    
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    await connectDB();

    const { id: forecastId, commentId, replyId } = params;

    // Find the forecast
    const forecast = await Forecast.findById(forecastId);
    
    if (!forecast) {
      return NextResponse.json(
        { error: 'Forecast not found' },
        { status: 404 }
      );
    }

    // Find the comment
    const comment = forecast.comments.find(
      comment => comment._id.toString() === commentId
    );

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    // Check if reply exists
    const replyIndex = comment.replies.findIndex(
      reply => reply._id.toString() === replyId
    );

    if (replyIndex === -1) {
      return NextResponse.json(
        { error: 'Reply not found' },
        { status: 404 }
      );
    }

    // Remove the reply from the comment's replies array
    comment.replies.splice(replyIndex, 1);
    
    // Update the comment's updatedAt timestamp
    comment.updatedAt = new Date();
    
    // Save the updated forecast
    await forecast.save();

    return NextResponse.json({
      success: true,
      message: 'Reply deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting reply:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete reply' },
      { status: 500 }
    );
  }
}
