'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';

export default function DashboardPage() {
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
    return null; // Will redirect
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
          <h1 className="text-2xl font-bold text-white mb-2">
            Welcome back, {user.firstName}!
          </h1>
          <p className="text-gray-400">
            Here's an overview of your KojoPlus dashboard
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-700">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Role</p>
                <p className="text-white font-semibold capitalize">{user.role}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 p-6 rounded-xl border border-gray-700">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Status</p>
                <p className="text-white font-semibold">Active</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 p-6 rounded-xl border border-gray-700">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Access Level</p>
                <p className="text-white font-semibold capitalize">
                  {user.isAdministrator ? 'Administrator' : (user.accessLevel || 'Standard')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Account Information Card */}
        <div className="bg-gray-900 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-medium text-white mb-4">Account Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm">Full Name</label>
                <p className="text-white font-medium">{user.fullName}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Email</label>
                <p className="text-gray-300">{user.email}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Username</label>
                <p className="text-white font-medium">@{user.username}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm">Available Navigation</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-full">Overview</span>
                  {user.isAdministrator && user.tabAccess?.map((tab) => (
                    <span key={tab} className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-full capitalize">
                      {tab.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
              {!user.isAdministrator && user.features?.length > 0 && (
                <div>
                  <label className="text-gray-400 text-sm">Features</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {user.features.map((feature) => (
                      <span key={feature} className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-full">
                        {feature.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
