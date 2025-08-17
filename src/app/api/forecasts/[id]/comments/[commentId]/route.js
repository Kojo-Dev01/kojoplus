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

    const { id: forecastId, commentId } = params;

    // Find the forecast and remove the comment
    const forecast = await Forecast.findById(forecastId);
    
    if (!forecast) {
      return NextResponse.json(
        { error: 'Forecast not found' },
        { status: 404 }
      );
    }

    // Check if comment exists
    const commentIndex = forecast.comments.findIndex(
      comment => comment._id.toString() === commentId
    );

    if (commentIndex === -1) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    // Remove the comment
    forecast.comments.splice(commentIndex, 1);
    
    // Save the updated forecast
    await forecast.save();

    return NextResponse.json({
      success: true,
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete comment' },
      { status: 500 }
    );
  }
}
