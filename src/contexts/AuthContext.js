'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tokenRefreshInProgress, setTokenRefreshInProgress] = useState(false);
  const router = useRouter();

  // Check authentication status
  const checkAuth = async () => {
    console.log('🔍 AuthContext: Starting auth check...');
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('🔍 AuthContext: Auth verify response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ AuthContext: Auth verification successful, user:', data.user?.email);
        setUser(data.user);
        setIsAuthenticated(true);
        return true;
      } else {
        const errorData = await response.json();
        console.log('❌ AuthContext: Auth verification failed:', errorData.message);
        setUser(null);
        setIsAuthenticated(false);
        return false;
      }
    } catch (error) {
      console.error('❌ AuthContext: Auth check failed with error:', error);
      setUser(null);
      setIsAuthenticated(false);
      return false;
    } finally {
      console.log('🔍 AuthContext: Auth check completed, loading set to false');
      setLoading(false);
    }
  };

  // Login function
  const login = async (credentials) => {
    console.log('🔐 AuthContext: Starting login process...');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });

      console.log('🔐 AuthContext: Login response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ AuthContext: Login successful, user:', data.user?.email);
        setUser(data.user);
        setIsAuthenticated(true);
        return { success: true };
      } else {
        const error = await response.json();
        console.log('❌ AuthContext: Login failed:', error.message);
        return { success: false, error: error.message };
      }
    } catch (error) {
      console.error('❌ AuthContext: Login error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  // Logout function
  const logout = async () => {
    console.log('🚪 AuthContext: Starting logout process...');
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      console.log('✅ AuthContext: Logout API call completed');
    } catch (error) {
      console.error('❌ AuthContext: Logout error:', error);
    } finally {
      console.log('🚪 AuthContext: Clearing auth state and redirecting to login');
      setUser(null);
      setIsAuthenticated(false);
      router.push('/auth/login');
    }
  };

  // Enhanced secure API call helper with better retry logic
  const secureApiCall = async (url, options = {}) => {
    console.log(`🌐 AuthContext: Making secure API call to ${url}`);
    
    // Prevent multiple simultaneous refresh attempts
    if (tokenRefreshInProgress) {
      console.log('⏳ AuthContext: Token refresh in progress, waiting...');
      // Wait for ongoing refresh to complete
      await new Promise(resolve => {
        const checkRefresh = () => {
          if (!tokenRefreshInProgress) {
            console.log('✅ AuthContext: Token refresh completed, proceeding with request');
            resolve();
          } else {
            setTimeout(checkRefresh, 100);
          }
        };
        checkRefresh();
      });
    }

    try {
      const response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      console.log(`🌐 AuthContext: API call to ${url} returned status: ${response.status}`);

      // If unauthorized and not already refreshing, try to refresh token once
      if (response.status === 401 && !tokenRefreshInProgress) {
        console.log('🔄 AuthContext: Received 401, attempting token refresh...');
        
        setTokenRefreshInProgress(true);
        
        try {
          const refreshResponse = await fetch('/api/auth/refresh', {
            method: 'POST',
            credentials: 'include'
          });

          console.log('🔄 AuthContext: Token refresh response status:', refreshResponse.status);

          if (refreshResponse.ok) {
            console.log('✅ AuthContext: Token refreshed successfully, retrying original request...');
            
            // Retry original request with refreshed token
            const retryResponse = await fetch(url, {
              ...options,
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
                ...options.headers
              }
            });
            
            console.log(`🔄 AuthContext: Retry request to ${url} returned status: ${retryResponse.status}`);
            return retryResponse;
          } else {
            // Refresh failed, logout user
            console.log('❌ AuthContext: Token refresh failed, logging out user...');
            await logout();
            throw new Error('Authentication expired');
          }
        } finally {
          setTokenRefreshInProgress(false);
        }
      }

      return response;
    } catch (error) {
      // Reset refresh flag on any error
      setTokenRefreshInProgress(false);
      
      // If it's not an auth error, just throw it
      if (error.message !== 'Authentication expired') {
        console.error(`❌ AuthContext: API call to ${url} failed:`, error);
      }
      throw error;
    }
  };

  // Secure API call helper for form data (multipart/form-data)
  const secureApiFormCall = async (url, options = {}) => {
    console.log(`📝 AuthContext: Making secure form API call to ${url}`);
    
    // Prevent multiple simultaneous refresh attempts
    if (tokenRefreshInProgress) {
      console.log('⏳ AuthContext: Token refresh in progress, waiting...');
      // Wait for ongoing refresh to complete
      await new Promise(resolve => {
        const checkRefresh = () => {
          if (!tokenRefreshInProgress) {
            console.log('✅ AuthContext: Token refresh completed, proceeding with form request');
            resolve();
          } else {
            setTimeout(checkRefresh, 100);
          }
        };
        checkRefresh();
      });
    }

    try {
      const response = await fetch(url, {
        ...options,
        credentials: 'include',
        // Don't set Content-Type header for FormData - let browser set it with boundary
        headers: {
          ...options.headers
        }
      });

      console.log(`📝 AuthContext: Form API call to ${url} returned status: ${response.status}`);

      // If unauthorized and not already refreshing, try to refresh token once
      if (response.status === 401 && !tokenRefreshInProgress) {
        console.log('🔄 AuthContext: Received 401, attempting token refresh...');
        
        setTokenRefreshInProgress(true);
        
        try {
          const refreshResponse = await fetch('/api/auth/refresh', {
            method: 'POST',
            credentials: 'include'
          });

          console.log('🔄 AuthContext: Token refresh response status:', refreshResponse.status);

          if (refreshResponse.ok) {
            console.log('✅ AuthContext: Token refreshed successfully, retrying original form request...');
            
            // Retry original request with refreshed token
            const retryResponse = await fetch(url, {
              ...options,
              credentials: 'include',
              headers: {
                ...options.headers
              }
            });
            
            console.log(`🔄 AuthContext: Retry form request to ${url} returned status: ${retryResponse.status}`);
            return retryResponse;
          } else {
            // Refresh failed, logout user
            console.log('❌ AuthContext: Token refresh failed, logging out user...');
            await logout();
            throw new Error('Authentication expired');
          }
        } finally {
          setTokenRefreshInProgress(false);
        }
      }

      return response;
    } catch (error) {
      // Reset refresh flag on any error
      setTokenRefreshInProgress(false);
      
      // If it's not an auth error, just throw it
      if (error.message !== 'Authentication expired') {
        console.error(`❌ AuthContext: Form API call to ${url} failed:`, error);
      }
      throw error;
    }
  };

  useEffect(() => {
    console.log('🚀 AuthContext: Component mounted, checking auth...');
    checkAuth();
  }, []);

  // Log state changes
  useEffect(() => {
    console.log('🔄 AuthContext: Auth state changed - isAuthenticated:', isAuthenticated, 'user:', user?.email || 'none');
  }, [isAuthenticated, user]);

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    checkAuth,
    secureApiCall,
    secureApiFormCall
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
