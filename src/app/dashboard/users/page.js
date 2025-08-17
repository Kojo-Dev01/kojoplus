'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, ChevronDown, Eye, Send, BarChart3, CheckCircle } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
// import UserDetailsPanel from '@/components/users/UserDetailsPanel';
// import UserStatisticsPanel from '@/components/users/UserStatisticsPanel';
// import BulkEmailModal from '@/components/common/BulkEmailModal';
// import COUNTRY_CODES from '@/data/countryCodes.json';

// Temporary placeholder country codes data
const COUNTRY_CODES = [
  { country: 'United States', code: '+1', flag: '🇺🇸' },
  { country: 'United Kingdom', code: '+44', flag: '🇬🇧' },
  { country: 'Nigeria', code: '+234', flag: '🇳🇬' },
  { country: 'Ghana', code: '+233', flag: '🇬🇭' },
  { country: 'South Africa', code: '+27', flag: '🇿🇦' },
  { country: 'Kenya', code: '+254', flag: '🇰🇪' },
  { country: 'Germany', code: '+49', flag: '🇩🇪' },
  { country: 'France', code: '+33', flag: '🇫🇷' },
  { country: 'Canada', code: '+1', flag: '🇨🇦' },
  { country: 'Australia', code: '+61', flag: '🇦🇺' }
];

export default function UsersPage() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [stats, setStats] = useState({});
  const [pagination, setPagination] = useState({});
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPanel, setShowPanel] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showVerificationDropdown, setShowVerificationDropdown] = useState(false);
  const [verificationFilter, setVerificationFilter] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countryFilter, setCountryFilter] = useState('');
  const [countrySearchTerm, setCountrySearchTerm] = useState('');
  const [showBulkEmailModal, setShowBulkEmailModal] = useState(false);
  const [showStatsPanel, setShowStatsPanel] = useState(false);
  const [error, setError] = useState(null);
  
  // Separate state for all users (for bulk operations and statistics)
  const [allUsers, setAllUsers] = useState([]);
  const [loadingAllUsers, setLoadingAllUsers] = useState(false);
  const [allUsersLoaded, setAllUsersLoaded] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          
          // Check if user has access to users management
          if (userData?.isAdministrator && !userData.tabAccess?.includes('users')) {
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

  // Fetch paginated users for table display
  const fetchUsers = async (page = 1, searchQuery = '', status = '', verification = '') => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        search: searchQuery,
        ...(status && { status }),
        ...(verification && { verification })
      });

      const response = await fetch(`/api/users?${params}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setStats(data.stats);
        setPagination(data.pagination);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch users');
      }
    } catch (error) {
      setError('Failed to fetch users');
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all users for bulk operations (background)
  const fetchAllUsers = async () => {
    if (loadingAllUsers || allUsersLoaded) return;
    
    try {
      setLoadingAllUsers(true);
      
      console.log('Fetching all users in background...');
      
      const response = await fetch('/api/users?all=true', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setAllUsers(data.users || []);
        setAllUsersLoaded(true);
        console.log(`Loaded ${data.users?.length || 0} users for bulk operations`);
        return data.users || [];
      } else {
        console.error('Failed to fetch all users');
        return [];
      }
    } catch (error) {
      console.error('Error fetching all users:', error);
      return [];
    } finally {
      setLoadingAllUsers(false);
    }
  };

  // Load paginated users on filter changes
  useEffect(() => {
    if (user && !accessDenied) {
      fetchUsers(currentPage, search, statusFilter, verificationFilter);
    }
  }, [currentPage, search, statusFilter, verificationFilter, user, accessDenied]);

  // Load all users in background on component mount
  useEffect(() => {
    if (user && !accessDenied) {
      fetchAllUsers();
    }
  }, [user, accessDenied]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers(1, search, statusFilter, verificationFilter);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowPanel(true);
  };

  const handleClosePanel = () => {
    setShowPanel(false);
    setSelectedUser(null);
  };

  // Get all user emails for bulk messaging with filtering options
  const getTargetGroupEmails = (targetGroup = 'all') => {
    if (allUsers.length === 0) {
      return [];
    }

    let filteredUsers = allUsers;

    switch (targetGroup) {
      case 'active':
        filteredUsers = allUsers.filter(user => user.isActive);
        break;
      case 'inactive':
        filteredUsers = allUsers.filter(user => !user.isActive);
        break;
      case 'verified':
        filteredUsers = allUsers.filter(user => user.emailVerified);
        break;
      case 'unverified':
        filteredUsers = allUsers.filter(user => !user.emailVerified);
        break;
      case 'all':
      default:
        filteredUsers = allUsers;
        break;
    }

    return filteredUsers.map(user => user.email).filter(email => email);
  };

  // Get count for each target group
  const getTargetGroupCounts = () => {
    if (allUsers.length === 0) {
      return {
        all: 0,
        active: 0,
        inactive: 0,
        verified: 0,
        unverified: 0
      };
    }

    return {
      all: allUsers.length,
      active: allUsers.filter(user => user.isActive).length,
      inactive: allUsers.filter(user => !user.isActive).length,
      verified: allUsers.filter(user => user.emailVerified).length,
      unverified: allUsers.filter(user => !user.emailVerified).length
    };
  };

  // Helper function to extract country from WhatsApp number
  const getCountryFromWhatsApp = (whatsappNumber) => {
    if (!whatsappNumber) return null;
    
    // Clean the number (remove spaces, dashes, etc.)
    const cleanNumber = whatsappNumber.replace(/[\s\-\(\)]/g, '');
    
    // Sort country codes by length (longest first) to match longer codes first
    const sortedCodes = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
    
    for (const countryData of sortedCodes) {
      if (cleanNumber.startsWith(countryData.code)) {
        return countryData;
      }
    }
    
    return null;
  };

  // Filter users by country (client-side)
  const filteredUsers = users.filter(user => {
    if (!countryFilter) return true;
    
    const userCountry = getCountryFromWhatsApp(user.whatsapp || user.phone);
    return userCountry && userCountry.country === countryFilter;
  });

  const getCountry = (whatsappNumber) => {
    if (!whatsappNumber) return null;

    // Remove any non-digit characters except +
    const cleanNumber = whatsappNumber.replace(/[^\d+]/g, "");

    // Try to match with country codes, starting with longest codes first
    const sortedCodes = [...COUNTRY_CODES].sort(
      (a, b) => b.code.length - a.code.length
    );

    for (const countryData of sortedCodes) {
      if (cleanNumber.startsWith(countryData.code)) {
        return countryData;
      }
    }

    return null;
  };

  // Compute country counts from allUsers
  const countryCounts = (() => {
    const counts = {};
    allUsers.forEach((user) => {
      const countryData = getCountry(user.phone || user.whatsapp);
      if (countryData) {
        counts[countryData.country] = (counts[countryData.country] || 0) + 1;
      }
    });
    return counts;
  })();

  // Filter countries based on search term
  const filteredCountries = Object.keys(countryCounts)
    .map((countryName) => {
      const countryData = COUNTRY_CODES.find((c) => c.country === countryName);
      return countryData
        ? { ...countryData, count: countryCounts[countryName] }
        : null;
    })
    .filter(Boolean)
    .filter((country) => {
      const searchLower = countrySearchTerm.toLowerCase();
      return (
        country.country.toLowerCase().includes(searchLower) ||
        country.code.toLowerCase().includes(searchLower)
      );
    });

  // Get selected country data
  const selectedCountryData = COUNTRY_CODES.find(c => c.country === countryFilter);

  // Handle opening statistics panel
  const handleOpenStatsPanel = async () => {
    setShowStatsPanel(true);
    
    // Fetch all users if not already loaded
    if (!allUsersLoaded && allUsers.length === 0) {
      await fetchAllUsers();
    }
  };

  // Handle closing statistics panel
  const handleCloseStatsPanel = () => {
    setShowStatsPanel(false);
  };

  // Handle refresh of statistics (fetch all users again)
  const handleRefreshStats = async () => {
    setAllUsersLoaded(false); // Reset the loaded flag
    await fetchAllUsers();
  };

  // Handle opening bulk email modal
  const handleOpenBulkEmailModal = async () => {
    // Ensure all users are loaded before opening modal
    if (!allUsersLoaded && allUsers.length === 0) {
      await fetchAllUsers();
    }
    setShowBulkEmailModal(true);
  };

  if (loading && !user) {
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Access Denied</h2>
            <p className="text-gray-400 mb-4">
              You don't have permission to access User Management. Please contact your administrator if you need access.
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
        {/* Error Display */}
        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-xl p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-300">{error}</p>
              <button 
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Users Management</h1>
            <p className="mt-1 text-gray-300">Manage user accounts and permissions</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleOpenStatsPanel}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Statistics</span>
            </button>
            <button
              onClick={handleOpenBulkEmailModal}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors relative"
              disabled={loadingAllUsers && !allUsersLoaded}
            >
              {loadingAllUsers && !allUsersLoaded ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Bulk Message</span>
                  {allUsersLoaded && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-2 h-2 text-white" />
                    </div>
                  )}
                </>
              )}
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-600 text-gray-300 rounded-xl hover:bg-gray-700 transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              <ChevronDown className={`w-4 h-4 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            <button
              onClick={() => fetchUsers(currentPage, search, statusFilter, verificationFilter)}
              className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-900/30 border border-blue-700/50">
                <svg className="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Total Users</p>
                <p className="text-2xl font-bold text-white">{stats.total || 0}</p>
                {loadingAllUsers && !allUsersLoaded && (
                  <p className="text-xs text-blue-600 mt-1">Loading all users...</p>
                )}
                {allUsersLoaded && (
                  <p className="text-xs text-green-600 mt-1">✓ All {allUsers.length} users loaded</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-900/30 border border-green-700/50">
                <svg className="w-5 h-5 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Active Users</p>
                <p className="text-2xl font-bold text-white">{stats.active || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-red-900/30 border border-red-700/50">
                <svg className="w-5 h-5 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Inactive Users</p>
                <p className="text-2xl font-bold text-white">{stats.inactive || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-yellow-900/30 border border-yellow-700/50">
                <svg className="w-5 h-5 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Verified</p>
                <p className="text-2xl font-bold text-white">{stats.verified || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center space-x-4">
          {/* Search Input */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-600 bg-gray-800 text-white placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 font-medium"
              />
            </div>
          </div>

          {showFilters && (
            <>
              {/* Status Filter Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  className="relative w-48 border border-gray-600 bg-gray-800 text-white rounded-xl shadow-sm pl-3 pr-10 py-3 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                >
                  <span className="block truncate font-medium text-white">
                    {statusFilter ? 
                      statusFilter === 'active' ? 'Active Users' :
                      statusFilter === 'inactive' ? 'Inactive Users' : 'All Status'
                      : 'All Status'
                    }
                  </span>
                  <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${
                      showStatusDropdown ? 'rotate-180' : ''
                    } text-gray-400`} />
                  </span>
                </button>

                {showStatusDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowStatusDropdown(false)} />
                    <div className="absolute z-20 mt-1 w-full bg-gray-800 ring-gray-600 shadow-lg max-h-60 rounded-xl py-1 ring-1 ring-opacity-5 overflow-auto focus:outline-none">
                      {[
                        { value: '', label: 'All Status' },
                        { value: 'active', label: 'Active Users' },
                        { value: 'inactive', label: 'Inactive Users' }
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          className={`w-full text-left relative cursor-pointer select-none py-2 pl-3 pr-9 transition-colors ${
                            statusFilter === option.value 
                              ? 'bg-red-900/50 text-red-300 font-semibold'
                              : 'text-gray-300 font-medium hover:bg-gray-700 hover:text-white'
                          }`}
                          onClick={() => {
                            setStatusFilter(option.value);
                            setShowStatusDropdown(false);
                          }}
                        >
                          <span className="block truncate">{option.label}</span>
                          {statusFilter === option.value && (
                            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-red-600">
                              <CheckCircle className="h-4 w-4" />
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Verification Filter Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  className="relative w-48 border border-gray-600 bg-gray-800 text-white rounded-xl shadow-sm pl-3 pr-10 py-3 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  onClick={() => setShowVerificationDropdown(!showVerificationDropdown)}
                >
                  <span className="block truncate font-medium text-white">
                    {verificationFilter ? 
                      verificationFilter === 'verified' ? 'Verified Only' :
                      verificationFilter === 'unverified' ? 'Unverified Only' : 'All Verification'
                      : 'All Verification'
                    }
                  </span>
                  <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${
                      showVerificationDropdown ? 'rotate-180' : ''
                    } text-gray-400`} />
                  </span>
                </button>

                {showVerificationDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowVerificationDropdown(false)} />
                    <div className="absolute z-20 mt-1 w-full bg-gray-800 ring-gray-600 shadow-lg max-h-60 rounded-xl py-1 ring-1 ring-opacity-5 overflow-auto focus:outline-none">
                      {[
                        { value: '', label: 'All Verification' },
                        { value: 'verified', label: 'Verified Only' },
                        { value: 'unverified', label: 'Unverified Only' }
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          className={`w-full text-left relative cursor-pointer select-none py-2 pl-3 pr-9 transition-colors ${
                            verificationFilter === option.value 
                              ? 'bg-red-900/50 text-red-300 font-semibold'
                              : 'text-gray-300 font-medium hover:bg-gray-700 hover:text-white'
                          }`}
                          onClick={() => {
                            setVerificationFilter(option.value);
                            setShowVerificationDropdown(false);
                          }}
                        >
                          <span className="block truncate">{option.label}</span>
                          {verificationFilter === option.value && (
                            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-red-600">
                              <CheckCircle className="h-4 w-4" />
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Users Table */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-400">
                      {countryFilter ? `No users found from ${countryFilter}` : 'No users found'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-white">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-400">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">
                          {(() => {
                            const whatsappCountry = getCountryFromWhatsApp(user.whatsapp || user.phone);
                            return whatsappCountry ? (
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">{whatsappCountry.flag}</span>
                                <span className="font-medium">{whatsappCountry.country}</span>
                              </div>
                            ) : (
                              user.phone || 'No phone'
                            );
                          })()}
                        </div>
                        <div className="text-sm text-gray-400">
                          Phone: {user.whatsapp || user.phone || 'Not provided'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.isActive 
                              ? 'bg-green-900/50 text-green-300'
                              : 'bg-red-900/50 text-red-300'
                          }`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.emailVerified 
                              ? 'bg-blue-900/50 text-blue-300'
                              : 'bg-yellow-900/50 text-yellow-300'
                          }`}>
                            {user.emailVerified ? 'Verified' : 'Unverified'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          onClick={() => handleViewUser(user)}
                          className="flex items-center px-3 py-1 bg-blue-900/50 text-blue-300 hover:bg-blue-900/70 rounded-lg transition-colors mr-3"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-gray-800 border-t border-gray-700 px-4 py-3 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-300">
                  Showing {filteredUsers.length} of {users.length} users
                  {countryFilter && ` from ${countryFilter}`}
                  {pagination.totalCount && ` (${pagination.totalCount} total in database)`}
                </div>
                
                {/* Page Numbers Navigation */}
                <div className="flex items-center space-x-1">
                  {/* Previous Button */}
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={!pagination.hasPrev}
                    className="px-3 py-1 bg-black text-white border border-black rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
                  >
                    Previous
                  </button>
                  
                  {/* Page Numbers */}
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1 text-sm border rounded transition-colors ${
                            pageNum === pagination.currentPage
                              ? 'bg-red-600 text-white border-red-600'
                              : 'border-gray-600 text-gray-300 hover:bg-gray-700'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Next Button */}
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={!pagination.hasNext}
                    className="px-3 py-1 bg-black text-white border border-black rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Placeholder for Modals - These would be imported when components are created */}
        {/* <UserStatisticsPanel
          isOpen={showStatsPanel}
          onClose={handleCloseStatsPanel}
          users={allUsers}
          totalStats={stats}
          loading={loadingAllUsers}
          onRefresh={handleRefreshStats}
        />

        <BulkEmailModal
          isOpen={showBulkEmailModal}
          onClose={() => setShowBulkEmailModal(false)}
          emails={getTargetGroupEmails()}
          title="Bulk Message Users"
          subtitle={`Send messages to users (${allUsers.length} total users loaded)`}
          getEmailsByGroup={getTargetGroupEmails}
          getGroupCounts={getTargetGroupCounts}
          isDataLoaded={allUsersLoaded}
          isLoadingData={loadingAllUsers}
        />

        <UserDetailsPanel
          isOpen={showPanel}
          onClose={handleClosePanel}
          user={selectedUser}
        /> */}
      </div>
    </DashboardLayout>
  );
}
