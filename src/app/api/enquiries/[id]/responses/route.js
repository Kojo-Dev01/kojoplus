import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import connectDB from '../../../../../../lib/mongodb';
import EnquiryResponse from '../../../../../../models/EnquiryResponse';

export async function GET(request, { params }) {
  try {
      // Verify admin authentication using JWT
      const token = getTokenFromRequest(request);
      
      if (!token) {
        return NextResponse.json({ error: 'No token provided' }, { status: 401 });
      }
  
      const payload = verifyToken(token);
      
      if (!payload) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }
  
      await connectDB();

    const { id } = await params;
    const responses = await EnquiryResponse.getResponsesForEnquiry(id);

    return NextResponse.json({
      responses
    });

  } catch (error) {
    console.error('Error fetching enquiry responses:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
