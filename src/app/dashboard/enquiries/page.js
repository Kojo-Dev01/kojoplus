'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, ChevronDown, Eye, Mail, Phone, MessageSquare, Calendar, User, CheckCircle, XCircle, Clock, AlertCircle, PlayCircle, Send } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'next/navigation';

export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    status: '',
    enquiryType: '',
    priority: '',
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [enquiryResponses, setEnquiryResponses] = useState([]);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);

  useEffect(() => {
      const checkAuth = async () => {
        try {
          const response = await fetch('/api/auth/me');
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
  
            // Check if user has access to forecasts
            if (userData?.isAdministrator && !userData.tabAccess?.includes('enquiries')) {
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

  const fetchEnquiries = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      params.append('page', currentPage);
      params.append('limit', 20);

      const response = await fetch(`/api/enquiries?${params}`, {
        credentials: 'include' // Use cookies for authentication
      });

      if (response.ok) {
        const data = await response.json();
        setEnquiries(data.enquiries);
        setStats(data.stats);
        setPagination(data.pagination);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch enquiries');
      }
    } catch (error) {
      if (error.message !== 'Authentication expired') {
        setError('Failed to fetch enquiries');
        console.error('Error fetching enquiries:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateEnquiryStatus = async (id, status) => {
    try {
      const response = await fetch(`/api/enquiries/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        fetchEnquiries();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update enquiry');
      }
    } catch (error) {
      if (error.message !== 'Authentication expired') {
        setError('Failed to update enquiry');
        console.error('Error updating enquiry:', error);
      }
    }
  };

  const submitResponse = async () => {
    if (!selectedEnquiry || !responseMessage.trim()) return;

    try {
      setSubmittingResponse(true);

      const response = await fetch(`/api/enquiries/${selectedEnquiry._id}/response`, {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ 
          message: responseMessage.trim(),
          status: 'resolved'
        })
      });

      if (response.ok) {
        setResponseMessage('');
        setShowResponseModal(false);
        fetchEnquiries();
        fetchEnquiryResponses(selectedEnquiry._id);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to submit response');
      }
    } catch (error) {
      if (error.message !== 'Authentication expired') {
        setError('Failed to submit response');
        console.error('Error submitting response:', error);
      }
    } finally {
      setSubmittingResponse(false);
    }
  };

  const fetchEnquiryResponses = async (enquiryId) => {
    try {
      const response = await fetch(`/api/enquiries/${enquiryId}/responses`, {
        credentials: 'include' // Use cookies for authentication
      });

      if (response.ok) {
        const data = await response.json();
        setEnquiryResponses(data.responses);
      }
    } catch (error) {
      if (error.message !== 'Authentication expired') {
        console.error('Error fetching enquiry responses:', error);
      }
    }
  };

  const handleViewEnquiry = (enquiry) => {
    setSelectedEnquiry(enquiry);
    fetchEnquiryResponses(enquiry._id);
  };

  useEffect(() => {
    fetchEnquiries();
  }, [filters, currentPage]);

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      'in-progress': 'bg-blue-50 text-blue-700 border-blue-200',
      resolved: 'bg-green-50 text-green-700 border-green-200',
      closed: 'bg-gray-50 text-gray-700 border-gray-200'
    };
    return colors[status] || colors.pending;
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock className="w-4 h-4" />,
      'in-progress': <PlayCircle className="w-4 h-4" />,
      resolved: <CheckCircle className="w-4 h-4" />,
      closed: <XCircle className="w-4 h-4" />
    };
    return icons[status] || icons.pending;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'text-gray-500',
      medium: 'text-blue-500',
      high: 'text-red-500'
    };
    return colors[priority] || colors.medium;
  };

  const getEnquiryTypeColor = (type) => {
    const colors = {
      'General Question': 'bg-blue-100 text-blue-800',
      'Technical Support': 'bg-red-100 text-red-800',
      'Billing Inquiry': 'bg-yellow-100 text-yellow-800',
      'Partnership': 'bg-purple-100 text-purple-800',
      'Course Information': 'bg-green-100 text-green-800',
      'Signal Service': 'bg-indigo-100 text-indigo-800',
      'Other': 'bg-gray-100 text-gray-800'
    };
    return colors[type] || colors.Other;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
              <AlertCircle className={`w-5 h-5 mr-2 ${
                isDarkMode ? 'text-red-400' : 'text-red-500'
              }`} />
              <p className={isDarkMode ? 'text-red-300' : 'text-red-700'}>{error}</p>
              <button 
                onClick={() => setError(null)}
                className={`ml-auto ${
                  isDarkMode 
                    ? 'text-red-400 hover:text-red-300' 
                    : 'text-red-500 hover:text-red-700'
                }`}
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className={`text-3xl font-bold ${
              isDarkMode ? 'text-white' : 'text-black'
            }`}>Customer Enquiries</h1>
            <p className={`mt-1 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>Manage customer questions and support requests</p>
          </div>
          <div className="flex space-x-3">
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
              onClick={fetchEnquiries}
              className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className={`rounded-2xl shadow-sm border p-6 transition-colors ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isDarkMode ? 'bg-blue-900/30 border border-blue-700/50' : 'bg-blue-100'
              }`}>
                <MessageSquare className={`w-6 h-6 ${
                  isDarkMode ? 'text-blue-300' : 'text-blue-600'
                }`} />
              </div>
              <div className="ml-4">
                <div className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Total Enquiries</div>
                <div className={`text-2xl font-bold ${
                  isDarkMode ? 'text-white' : 'text-black'
                }`}>{loading ? '...' : stats.total}</div>
              </div>
            </div>
          </div>
          
          <div className={`rounded-2xl shadow-sm border p-6 transition-colors ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isDarkMode ? 'bg-yellow-900/30 border border-yellow-700/50' : 'bg-yellow-100'
              }`}>
                <Clock className={`w-6 h-6 ${
                  isDarkMode ? 'text-yellow-300' : 'text-yellow-600'
                }`} />
              </div>
              <div className="ml-4">
                <div className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Pending</div>
                <div className={`text-2xl font-bold ${
                  isDarkMode ? 'text-yellow-300' : 'text-yellow-600'
                }`}>{loading ? '...' : stats.pending}</div>
              </div>
            </div>
          </div>
          
          <div className={`rounded-2xl shadow-sm border p-6 transition-colors ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isDarkMode ? 'bg-blue-900/30 border border-blue-700/50' : 'bg-blue-100'
              }`}>
                <PlayCircle className={`w-6 h-6 ${
                  isDarkMode ? 'text-blue-300' : 'text-blue-600'
                }`} />
              </div>
              <div className="ml-4">
                <div className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>In Progress</div>
                <div className={`text-2xl font-bold ${
                  isDarkMode ? 'text-blue-300' : 'text-blue-600'
                }`}>{loading ? '...' : stats['in-progress']}</div>
              </div>
            </div>
          </div>
          
          <div className={`rounded-2xl shadow-sm border p-6 transition-colors ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isDarkMode ? 'bg-green-900/30 border border-green-700/50' : 'bg-green-100'
              }`}>
                <CheckCircle className={`w-6 h-6 ${
                  isDarkMode ? 'text-green-300' : 'text-green-600'
                }`} />
              </div>
              <div className="ml-4">
                <div className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Resolved</div>
                <div className={`text-2xl font-bold ${
                  isDarkMode ? 'text-green-300' : 'text-green-600'
                }`}>{loading ? '...' : stats.resolved}</div>
              </div>
            </div>
          </div>
          
          <div className={`rounded-2xl shadow-sm border p-6 transition-colors ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isDarkMode ? 'bg-gray-700 border border-gray-600' : 'bg-gray-100'
              }`}>
                <XCircle className={`w-6 h-6 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`} />
              </div>
              <div className="ml-4">
                <div className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Closed</div>
                <div className={`text-2xl font-bold ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>{loading ? '...' : stats.closed}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className={`rounded-2xl shadow-sm border p-6 transition-colors ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Search Input */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>Search</label>
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-400'
                  }`} />
                  <input
                    type="text"
                    placeholder="Search by name, email, or subject..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 font-medium transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
              </div>
              
              {/* Custom Status Dropdown */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>Status</label>
                <div className="relative">
                  <button
                    type="button"
                    className={`relative w-full border rounded-xl shadow-sm pl-3 pr-10 py-3 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  >
                    <span className={`block truncate font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {filters.status ? 
                        filters.status.charAt(0).toUpperCase() + filters.status.slice(1).replace('-', ' ') : 
                        'All Status'
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
                          { value: 'pending', label: 'Pending' },
                          { value: 'in-progress', label: 'In Progress' },
                          { value: 'resolved', label: 'Resolved' },
                          { value: 'closed', label: 'Closed' }
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            className={`w-full text-left relative cursor-pointer select-none py-2 pl-3 pr-9 transition-colors ${
                              filters.status === option.value 
                                ? isDarkMode
                                  ? 'bg-red-900/50 text-red-300 font-semibold'
                                  : 'bg-red-50 text-red-900 font-semibold'
                                : isDarkMode
                                  ? 'text-gray-300 font-medium hover:bg-gray-700 hover:text-white'
                                  : 'text-gray-900 font-medium hover:bg-red-50 hover:text-red-900'
                            }`}
                            onClick={() => {
                              setFilters(prev => ({ ...prev, status: option.value }));
                              setShowStatusDropdown(false);
                            }}
                          >
                            <span className="block truncate">{option.label}</span>
                            {filters.status === option.value && (
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
              </div>
              
              {/* Custom Type Dropdown */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>Type</label>
                <div className="relative">
                  <button
                    type="button"
                    className={`relative w-full border rounded-xl shadow-sm pl-3 pr-10 py-3 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                  >
                    <span className={`block truncate font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {filters.enquiryType || 'All Types'}
                    </span>
                    <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${
                        showTypeDropdown ? 'rotate-180' : ''
                      } ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                    </span>
                  </button>

                  {showTypeDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowTypeDropdown(false)} />
                      <div className={`absolute z-20 mt-1 w-full shadow-lg max-h-60 rounded-xl py-1 ring-1 ring-opacity-5 overflow-auto focus:outline-none transition-colors ${
                        isDarkMode 
                          ? 'bg-gray-800 ring-gray-600' 
                          : 'bg-white ring-black'
                      }`}>
                        {[
                          { value: '', label: 'All Types' },
                          { value: 'General Question', label: 'General Question' },
                          { value: 'Technical Support', label: 'Technical Support' },
                          { value: 'Billing Inquiry', label: 'Billing Inquiry' },
                          { value: 'Partnership', label: 'Partnership' },
                          { value: 'Course Information', label: 'Course Information' },
                          { value: 'Signal Service', label: 'Signal Service' },
                          { value: 'Other', label: 'Other' }
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            className={`w-full text-left relative cursor-pointer select-none py-2 pl-3 pr-9 transition-colors ${
                              filters.enquiryType === option.value 
                                ? isDarkMode
                                  ? 'bg-red-900/50 text-red-300 font-semibold'
                                  : 'bg-red-50 text-red-900 font-semibold'
                                : isDarkMode
                                  ? 'text-gray-300 font-medium hover:bg-gray-700 hover:text-white'
                                  : 'text-gray-900 font-medium hover:bg-red-50 hover:text-red-900'
                            }`}
                            onClick={() => {
                              setFilters(prev => ({ ...prev, enquiryType: option.value }));
                              setShowTypeDropdown(false);
                            }}
                          >
                            <span className="block truncate">{option.label}</span>
                            {filters.enquiryType === option.value && (
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
              </div>
              
              {/* Custom Priority Dropdown */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>Priority</label>
                <div className="relative">
                  <button
                    type="button"
                    className={`relative w-full border rounded-xl shadow-sm pl-3 pr-10 py-3 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
                  >
                    <span className={`block truncate font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {filters.priority ? 
                        filters.priority.charAt(0).toUpperCase() + filters.priority.slice(1) : 
                        'All Priorities'
                      }
                    </span>
                    <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${
                        showPriorityDropdown ? 'rotate-180' : ''
                      } ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                    </span>
                  </button>

                  {showPriorityDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowPriorityDropdown(false)} />
                      <div className={`absolute z-20 mt-1 w-full shadow-lg max-h-60 rounded-xl py-1 ring-1 ring-opacity-5 overflow-auto focus:outline-none transition-colors ${
                        isDarkMode 
                          ? 'bg-gray-800 ring-gray-600' 
                          : 'bg-white ring-black'
                      }`}>
                        {[
                          { value: '', label: 'All Priorities' },
                          { value: 'low', label: 'Low' },
                          { value: 'medium', label: 'Medium' },
                          { value: 'high', label: 'High' }
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            className={`w-full text-left relative cursor-pointer select-none py-2 pl-3 pr-9 transition-colors ${
                              filters.priority === option.value 
                                ? isDarkMode
                                  ? 'bg-red-900/50 text-red-300 font-semibold'
                                  : 'bg-red-50 text-red-900 font-semibold'
                                : isDarkMode
                                  ? 'text-gray-300 font-medium hover:bg-gray-700 hover:text-white'
                                  : 'text-gray-900 font-medium hover:bg-red-50 hover:text-red-900'
                            }`}
                            onClick={() => {
                              setFilters(prev => ({ ...prev, priority: option.value }));
                              setShowPriorityDropdown(false);
                            }}
                          >
                            <span className="block truncate">{option.label}</span>
                            {filters.priority === option.value && (
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
              </div>
            </div>
          </div>
        )}

        {/* Enquiries Table */}
        <div className={`rounded-2xl shadow-sm border overflow-hidden transition-colors ${
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
                  <th className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>Customer</th>
                  <th className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>Enquiry Details</th>
                  <th className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>Status</th>
                  <th className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>Submitted</th>
                  <th className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${
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
                    <td colSpan="5" className="px-6 py-8 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : enquiries.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center">
                      <div className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                        <MessageSquare className={`w-12 h-12 mx-auto mb-4 ${
                          isDarkMode ? 'text-gray-500' : 'text-gray-300'
                        }`} />
                        <p className="text-lg font-medium">No enquiries found</p>
                        <p className="text-sm">Try adjusting your filters or check back later.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  enquiries.map((enquiry) => (
                    <tr key={enquiry._id} className={`transition-colors ${
                      isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                    }`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center">
                            <User className="w-6 h-6 text-white" />
                          </div>
                          <div className="ml-4">
                            <div className={`text-sm font-medium ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {enquiry.firstName} {enquiry.lastName}
                            </div>
                            <div className={`text-sm flex items-center mt-1 ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              <Mail className="w-4 h-4 mr-1" />
                              {enquiry.email}
                            </div>
                            {enquiry.phone && (
                              <div className={`text-sm flex items-center mt-1 ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                                <Phone className="w-4 h-4 mr-1" />
                                {enquiry.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`text-sm ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          <div className="font-medium mb-1">{enquiry.subject}</div>
                          <div className={`inline-block px-2 py-1 text-xs rounded-full mb-2 ${getEnquiryTypeColor(enquiry.enquiryType)}`}>
                            {enquiry.enquiryType}
                          </div>
                          <div className={`text-xs line-clamp-2 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {enquiry.message}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-2">
                          <div className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(enquiry.status)}`}>
                            {getStatusIcon(enquiry.status)}
                            <span className="ml-1">{enquiry.status.charAt(0).toUpperCase() + enquiry.status.slice(1).replace('-', ' ')}</span>
                          </div>
                          <div className={`text-xs font-medium ${getPriorityColor(enquiry.priority)}`}>
                            {enquiry.priority.charAt(0).toUpperCase() + enquiry.priority.slice(1)} Priority
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          <div className="flex items-center">
                            <Calendar className={`w-4 h-4 mr-2 ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-400'
                            }`} />
                            {formatDate(enquiry.createdAt)}
                          </div>
                          {enquiry.resolvedAt && (
                            <div className={`text-xs mt-1 ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              Resolved: {formatDate(enquiry.resolvedAt)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSelectedEnquiry(enquiry)}
                            className={`flex items-center px-3 py-1 rounded-lg transition-colors ${
                              isDarkMode 
                                ? 'bg-blue-900/50 text-blue-300 hover:bg-blue-900/70' 
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            }`}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </button>
                          {enquiry.status === 'pending' && (
                            <button
                              onClick={() => updateEnquiryStatus(enquiry._id, 'in-progress')}
                              className={`flex items-center px-3 py-1 rounded-lg transition-colors ${
                                isDarkMode 
                                  ? 'bg-blue-900/50 text-blue-300 hover:bg-blue-900/70' 
                                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              }`}
                            >
                              <PlayCircle className="w-4 h-4 mr-1" />
                              Start
                            </button>
                          )}
                          {enquiry.status === 'in-progress' && (
                            <button
                              onClick={() => updateEnquiryStatus(enquiry._id, 'resolved')}
                              className={`flex items-center px-3 py-1 rounded-lg transition-colors ${
                                isDarkMode 
                                  ? 'bg-green-900/50 text-green-300 hover:bg-green-900/70' 
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Resolve
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination?.totalPages > 1 && (
            <div className={`px-4 py-3 border-t sm:px-6 transition-colors ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className={`text-sm ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Showing page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalEnquiries} enquiries)
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={!pagination.hasPrev}
                    className="px-3 py-1 bg-black text-white border border-black rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
                  >
                    Previous
                  </button>
                  <div className="flex items-center space-x-1">
                    {pagination.currentPage > 3 && (
                      <>
                        <button
                          onClick={() => setCurrentPage(1)}
                          className={`px-3 py-1 text-sm border rounded transition-colors ${
                            isDarkMode 
                              ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          1
                        </button>
                        {pagination.currentPage > 4 && (
                          <span className={`px-2 py-1 text-sm ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>...</span>
                        )}
                      </>
                    )}
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                      .filter(pageNum => {
                        const current = pagination.currentPage;
                        return pageNum >= current - 2 && pageNum <= current + 2;
                      })
                      .map(pageNum => (
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
                      ))}
                    {pagination.currentPage < pagination.totalPages - 2 && (
                      <>
                        {pagination.currentPage < pagination.totalPages - 3 && (
                          <span className={`px-2 py-1 text-sm ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>...</span>
                        )}
                        <button
                          onClick={() => setCurrentPage(pagination.totalPages)}
                          className={`px-3 py-1 text-sm border rounded transition-colors ${
                            isDarkMode 
                              ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {pagination.totalPages}
                        </button>
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
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

        {/* Detail Modal */}
        {selectedEnquiry && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={`rounded-2xl shadow-2xl border max-w-4xl w-full max-h-[90vh] overflow-y-auto transition-colors ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <h3 className={`text-xl font-semibold ${
                    isDarkMode ? 'text-white' : 'text-black'
                  }`}>Enquiry Details</h3>
                  <button
                    onClick={() => {
                      setSelectedEnquiry(null);
                      setEnquiryResponses([]);
                    }}
                    className={`transition-colors ${
                      isDarkMode 
                        ? 'text-gray-400 hover:text-gray-200' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column - Enquiry Details */}
                  <div className="space-y-6">
                    {/* Customer Information */}
                    <div>
                      <h4 className={`text-lg font-medium mb-3 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>Customer Information</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={`text-sm font-medium ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>Name</label>
                          <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>{selectedEnquiry.firstName} {selectedEnquiry.lastName}</p>
                        </div>
                        <div>
                          <label className={`text-sm font-medium ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>Email</label>
                          <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>{selectedEnquiry.email}</p>
                        </div>
                        <div>
                          <label className={`text-sm font-medium ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>Phone</label>
                          <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>{selectedEnquiry.phone || 'Not provided'}</p>
                        </div>
                        <div>
                          <label className={`text-sm font-medium ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>Enquiry Type</label>
                          <p className={`inline-block px-2 py-1 text-xs rounded-full ${getEnquiryTypeColor(selectedEnquiry.enquiryType)}`}>
                            {selectedEnquiry.enquiryType}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Enquiry Details */}
                    <div>
                      <h4 className={`text-lg font-medium mb-3 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>Enquiry Details</h4>
                      <div className="space-y-4">
                        <div>
                          <label className={`text-sm font-medium ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>Subject</label>
                          <p className={`font-medium ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>{selectedEnquiry.subject}</p>
                        </div>
                        <div>
                          <label className={`text-sm font-medium ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>Message</label>
                          <p className={`mt-1 whitespace-pre-wrap p-4 rounded-lg ${
                            isDarkMode 
                              ? 'text-white bg-gray-700' 
                              : 'text-gray-900 bg-gray-50'
                          }`}>
                            {selectedEnquiry.message}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Status Information */}
                    <div>
                      <h4 className={`text-lg font-medium mb-3 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>Status Information</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={`text-sm font-medium ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>Current Status</label>
                          <div className={`inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full border mt-1 ${getStatusColor(selectedEnquiry.status)}`}>
                            {getStatusIcon(selectedEnquiry.status)}
                            <span className="ml-1">{selectedEnquiry.status.charAt(0).toUpperCase() + selectedEnquiry.status.slice(1).replace('-', ' ')}</span>
                          </div>
                        </div>
                        <div>
                          <label className={`text-sm font-medium ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>Priority</label>
                          <p className={`font-medium ${getPriorityColor(selectedEnquiry.priority)}`}>
                            {selectedEnquiry.priority.charAt(0).toUpperCase() + selectedEnquiry.priority.slice(1)}
                          </p>
                        </div>
                        <div>
                          <label className={`text-sm font-medium ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>Submitted</label>
                          <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>{formatDate(selectedEnquiry.createdAt)}</p>
                        </div>
                        {selectedEnquiry.resolvedAt && (
                          <div>
                            <label className={`text-sm font-medium ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>Resolved</label>
                            <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>{formatDate(selectedEnquiry.resolvedAt)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Responses */}
                  <div className="space-y-4">
                    <h4 className={`text-lg font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>Responses</h4>
                    <div className="max-h-96 overflow-y-auto space-y-4">
                      {enquiryResponses.length === 0 ? (
                        <p className={`text-sm ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>No responses yet</p>
                      ) : (
                        enquiryResponses.map((response) => (
                          <div key={response._id} className={`rounded-lg p-4 ${
                            isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                          }`}>
                            <div className="flex justify-between items-start mb-2">
                              <span className={`font-medium text-sm ${
                                isDarkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                {response.respondedBy}
                              </span>
                              <span className={`text-xs ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                                {new Date(response.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            <p className={`text-sm whitespace-pre-wrap ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {response.responseMessage}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className={`flex space-x-3 mt-6 pt-6 border-t transition-colors ${
                  isDarkMode ? 'border-gray-700' : 'border-gray-200'
                }`}>
                  <button
                    onClick={() => {
                      setSelectedEnquiry(null);
                      setEnquiryResponses([]);
                    }}
                    className={`flex-1 px-4 py-2 border rounded-xl transition-colors ${
                      isDarkMode 
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Close
                  </button>
                  {selectedEnquiry.status === 'pending' && (
                    <button
                      onClick={() => {
                        updateEnquiryStatus(selectedEnquiry._id, 'in-progress');
                      }}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                    >
                      Start Working
                    </button>
                  )}
                  {selectedEnquiry.status === 'in-progress' && (
                    <button
                      onClick={() => setShowResponseModal(true)}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                    >
                      Resolve with Response
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Response Modal */}
        {showResponseModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-60 flex items-center justify-center p-4">
            <div className={`rounded-2xl shadow-2xl border max-w-2xl w-full transition-colors ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <h3 className={`text-xl font-semibold ${
                    isDarkMode ? 'text-white' : 'text-black'
                  }`}>Respond to Enquiry</h3>
                  <button
                    onClick={() => {
                      setShowResponseModal(false);
                      setResponseMessage('');
                    }}
                    className={`transition-colors ${
                      isDarkMode 
                        ? 'text-gray-400 hover:text-gray-200' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Subject: {selectedEnquiry?.subject}
                    </label>
                    <div className={`text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Customer: {selectedEnquiry?.firstName} {selectedEnquiry?.lastName} ({selectedEnquiry?.email})
                    </div>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Your Response
                    </label>
                    <textarea
                      value={responseMessage}
                      onChange={(e) => setResponseMessage(e.target.value)}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none transition-colors ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                      rows="6"
                      placeholder="Type your response to resolve this enquiry..."
                    />
                    <div className={`text-xs mt-1 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {responseMessage.length}/2000 characters
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowResponseModal(false);
                      setResponseMessage('');
                    }}
                    className={`flex-1 px-4 py-2 border rounded-xl transition-colors ${
                      isDarkMode 
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                    disabled={submittingResponse}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitResponse}
                    disabled={submittingResponse || !responseMessage.trim()}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {submittingResponse ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Response & Resolve</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
