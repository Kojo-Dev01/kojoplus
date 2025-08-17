import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import connectDB from '@/lib/mongodb';
import PlusUser from '@/models/PlusUser';

export async function GET(request) {
  try {
    const token = getTokenFromRequest(request);
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const payload = verifyToken(token);
    
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Verify user still exists and is active
    await connectDB();
    const user = await PlusUser.findById(payload.id);
    
    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
    }

    // Return current user data from database
    return NextResponse.json({
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      email: user.email,
      username: user.username,
      role: user.role,
      isAdministrator: user.isAdministrator,
      plusCode: user.plusCode,
      accessLevel: user.accessLevel,
      features: user.features,
      tabAccess: user.tabAccess
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }
}
