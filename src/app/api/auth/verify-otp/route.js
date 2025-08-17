import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PlusUser from '@/models/PlusUser';
import { verifyOTP } from '@/lib/otp';
import { signToken } from '@/lib/jwt';

export async function POST(request) {
  try {
    await connectDB();
    
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json({
        success: false,
        error: 'Email and OTP are required'
      }, { status: 400 });
    }

    // Verify OTP using database
    const otpResult = await verifyOTP(email, otp);
    
    if (!otpResult.valid) {
      return NextResponse.json({
        success: false,
        error: otpResult.error
      }, { status: 400 });
    }

    // Find user and update login info
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

    // Update login information
    try {
      await user.updateLoginInfo();
    } catch (updateError) {
      console.error('Failed to update login info:', updateError);
      // Continue with login even if update fails
    }

    // Create JWT token
    const tokenPayload = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      email: user.email,
      username: user.username,
      role: user.role,
      isAdministrator: user.isAdministrator,
      plusCode: user.plusCode
    };

    const token = signToken(tokenPayload);

    // Create response with token in cookie
    const response = NextResponse.json({
      success: true,
      user: tokenPayload
    });

    // Set httpOnly cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return response;
  } catch (error) {
    console.error('OTP verification error:', error);
    
    // Log specific validation errors
    if (error.name === 'ValidationError') {
      console.error('Validation errors:', error.errors);
    }
    
    return NextResponse.json({
      success: false,
      error: 'Server error'
    }, { status: 500 });
  }
}
