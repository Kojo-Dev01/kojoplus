'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Check if user came from plus-code verification
    const tempUserData = sessionStorage.getItem('tempUserData');
    if (!tempUserData) {
      router.replace('/auth/plus-code');
      return;
    }
    setUserData(JSON.parse(tempUserData));
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...credentials,
          userData: userData
        }),
      });

      const data = await response.json();

      if (data.success && data.requiresOTP) {
        // Store user data for OTP verification
        sessionStorage.setItem('otpUserData', JSON.stringify(data.userData));
        // Clear temporary login data
        sessionStorage.removeItem('tempUserData');
        router.push('/auth/otp-verify');
      } else if (data.success) {
        // Direct login (fallback)
        sessionStorage.removeItem('tempUserData');
        router.push('/dashboard');
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Login failed:', error);
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
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
            <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">K+</span>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Welcome, {userData?.firstName}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Please enter your credentials to continue
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              {/* <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label> */}
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none relative block w-full px-4 py-6 border-0 border-b-2 border-gray-600 placeholder-gray-400 text-white bg-transparent focus:outline-none focus:border-blue-500 text-lg transition-colors"
                placeholder="Username"
                value={credentials.username}
                onChange={(e) => setCredentials(prev => ({
                  ...prev,
                  username: e.target.value
                }))}
              />
            </div>
            <div>
              {/* <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label> */}
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none relative block w-full px-4 py-6 border-0 border-b-2 border-gray-600 placeholder-gray-400 text-white bg-transparent focus:outline-none focus:border-blue-500 text-lg transition-colors"
                placeholder="Password"
                value={credentials.password}
                onChange={(e) => setCredentials(prev => ({
                  ...prev,
                  password: e.target.value
                }))}
              />
            </div>
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
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
