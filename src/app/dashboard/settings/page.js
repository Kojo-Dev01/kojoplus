'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
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

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
          <h1 className="text-2xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400">Manage system settings and configuration</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-900 rounded-xl border border-gray-700 p-6">
            <h3 className="text-lg font-medium text-white mb-4">General Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm block mb-2">System Name</label>
                <input
                  type="text"
                  value="KojoPlus"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  readOnly
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-2">Maintenance Mode</label>
                <div className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  <span className="text-gray-300">Enable maintenance mode</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl border border-gray-700 p-6">
            <h3 className="text-lg font-medium text-white mb-4">Security Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm block mb-2">Session Timeout (minutes)</label>
                <input
                  type="number"
                  value="30"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-2">Password Requirements</label>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input type="checkbox" checked readOnly className="mr-2" />
                    <span className="text-gray-300">Minimum 8 characters</span>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" checked readOnly className="mr-2" />
                    <span className="text-gray-300">Require special characters</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl border border-gray-700 p-6">
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h3 className="text-white font-medium mb-2">Advanced settings coming soon</h3>
            <p className="text-gray-400">More configuration options will be available here.</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
