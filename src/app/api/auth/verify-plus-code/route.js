import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PlusUser from '@/models/PlusUser';

export async function POST(request) {
  try {
    await connectDB();
    
    const { plusCode } = await request.json();

    if (!plusCode || plusCode.length !== 6) {
      return NextResponse.json({
        success: false,
        error: 'Plus Code must be 6 characters'
      }, { status: 400 });
    }

    const user = await PlusUser.findOne({ 
      plusCode: plusCode.toUpperCase(),
      isActive: true 
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Invalid Plus Code'
      }, { status: 400 });
    }

    // Return user data (excluding sensitive information)
    return NextResponse.json({
      success: true,
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
    console.error('Plus code verification error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error'
    }, { status: 500 });
  }
}
