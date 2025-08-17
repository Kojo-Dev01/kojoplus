import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PlusUser from '@/models/PlusUser';
import { sendOTPEmail, generateOTP } from '@/lib/email';
import { storeOTP } from '@/lib/otp';

export async function POST(request) {
  try {
    await connectDB();
    
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email is required'
      }, { status: 400 });
    }

    // Find user
    const user = await PlusUser.findOne({ 
      email: email.toLowerCase(),
      isActive: true 
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 400 });
    }

    // Generate and store new OTP
    const otp = generateOTP();
    const otpResult = await storeOTP(user.email, otp);
    
    if (!otpResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to generate verification code'
      }, { status: 500 });
    }

    const emailResult = await sendOTPEmail(user.email, user.firstName, otp);
    
    if (!emailResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to send verification email'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'New verification code sent to your email'
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error'
    }, { status: 500 });
  }
}
