'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Bell } from 'lucide-react';

export default function DashboardHeader({ user, sidebarOpen, setSidebarOpen }) {
  const router = useRouter();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.replace('/auth/plus-code');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="bg-gray-800 shadow-xl border-b border-gray-700 sticky top-0 z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Mobile menu and title */}
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Page title - shown on mobile when sidebar is closed */}
            <div className="lg:hidden ml-2">
              <h1 className="text-lg font-semibold text-white">Dashboard</h1>
            </div>
          </div>

          {/* Right side - Notifications and User menu */}
          <div className="flex items-center space-x-4">
            {/* Notifications button */}
            <button className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-all duration-200 relative">
              <Bell className="w-5 h-5" />
              {/* Notification badge */}
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
            </button>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-3 text-gray-300 hover:text-white p-2 rounded-lg hover:bg-gray-700 transition-all duration-200"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </span>
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-gray-400 capitalize">
                    {user?.isAdministrator ? 'Administrator' : user?.role}
                  </p>
                </div>
                <svg className="w-4 h-4 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={userMenuOpen ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                </svg>
              </button>

              {/* User dropdown menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 py-2 z-50 transform transition-all duration-200">
                  {/* User info section */}
                  <div className="px-4 py-3 border-b border-gray-700">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">
                          {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{user?.fullName}</p>
                        <p className="text-xs text-gray-400">{user?.email}</p>
                        <div className="flex items-center mt-1">
                          <span className="text-xs text-gray-400 mr-2">Plus Code:</span>
                          <span className="text-xs font-mono text-blue-400 bg-gray-700 px-2 py-1 rounded">
                            {user?.plusCode}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="py-2">
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        // Add profile logic here
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 transition-colors flex items-center"
                    >
                      <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Profile Settings
                    </button>
                    
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        // Add preferences logic here
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 transition-colors flex items-center"
                    >
                      <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                      </svg>
                      Preferences
                    </button>

                    <div className="border-t border-gray-700 my-2"></div>
                    
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-gray-700 transition-colors flex items-center"
                    >
                      <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for mobile when user menu is open */}
      {userMenuOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setUserMenuOpen(false)}
        />
      )}
    </header>
  );
}
