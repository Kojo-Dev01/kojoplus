'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OTPVerifyPage() {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const router = useRouter();

  useEffect(() => {
    // Check if user came from login
    const tempUserData = sessionStorage.getItem('otpUserData');
    if (!tempUserData) {
      router.replace('/auth/plus-code');
      return;
    }
    setUserData(JSON.parse(tempUserData));
  }, [router]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      setError('OTP must be 6 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userData.email,
          otp: otp
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Clear temporary data
        sessionStorage.removeItem('otpUserData');
        router.push('/dashboard');
      } else {
        setError(data.error || 'Invalid OTP');
      }
    } catch (error) {
      console.error('OTP verification failed:', error);
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userData.email
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResendCooldown(60); // 1 minute cooldown
        setError('');
      } else {
        setError(data.error || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('Resend OTP failed:', error);
      setError('Connection error. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  if (!userData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-800">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="max-w-md w-full space-y-8 bg-gray-900 p-8 rounded-xl shadow-2xl border border-gray-700">
        <div>
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">K+</span>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Verify Your Email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            We've sent a 6-digit code to <span className="text-blue-400 font-medium">your email</span>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <input
              id="otp"
              name="otp"
              type="text"
              maxLength="6"
              pattern="[0-9]{6}"
              required
              className="appearance-none relative block w-full px-4 py-6 border-0 border-b-2 border-gray-600 placeholder-gray-400 text-white bg-transparent focus:outline-none focus:border-blue-500 text-center text-2xl tracking-widest transition-colors"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            />
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Verifying...
                </div>
              ) : (
                'Verify Code'
              )}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={resendLoading || resendCooldown > 0}
              className="text-sm text-blue-400 hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {resendLoading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-400 mr-2"></div>
                  Sending...
                </span>
              ) : resendCooldown > 0 ? (
                `Resend in ${resendCooldown}s`
              ) : (
                'Resend Code'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
