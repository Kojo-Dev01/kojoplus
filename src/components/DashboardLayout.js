'use client';

import { useState } from 'react';
import DashboardHeader from './DashboardHeader';
import DashboardSidebar from './DashboardSidebar';

export default function DashboardLayout({ children, user }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-800">
      {/* Dashboard Header */}
      <DashboardHeader 
        user={user} 
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <div className="flex">
        {/* Dashboard Sidebar */}
        <DashboardSidebar 
          user={user}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        {/* Main Content */}
        <div className="flex-1 lg:ml-64">
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
