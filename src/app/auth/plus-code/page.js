'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PlusCodePage() {
  const [plusCode, setPlusCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (plusCode.length !== 6) {
      setError('Plus Code must be 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify-plus-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plusCode }),
      });

      const data = await response.json();

      if (data.success) {
        // Store user data in sessionStorage
        sessionStorage.setItem('tempUserData', JSON.stringify(data.userData));
        router.push('/auth/login');
      } else {
        setError(data.error || 'Invalid Plus Code');
      }
    } catch (error) {
      console.error('Plus code verification failed:', error);
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="max-w-md w-full space-y-8 bg-gray-900 p-8 rounded-xl shadow-2xl border border-gray-700">
        <div>
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 bg-gray-900 flex items-center justify-center">
              <span className="text-white font-bold text-xl">K+</span>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Enter Your Plus Code
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Please enter your 6-character Plus Code to continue
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="plus-code" className="sr-only">
              Plus Code
            </label>
            <input
              id="plus-code"
              name="plus-code"
              type="text"
              maxLength="6"
              required
              className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-600 placeholder-gray-400 text-white bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 text-lg text-center tracking-widest transition-colors"
              placeholder="Enter Plus Code"
              value={plusCode}
              onChange={(e) => setPlusCode(e.target.value.toUpperCase())}
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
                'Continue'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
