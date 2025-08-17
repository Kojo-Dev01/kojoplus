import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PlusUser from '@/models/PlusUser';
import { sendOTPEmail, generateOTP } from '@/lib/email';
import { storeOTP } from '@/lib/otp';

export async function POST(request) {
  try {
    await connectDB();
    
    const { username, password, userData } = await request.json();

    if (!username || !password || !userData) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }

    // Find user by plusCode and verify credentials
    const user = await PlusUser.findOne({ 
      plusCode: userData.plusCode,
      isActive: true 
    });
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 400 });
    }

    // Verify username
    if (user.username !== username.toLowerCase()) {
      return NextResponse.json({
        success: false,
        error: 'Invalid credentials'
      }, { status: 400 });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return NextResponse.json({
        success: false,
        error: 'Invalid credentials'
      }, { status: 400 });
    }

    // Generate and store OTP
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
      message: 'Verification code sent to your email',
      requiresOTP: true,
      userData: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        email: user.email,
        username: user.username,
        role: user.role,
        plusCode: user.plusCode
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error'
    }, { status: 500 });
  }
}
