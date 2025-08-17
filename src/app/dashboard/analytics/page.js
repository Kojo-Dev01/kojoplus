'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';

export default function AnalyticsPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);

          // Check if user has access to analytics
          if (userData?.isAdministrator && !userData.tabAccess?.includes('analytics')) {
            setAccessDenied(true);
          }
        } else {
          router.replace('/auth/plus-code');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.replace('/auth/plus-code');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (accessDenied) {
    return (
      <DashboardLayout user={user}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Access Denied</h2>
            <p className="text-gray-400 mb-4">
              You don't have permission to access Analytics. Please contact your administrator if you need access.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
          <h1 className="text-2xl font-bold text-white mb-2">Analytics</h1>
          <p className="text-gray-400">System analytics and performance metrics</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-700">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Users</p>
                <p className="text-white font-semibold text-2xl">0</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 p-6 rounded-xl border border-gray-700">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Active Sessions</p>
                <p className="text-white font-semibold text-2xl">0</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 p-6 rounded-xl border border-gray-700">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Page Views</p>
                <p className="text-white font-semibold text-2xl">0</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 p-6 rounded-xl border border-gray-700">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Uptime</p>
                <p className="text-white font-semibold text-2xl">99.9%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl border border-gray-700 p-6">
          <div className="text-center py-12">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <h3 className="text-white font-medium mb-2">Detailed analytics coming soon</h3>
            <p className="text-gray-400">Advanced analytics and reporting features will be available here.</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
