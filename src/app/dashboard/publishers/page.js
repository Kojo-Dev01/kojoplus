'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, ChevronDown, Eye, Send, BarChart3,User , CheckCircle, XCircle, Shield, Users, TrendingUp, Heart, MessageSquare, Eye as ViewIcon, Star } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import PublisherDetailsPanel from '@/components/publishers/PublisherDetailsPanel';
import BulkEmailModal from '@/components/common/BulkEmailModal';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'next/navigation';

export default function PublishersPage() {
  const [publishers, setPublishers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
    const [user, setUser] = useState(null);
    const router = useRouter();
  const [pagination, setPagination] = useState({});
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPublisher, setSelectedPublisher] = useState(null);
  const [showPanel, setShowPanel] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showVerificationDropdown, setShowVerificationDropdown] = useState(false);
  const [showBulkEmailModal, setShowBulkEmailModal] = useState(false);
  const [error, setError] = useState(null);
  
  // Separate state for all publishers (for bulk operations)
  const [allPublishers, setAllPublishers] = useState([]);
  const [loadingAllPublishers, setLoadingAllPublishers] = useState(false);
  const [allPublishersLoaded, setAllPublishersLoaded] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          
          // Check if user has access to resources
          if (userData?.isAdministrator && !userData.tabAccess?.includes('publishers')) {
            setAccessDenied(true);
          }
        } else {
          router.replace('/auth/plus-code');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.replace('/auth/plus-code');
      }
    };

    checkAuth();
  }, [router]);

  const { isDarkMode } = useTheme();

  // Fetch paginated publishers for table display
  const fetchPublishers = async (page = 1, searchQuery = '', status = '', verified = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        search: searchQuery,
        ...(status && { status }),
        ...(verified && { verified })
      });

      const response = await fetch(`/api/publishers?${params}`, {
        credentials: 'include' // Use cookies for authentication
      });

      if (response.ok) {
        const data = await response.json();
        setPublishers(data.publishers);
        setStats(data.stats);
        setPagination(data.pagination);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch publishers');
      }
    } catch (error) {
      if (error.message !== 'Authentication expired') {
        setError('Failed to fetch publishers');
        console.error('Error fetching publishers:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch all publishers for bulk operations (background)
  const fetchAllPublishers = async () => {
    if (loadingAllPublishers || allPublishersLoaded) return;
    
    try {
      setLoadingAllPublishers(true);
      
      console.log('Fetching all publishers in background...');
      
      const response = await fetch('/api/publishers?all=true', {
        credentials: 'include' // Use cookies for authentication
      });

      if (response.ok) {
        const data = await response.json();
        setAllPublishers(data.publishers || []);
        setAllPublishersLoaded(true);
        console.log(`Loaded ${data.publishers?.length || 0} publishers for bulk operations`);
        return data.publishers || [];
      } else {
        console.error('Failed to fetch all publishers');
        return [];
      }
    } catch (error) {
      if (error.message !== 'Authentication expired') {
        console.error('Error fetching all publishers:', error);
      }
      return [];
    } finally {
      setLoadingAllPublishers(false);
    }
  };

  // Load paginated publishers on filter changes
  useEffect(() => {
    fetchPublishers(currentPage, search, statusFilter, verificationFilter);
  }, [currentPage, search, statusFilter, verificationFilter]);

  // Load all publishers in background on component mount
  useEffect(() => {
    fetchAllPublishers();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleViewPublisher = (publisher) => {
    setSelectedPublisher(publisher);
    setShowPanel(true);
  };

  const handleClosePanel = () => {
    setShowPanel(false);
    setSelectedPublisher(null);
  };

  // Get all publisher emails for bulk messaging
  const getTargetGroupEmails = (targetGroup = 'all') => {
    if (allPublishers.length === 0) {
      return [];
    }

    let filteredPublishers = allPublishers.filter(pub => pub.userId && pub.userId.email);

    switch (targetGroup) {
      case 'active':
        filteredPublishers = filteredPublishers.filter(pub => pub.isActive);
        break;
      case 'inactive':
        filteredPublishers = filteredPublishers.filter(pub => !pub.isActive);
        break;
      case 'verified':
        filteredPublishers = filteredPublishers.filter(pub => pub.isVerified);
        break;
      case 'unverified':
        filteredPublishers = filteredPublishers.filter(pub => !pub.isVerified);
        break;
      case 'high-performers':
        filteredPublishers = filteredPublishers.filter(pub => 
          pub.stats.totalForecasts >= 5 && pub.stats.totalViews >= 100
        );
        break;
      case 'all':
      default:
        break;
    }

    return filteredPublishers.map(pub => pub.userId.email).filter(email => email);
  };

  // Get count for each target group
  const getTargetGroupCounts = () => {
    if (allPublishers.length === 0) {
      return {
        all: 0,
        active: 0,
        inactive: 0,
        verified: 0,
        unverified: 0,
        'high-performers': 0
      };
    }

    const publishersWithEmails = allPublishers.filter(pub => pub.userId && pub.userId.email);

    return {
      all: publishersWithEmails.length,
      active: publishersWithEmails.filter(pub => pub.isActive).length,
      inactive: publishersWithEmails.filter(pub => !pub.isActive).length,
      verified: publishersWithEmails.filter(pub => pub.isVerified).length,
      unverified: publishersWithEmails.filter(pub => !pub.isVerified).length,
      'high-performers': publishersWithEmails.filter(pub => 
        pub.stats.totalForecasts >= 5 && pub.stats.totalViews >= 100
      ).length
    };
  };

  // Handle opening bulk email modal
  const handleOpenBulkEmailModal = async () => {
    if (!allPublishersLoaded && allPublishers.length === 0) {
      await fetchAllPublishers();
    }
    setShowBulkEmailModal(true);
  };

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Error Display */}
        {error && (
          <div className={`border rounded-xl p-4 ${
            isDarkMode 
              ? 'bg-red-900/20 border-red-800' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center">
              <svg className={`w-5 h-5 mr-2 ${
                isDarkMode ? 'text-red-400' : 'text-red-500'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className={isDarkMode ? 'text-red-300' : 'text-red-700'}>{error}</p>
              <button 
                onClick={() => setError(null)}
                className={`ml-auto ${
                  isDarkMode 
                    ? 'text-red-400 hover:text-red-300' 
                    : 'text-red-500 hover:text-red-700'
                }`}
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
            <h1 className={`text-3xl font-bold ${
              isDarkMode ? 'text-white' : 'text-black'
            }`}>Publishers Management</h1>
            <p className={`mt-1 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>Manage forecast publishers and content creators</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleOpenBulkEmailModal}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors relative"
              disabled={loadingAllPublishers && !allPublishersLoaded}
            >
              {loadingAllPublishers && !allPublishersLoaded ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Bulk Message</span>
                  {allPublishersLoaded && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-2 h-2 text-white" />
                    </div>
                  )}
                </>
              )}
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-4 py-2 border rounded-xl transition-colors ${
                isDarkMode 
                  ? 'text-gray-300 border-gray-600 hover:bg-gray-700' 
                  : 'text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              <ChevronDown className={`w-4 h-4 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            <button
              onClick={() => fetchPublishers(currentPage, search, statusFilter, verificationFilter)}
              className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          <div className={`rounded-xl shadow-sm border p-6 transition-colors ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isDarkMode ? 'bg-purple-900/30 border border-purple-700/50' : 'bg-purple-100'
              }`}>
                <Users className={`w-5 h-5 ${
                  isDarkMode ? 'text-purple-300' : 'text-purple-600'
                }`} />
              </div>
              <div className="ml-4">
                <p className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Total Publishers</p>
                <p className={`text-2xl font-bold ${
                  isDarkMode ? 'text-white' : 'text-black'
                }`}>{stats.total || 0}</p>
                {loadingAllPublishers && !allPublishersLoaded && (
                  <p className="text-xs text-blue-600 mt-1">Loading all publishers...</p>
                )}
                {allPublishersLoaded && (
                  <p className="text-xs text-green-600 mt-1">✓ All {allPublishers.length} publishers loaded</p>
                )}
              </div>
            </div>
          </div>

          <div className={`rounded-xl shadow-sm border p-6 transition-colors ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isDarkMode ? 'bg-green-900/30 border border-green-700/50' : 'bg-green-100'
              }`}>
                <CheckCircle className={`w-5 h-5 ${
                  isDarkMode ? 'text-green-300' : 'text-green-600'
                }`} />
              </div>
              <div className="ml-4">
                <p className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Active</p>
                <p className={`text-2xl font-bold ${
                  isDarkMode ? 'text-white' : 'text-black'
                }`}>{stats.active || 0}</p>
              </div>
            </div>
          </div>

          <div className={`rounded-xl shadow-sm border p-6 transition-colors ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isDarkMode ? 'bg-blue-900/30 border border-blue-700/50' : 'bg-blue-100'
              }`}>
                <Shield className={`w-5 h-5 ${
                  isDarkMode ? 'text-blue-300' : 'text-blue-600'
                }`} />
              </div>
              <div className="ml-4">
                <p className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Verified</p>
                <p className={`text-2xl font-bold ${
                  isDarkMode ? 'text-white' : 'text-black'
                }`}>{stats.verified || 0}</p>
              </div>
            </div>
          </div>

          <div className={`rounded-xl shadow-sm border p-6 transition-colors ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isDarkMode ? 'bg-indigo-900/30 border border-indigo-700/50' : 'bg-indigo-100'
              }`}>
                <TrendingUp className={`w-5 h-5 ${
                  isDarkMode ? 'text-indigo-300' : 'text-indigo-600'
                }`} />
              </div>
              <div className="ml-4">
                <p className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Total Forecasts</p>
                <p className={`text-2xl font-bold ${
                  isDarkMode ? 'text-white' : 'text-black'
                }`}>{stats.totalForecasts || 0}</p>
              </div>
            </div>
          </div>

          <div className={`rounded-xl shadow-sm border p-6 transition-colors ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isDarkMode ? 'bg-orange-900/30 border border-orange-700/50' : 'bg-orange-100'
              }`}>
                <ViewIcon className={`w-5 h-5 ${
                  isDarkMode ? 'text-orange-300' : 'text-orange-600'
                }`} />
              </div>
              <div className="ml-4">
                <p className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Total Views</p>
                <p className={`text-2xl font-bold ${
                  isDarkMode ? 'text-white' : 'text-black'
                }`}>{stats.totalViews || 0}</p>
              </div>
            </div>
          </div>

          <div className={`rounded-xl shadow-sm border p-6 transition-colors ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isDarkMode ? 'bg-pink-900/30 border border-pink-700/50' : 'bg-pink-100'
              }`}>
                <Heart className={`w-5 h-5 ${
                  isDarkMode ? 'text-pink-300' : 'text-pink-600'
                }`} />
              </div>
              <div className="ml-4">
                <p className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Total Likes</p>
                <p className={`text-2xl font-bold ${
                  isDarkMode ? 'text-white' : 'text-black'
                }`}>{stats.totalLikes || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center space-x-4">
          {/* Search Input */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-400'
              }`} />
              <input
                type="text"
                placeholder="Search by nickname, display name, or bio..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 font-medium transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>
          </div>

          {showFilters && (
            <>
              {/* Status Filter Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  className={`relative w-48 border rounded-xl shadow-sm pl-3 pr-10 py-3 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                >
                  <span className={`block truncate font-medium ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {statusFilter ? 
                      statusFilter === 'active' ? 'Active Publishers' :
                      statusFilter === 'inactive' ? 'Inactive Publishers' : 'All Status'
                      : 'All Status'
                    }
                  </span>
                  <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${
                      showStatusDropdown ? 'rotate-180' : ''
                    } ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                  </span>
                </button>

                {showStatusDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowStatusDropdown(false)} />
                    <div className={`absolute z-20 mt-1 w-full shadow-lg max-h-60 rounded-xl py-1 ring-1 ring-opacity-5 overflow-auto focus:outline-none transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-800 ring-gray-600' 
                        : 'bg-white ring-black'
                    }`}>
                      {[
                        { value: '', label: 'All Status' },
                        { value: 'active', label: 'Active Publishers' },
                        { value: 'inactive', label: 'Inactive Publishers' }
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          className={`w-full text-left relative cursor-pointer select-none py-2 pl-3 pr-9 transition-colors ${
                            statusFilter === option.value 
                              ? isDarkMode
                                ? 'bg-red-900/50 text-red-300 font-semibold'
                                : 'bg-red-50 text-red-900 font-semibold'
                              : isDarkMode
                                ? 'text-gray-300 font-medium hover:bg-gray-700 hover:text-white'
                                : 'text-gray-900 font-medium hover:bg-red-50 hover:text-red-900'
                          }`}
                          onClick={() => {
                            setStatusFilter(option.value);
                            setShowStatusDropdown(false);
                          }}
                        >
                          <span className="block truncate">{option.label}</span>
                          {statusFilter === option.value && (
                            <span className={`absolute inset-y-0 right-0 flex items-center pr-3 ${
                              isDarkMode ? 'text-red-400' : 'text-red-600'
                            }`}>
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
                  className={`relative w-48 border rounded-xl shadow-sm pl-3 pr-10 py-3 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  onClick={() => setShowVerificationDropdown(!showVerificationDropdown)}
                >
                  <span className={`block truncate font-medium ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {verificationFilter ? 
                      verificationFilter === 'verified' ? 'Verified Only' :
                      verificationFilter === 'unverified' ? 'Unverified Only' : 'All Verification'
                      : 'All Verification'
                    }
                  </span>
                  <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${
                      showVerificationDropdown ? 'rotate-180' : ''
                    } ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                  </span>
                </button>

                {showVerificationDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowVerificationDropdown(false)} />
                    <div className={`absolute z-20 mt-1 w-full shadow-lg max-h-60 rounded-xl py-1 ring-1 ring-opacity-5 overflow-auto focus:outline-none transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-800 ring-gray-600' 
                        : 'bg-white ring-black'
                    }`}>
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
                              ? isDarkMode
                                ? 'bg-red-900/50 text-red-300 font-semibold'
                                : 'bg-red-50 text-red-900 font-semibold'
                              : isDarkMode
                                ? 'text-gray-300 font-medium hover:bg-gray-700 hover:text-white'
                                : 'text-gray-900 font-medium hover:bg-red-50 hover:text-red-900'
                          }`}
                          onClick={() => {
                            setVerificationFilter(option.value);
                            setShowVerificationDropdown(false);
                          }}
                        >
                          <span className="block truncate">{option.label}</span>
                          {verificationFilter === option.value && (
                            <span className={`absolute inset-y-0 right-0 flex items-center pr-3 ${
                              isDarkMode ? 'text-red-400' : 'text-red-600'
                            }`}>
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

        {/* Publishers Table */}
        <div className={`rounded-xl shadow-sm border overflow-hidden transition-colors ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="overflow-x-auto">
            <table className={`min-w-full divide-y ${
              isDarkMode ? 'divide-gray-700' : 'divide-gray-200'
            }`}>
              <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>Publisher</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>User Account</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>Performance</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>Status</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>Created</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y transition-colors ${
                isDarkMode 
                  ? 'bg-gray-800 divide-gray-700' 
                  : 'bg-white divide-gray-200'
              }`}>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : publishers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className={`px-6 py-4 text-center ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      No publishers found
                    </td>
                  </tr>
                ) : (
                  publishers.map((publisher) => (
                    <tr key={publisher._id} className={`transition-colors ${
                      isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                    }`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="relative">
                            {publisher.avatar ? (
                              <img
                                src={publisher.avatar}
                                alt={publisher.displayName}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                                <User className="w-6 h-6 text-white" />
                              </div>
                            )}
                            {publisher.isVerified && (
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className={`text-sm font-medium flex items-center ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {publisher.displayName}
                              {publisher.isVerified && <Shield className="w-4 h-4 text-blue-500 ml-1" />}
                            </div>
                            <div className="text-sm text-purple-600">@{publisher.nickname}</div>
                            <div className={`text-xs ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>{publisher.followerCount || 0} followers</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {publisher.userId ? (
                          <div>
                            <div className={`text-sm font-medium ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {publisher.userId.firstName} {publisher.userId.lastName}
                            </div>
                            <div className={`text-sm ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>{publisher.userId.email}</div>
                            {publisher.userId.phone && (
                              <div className={`text-sm ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-500'
                              }`}>{publisher.userId.phone}</div>
                            )}
                          </div>
                        ) : (
                          <div className={`text-sm ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>No user account</div>
                        )}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center space-x-1">
                            <TrendingUp className="w-3 h-3 text-indigo-500" />
                            <span>{publisher.stats.totalForecasts || 0} forecasts</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <ViewIcon className="w-3 h-3 text-orange-500" />
                            <span>{publisher.stats.totalViews || 0} views</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Heart className="w-3 h-3 text-pink-500" />
                            <span>{publisher.stats.totalLikes || 0} likes</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MessageSquare className="w-3 h-3 text-indigo-500" />
                            <span>{publisher.stats.totalComments || 0} comments</span>
                          </div>
                        </div>
                        <div className={`text-xs mt-1 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          Engagement: {publisher.stats.totalViews > 0 ? 
                            ((publisher.stats.totalLikes + publisher.stats.totalComments) / publisher.stats.totalViews * 100).toFixed(1) 
                            : 0}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            publisher.isActive 
                              ? isDarkMode
                                ? 'bg-green-900/50 text-green-300'
                                : 'bg-green-100 text-green-800'
                              : isDarkMode
                                ? 'bg-red-900/50 text-red-300'
                                : 'bg-red-100 text-red-800'
                          }`}>
                            {publisher.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            publisher.isVerified 
                              ? isDarkMode
                                ? 'bg-blue-900/50 text-blue-300'
                                : 'bg-blue-100 text-blue-800'
                              : isDarkMode
                                ? 'bg-gray-900/50 text-gray-300'
                                : 'bg-gray-100 text-gray-800'
                          }`}>
                            {publisher.isVerified ? 'Verified' : 'Unverified'}
                          </span>
                        </div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {formatDate(publisher.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          onClick={() => handleViewPublisher(publisher)}
                          className={`flex items-center px-3 py-1 rounded-lg transition-colors mr-3 ${
                            isDarkMode 
                              ? 'bg-blue-900/50 text-blue-300 hover:bg-blue-900/70' 
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          }`}
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
            <div className={`px-4 py-3 border-t sm:px-6 transition-colors ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className={`text-sm ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Showing page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalCount} publishers)
                </div>
                
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={!pagination.hasPrev}
                    className="px-3 py-1 bg-black text-white border border-black rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
                  >
                    Previous
                  </button>
                  
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
                              : isDarkMode 
                                ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
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

        {/* Enhanced Bulk Email Modal */}
        <BulkEmailModal
          isOpen={showBulkEmailModal}
          onClose={() => setShowBulkEmailModal(false)}
          emails={getTargetGroupEmails()}
          title="Bulk Message Publishers"
          subtitle={`Send messages to publishers (${allPublishers.length} total publishers loaded)`}
          getEmailsByGroup={getTargetGroupEmails}
          getGroupCounts={getTargetGroupCounts}
          isDataLoaded={allPublishersLoaded}
          isLoadingData={loadingAllPublishers}
        />

        {/* Publisher Details Panel */}
        <PublisherDetailsPanel
          isOpen={showPanel}
          onClose={handleClosePanel}
          publisher={selectedPublisher}
        />
      </div>
    </DashboardLayout>
  );
}
