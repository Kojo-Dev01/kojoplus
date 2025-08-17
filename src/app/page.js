'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          // User is authenticated, redirect to dashboard
          router.replace('/dashboard');
        } else {
          // User is not authenticated, redirect to plus-code
          router.replace('/auth/plus-code');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.replace('/auth/plus-code');
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-800">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-gray-300">Loading...</p>
      </div>
    </div>
  );
}
