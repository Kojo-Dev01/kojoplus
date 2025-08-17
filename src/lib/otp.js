import connectDB from './mongodb';
import PlusOTP from '@/models/plusotp';

export async function storeOTP(email, otp) {
  try {
    await connectDB();
    const otpRecord = await PlusOTP.createOTP(email, otp);
    return { success: true, id: otpRecord._id };
  } catch (error) {
    console.error('Failed to store OTP:', error);
    return { success: false, error: error.message };
  }
}

export async function verifyOTP(email, providedOTP) {
  try {
    await connectDB();
    return await PlusOTP.verifyOTP(email, providedOTP);
  } catch (error) {
    console.error('Failed to verify OTP:', error);
    return { valid: false, error: 'OTP verification failed' };
  }
}

export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function cleanupExpiredOTPs() {
  try {
    await connectDB();
    const result = await PlusOTP.cleanupExpired();
    console.log(`Cleaned up ${result.deletedCount} expired OTPs`);
    return result;
  } catch (error) {
    console.error('Failed to cleanup expired OTPs:', error);
    return null;
  }
}

// Optional: Schedule cleanup (can be removed since TTL index handles this automatically)
// setInterval(cleanupExpiredOTPs, 5 * 60 * 1000); // Every 5 minutes
