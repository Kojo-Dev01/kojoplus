'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, ChevronDown, Eye, Mail, Phone, Calendar, User, CheckCircle, XCircle, Clock, AlertCircle, BookOpen, DollarSign, Star } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useTheme } from '../../../contexts/ThemeContext';
import { useRouter } from 'next/navigation';

export default function AcademyPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
    const [user, setUser] = useState(null);
  const [stats, setStats] = useState({});
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    month: '',
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLead, setSelectedLead] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const router = useRouter();
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);

  const { isDarkMode } = useTheme();

  const itemsPerPage = 20;

  useEffect(() => {
      const checkAuth = async () => {
        try {
          const response = await fetch('/api/auth/me');
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
            
            // Check if user has access to resources
            if (userData?.isAdministrator && !userData.tabAccess?.includes('academy')) {
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

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/academy-leads', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        
        // Format the leads data to include readable preferred date
        const formattedLeads = data.leads.map(lead => {
          // Create a formatted preferred date string
          const preferredDateFormatted = lead.preferredMonth && lead.preferredYear 
            ? `${lead.preferredMonth.charAt(0).toUpperCase() + lead.preferredMonth.slice(1)} ${lead.preferredYear}`
            : 'Not specified';
          
          // Create a filter-friendly date format (YYYY-MM)
          const monthNames = {
            'january': '01', 'february': '02', 'march': '03', 'april': '04',
            'may': '05', 'june': '06', 'july': '07', 'august': '08',
            'september': '09', 'october': '10', 'november': '11', 'december': '12'
          };
          
          const preferredDateFilter = lead.preferredMonth && lead.preferredYear && monthNames[lead.preferredMonth.toLowerCase()]
            ? `${lead.preferredYear}-${monthNames[lead.preferredMonth.toLowerCase()]}`
            : null;

          return {
            ...lead,
            preferredDateFormatted,
            preferredDateFilter
          };
        });
        
        setLeads(formattedLeads);
        setStats(data.stats);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch leads');
      }
    } catch (err) {
      setError('Failed to fetch leads');
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateLeadStatus = async (id, status) => {
    try {
      const response = await fetch(`/api/academy-leads/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        fetchLeads();
        if (selectedLead && selectedLead._id === id) {
          const data = await response.json();
          setSelectedLead(data.lead);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update lead');
      }
    } catch (err) {
      setError('Failed to update lead');
      console.error('Error updating lead:', err);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [filters]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.status, filters.category, filters.month, filters.search]);

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      reviewed: 'bg-blue-50 text-blue-700 border-blue-200',
      accepted: 'bg-green-50 text-green-700 border-green-200',
      rejected: 'bg-red-50 text-red-700 border-red-200',
      completed: 'bg-purple-50 text-purple-700 border-purple-200'
    };
    return colors[status] || colors.pending;
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock className="w-4 h-4" />,
      reviewed: <Eye className="w-4 h-4" />,
      accepted: <CheckCircle className="w-4 h-4" />,
      rejected: <XCircle className="w-4 h-4" />,
      completed: <Star className="w-4 h-4" />
    };
    return icons[status] || icons.pending;
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-50 text-yellow-700',
      paid: 'bg-green-50 text-green-700',
      refunded: 'bg-blue-50 text-blue-700',
      failed: 'bg-red-50 text-red-700'
    };
    return colors[status] || colors.pending;
  };

  const getCategoryColor = (category) => {
    const colors = {
      beginner: 'bg-green-100 text-green-800',
      advanced: 'bg-blue-100 text-blue-800',
      'prop-firm': 'bg-purple-100 text-purple-800'
    };
    return colors[category] || colors.beginner;
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

  const getCourseTitle = (category) => {
    const titles = {
      beginner: 'Beginner Forex Course',
      advanced: 'Advanced Strategy Course',
      'prop-firm': 'Prop Firm One-on-One'
    };
    return titles[category] || 'Unknown Course';
  };

  const formatPreferredTrainingPeriod = (month, year) => {
    if (!month || !year) return 'Not specified';
    return `${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`;
  };

  const getMonthName = (monthValue) => {
    if (!monthValue) return 'All Months';
    const [year, month] = monthValue.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const generateMonthOptions = () => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const currentYear = new Date().getFullYear();
    const years = [currentYear - 1, currentYear, currentYear + 1];
    
    const options = [{ value: '', label: 'All Months' }];
    
    years.forEach(year => {
      months.forEach((month, index) => {
        const monthValue = `${year}-${String(index + 1).padStart(2, '0')}`;
        options.push({
          value: monthValue,
          label: `${month} ${year}`
        });
      });
    });
    
    return options;
  };

  // Filter leads based on current filters
  const filteredLeads = leads.filter(lead => {
    // Status filter
    if (filters.status && lead.status !== filters.status) {
      return false;
    }

    // Category filter
    if (filters.category && lead.category !== filters.category) {
      return false;
    }

    // Month filter - using the new preferredDateFilter field
    if (filters.month && lead.preferredDateFilter !== filters.month) {
      return false;
    }

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const fullName = `${lead.firstName} ${lead.lastName}`.toLowerCase();
      const email = lead.email.toLowerCase();
      const phone = lead.phone || '';
      const category = lead.category.toLowerCase();
      
      if (!fullName.includes(searchTerm) && 
          !email.includes(searchTerm) && 
          !phone.includes(searchTerm) && 
          !category.includes(searchTerm)) {
        return false;
      }
    }

    return true;
  });

  // Calculate pagination
  const totalCount = filteredLeads.length;
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLeads = filteredLeads.slice(startIndex, endIndex);

  // Ensure current page is valid when data changes
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

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
            }`}>Academy Management</h1>
            <p className={`mt-1 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>Manage course applications and student leads</p>
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
              onClick={fetchLeads}
              className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          <div className={`rounded-2xl shadow-sm border p-6 transition-colors ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isDarkMode ? 'bg-blue-900/30 border border-blue-700/50' : 'bg-blue-100'
              }`}>
                <BookOpen className={`w-6 h-6 ${
                  isDarkMode ? 'text-blue-300' : 'text-blue-600'
                }`} />
              </div>
              <div className="ml-4">
                <div className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Total Applications</div>
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
                isDarkMode ? 'bg-green-900/30 border border-green-700/50' : 'bg-green-100'
              }`}>
                <CheckCircle className={`w-6 h-6 ${
                  isDarkMode ? 'text-green-300' : 'text-green-600'
                }`} />
              </div>
              <div className="ml-4">
                <div className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Accepted</div>
                <div className={`text-2xl font-bold ${
                  isDarkMode ? 'text-green-300' : 'text-green-600'
                }`}>{loading ? '...' : stats.accepted}</div>
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
                isDarkMode ? 'bg-purple-900/30 border border-purple-700/50' : 'bg-purple-100'
              }`}>
                <Star className={`w-6 h-6 ${
                  isDarkMode ? 'text-purple-300' : 'text-purple-600'
                }`} />
              </div>
              <div className="ml-4">
                <div className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Completed</div>
                <div className={`text-2xl font-bold ${
                  isDarkMode ? 'text-purple-300' : 'text-purple-600'
                }`}>{loading ? '...' : stats.completed}</div>
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
                <DollarSign className={`w-6 h-6 ${
                  isDarkMode ? 'text-green-300' : 'text-green-600'
                }`} />
              </div>
              <div className="ml-4">
                <div className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Paid</div>
                <div className={`text-2xl font-bold ${
                  isDarkMode ? 'text-green-300' : 'text-green-600'
                }`}>{loading ? '...' : stats.paid}</div>
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
                <span className={`font-bold text-lg ${
                  isDarkMode ? 'text-blue-300' : 'text-blue-600'
                }`}>$</span>
              </div>
              <div className="ml-4">
                <div className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Revenue</div>
                <div className={`text-2xl font-bold ${
                  isDarkMode ? 'text-white' : 'text-black'
                }`}>{loading ? '...' : `$${stats.revenue?.toLocaleString() || 0}`}</div>
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
                    placeholder="Search by name, email..."
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
                        filters.status.charAt(0).toUpperCase() + filters.status.slice(1) : 
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
                          { value: 'reviewed', label: 'Reviewed' },
                          { value: 'accepted', label: 'Accepted' },
                          { value: 'rejected', label: 'Rejected' },
                          { value: 'completed', label: 'Completed' }
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
              
              {/* Custom Category Dropdown */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>Course Category</label>
                <div className="relative">
                  <button
                    type="button"
                    className={`relative w-full border rounded-xl shadow-sm pl-3 pr-10 py-3 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  >
                    <span className={`block truncate font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {filters.category ? getCourseTitle(filters.category) : 'All Categories'}
                    </span>
                    <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${
                        showCategoryDropdown ? 'rotate-180' : ''
                      } ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                    </span>
                  </button>

                  {showCategoryDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowCategoryDropdown(false)} />
                      <div className={`absolute z-20 mt-1 w-full shadow-lg max-h-60 rounded-xl py-1 ring-1 ring-opacity-5 overflow-auto focus:outline-none transition-colors ${
                        isDarkMode 
                          ? 'bg-gray-800 ring-gray-600' 
                          : 'bg-white ring-black'
                      }`}>
                        {[
                          { value: '', label: 'All Categories' },
                          { value: 'beginner', label: 'Beginner Forex Course' },
                          { value: 'advanced', label: 'Advanced Strategy Course' },
                          { value: 'prop-firm', label: 'Prop Firm One-on-One' }
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            className={`w-full text-left relative cursor-pointer select-none py-2 pl-3 pr-9 transition-colors ${
                              filters.category === option.value 
                                ? isDarkMode
                                  ? 'bg-red-900/50 text-red-300 font-semibold'
                                  : 'bg-red-50 text-red-900 font-semibold'
                                : isDarkMode
                                  ? 'text-gray-300 font-medium hover:bg-gray-700 hover:text-white'
                                  : 'text-gray-900 font-medium hover:bg-red-50 hover:text-red-900'
                            }`}
                            onClick={() => {
                              setFilters(prev => ({ ...prev, category: option.value }));
                              setShowCategoryDropdown(false);
                            }}
                          >
                            <span className="block truncate">{option.label}</span>
                            {filters.category === option.value && (
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
              
              {/* Custom Month Dropdown */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>Month</label>
                <div className="relative">
                  <button
                    type="button"
                    className={`relative w-full border rounded-xl shadow-sm pl-3 pr-10 py-3 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    onClick={() => setShowMonthDropdown(!showMonthDropdown)}
                  >
                    <span className={`block truncate font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {getMonthName(filters.month)}
                    </span>
                    <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${
                        showMonthDropdown ? 'rotate-180' : ''
                      } ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                    </span>
                  </button>

                  {showMonthDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowMonthDropdown(false)} />
                      <div className={`absolute z-20 mt-1 w-full shadow-lg max-h-60 rounded-xl py-1 ring-1 ring-opacity-5 overflow-auto focus:outline-none transition-colors ${
                        isDarkMode 
                          ? 'bg-gray-800 ring-gray-600' 
                          : 'bg-white ring-black'
                      }`}>
                        {generateMonthOptions().map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            className={`w-full text-left relative cursor-pointer select-none py-2 pl-3 pr-9 transition-colors ${
                              filters.month === option.value 
                                ? isDarkMode
                                  ? 'bg-red-900/50 text-red-300 font-semibold'
                                  : 'bg-red-50 text-red-900 font-semibold'
                                : isDarkMode
                                  ? 'text-gray-300 font-medium hover:bg-gray-700 hover:text-white'
                                  : 'text-gray-900 font-medium hover:bg-red-50 hover:text-red-900'
                            }`}
                            onClick={() => {
                              setFilters(prev => ({ ...prev, month: option.value }));
                              setShowMonthDropdown(false);
                            }}
                          >
                            <span className="block truncate">{option.label}</span>
                            {filters.month === option.value && (
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

        {/* Academy Leads Table */}
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
                  <th className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>Student</th>
                  <th className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>Course Details</th>
                  <th className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>Status</th>
                  <th className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>Payment</th>
                  <th className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>Applied</th>
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
                    <td colSpan="8" className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : paginatedLeads.length === 0 ? (
                  <tr>
                    <td colSpan="8" className={`px-6 py-4 text-center ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      No academy leads found
                    </td>
                  </tr>
                ) : (
                  paginatedLeads.map((lead) => (
                    <tr key={lead._id} className={`transition-colors ${
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
                              {lead.firstName} {lead.lastName}
                            </div>
                            <div className={`text-sm flex items-center mt-1 ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              <Mail className="w-4 h-4 mr-1" />
                              {lead.email}
                            </div>
                            <div className={`text-sm flex items-center mt-1 ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              <Phone className="w-4 h-4 mr-1" />
                              {lead.phone}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`text-sm ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          <div className={`inline-block px-2 py-1 text-xs rounded-full mb-2 ${getCategoryColor(lead.category)}`}>
                            {getCourseTitle(lead.category)}
                          </div>
                          <div className={`text-xs ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            Preferred: {formatPreferredTrainingPeriod(lead.preferredMonth, lead.preferredYear)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(lead.status)}`}>
                          {getStatusIcon(lead.status)}
                          <span className="ml-1">{lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {lead.currency} {lead.price.toLocaleString()}
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${getPaymentStatusColor(lead.paymentStatus)}`}>
                          {lead.paymentStatus.charAt(0).toUpperCase() + lead.paymentStatus.slice(1)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          <div className="font-medium">
                            {lead.preferredDateFormatted}
                          </div>
                          <div className={`text-xs ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {lead.preferredSchedule?.replace('-', ' ') || 'Schedule not specified'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSelectedLead(lead)}
                            className={`flex items-center px-3 py-1 rounded-lg transition-colors ${
                              isDarkMode 
                                ? 'bg-blue-900/50 text-blue-300 hover:bg-blue-900/70' 
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            }`}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </button>
                          {lead.status === 'pending' && (
                            <button
                              onClick={() => updateLeadStatus(lead._id, 'reviewed')}
                              className={`flex items-center px-3 py-1 rounded-lg transition-colors ${
                                isDarkMode 
                                  ? 'bg-blue-900/50 text-blue-300 hover:bg-blue-900/70' 
                                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              }`}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Review
                            </button>
                          )}
                          {lead.status === 'reviewed' && (
                            <button
                              onClick={() => updateLeadStatus(lead._id, 'accepted')}
                              className={`flex items-center px-3 py-1 rounded-lg transition-colors ${
                                isDarkMode 
                                  ? 'bg-green-900/50 text-green-300 hover:bg-green-900/70' 
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Accept
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
          {totalPages > 1 && (
            <div className={`px-4 py-3 border-t sm:px-6 transition-colors ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className={`text-sm ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Showing {startIndex + 1} to {Math.min(endIndex, totalCount)} of {totalCount} academy leads
                </div>
                
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 bg-black text-white border border-black rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
                  >
                    Previous
                  </button>
                  
                  <div className="flex items-center space-x-1">
                    {currentPage > 3 && (
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
                        {currentPage > 4 && (
                          <span className={`px-2 py-1 text-sm ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>...</span>
                        )}
                      </>
                    )}
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(pageNum => {
                        return pageNum >= currentPage - 2 && pageNum <= currentPage + 2;
                      })
                      .map(pageNum => (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1 text-sm border rounded transition-colors ${
                            pageNum === currentPage
                              ? 'bg-red-600 text-white border-red-600'
                              : isDarkMode 
                                ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}
                    
                    {currentPage < totalPages - 2 && (
                      <>
                        {currentPage < totalPages - 3 && (
                          <span className={`px-2 py-1 text-sm ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>...</span>
                        )}
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          className={`px-3 py-1 text-sm border rounded transition-colors ${
                            isDarkMode 
                              ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
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
        {selectedLead && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={`rounded-2xl shadow-2xl border max-w-6xl w-full max-h-[90vh] overflow-y-auto transition-colors ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <h3 className={`text-xl font-semibold ${
                    isDarkMode ? 'text-white' : 'text-black'
                  }`}>Academy Application Details</h3>
                  <button
                    onClick={() => setSelectedLead(null)}
                    className={`transition-colors ${
                      isDarkMode 
                        ? 'text-gray-400 hover:text-gray-200' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column - Student Information */}
                  <div className="space-y-6">
                    {/* Personal Information */}
                    <div className={`rounded-lg p-5 ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                    }`}>
                      <h4 className={`text-lg font-medium mb-4 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>Personal Information</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={`text-sm font-medium ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>Name</label>
                          <p className={`font-medium ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>{selectedLead.firstName} {selectedLead.lastName}</p>
                        </div>
                        <div>
                          <label className={`text-sm font-medium ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>Reference</label>
                          <p className={`font-mono text-sm ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>ACA-{selectedLead._id.slice(-8).toUpperCase()}</p>
                        </div>
                        <div>
                          <label className={`text-sm font-medium ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>Email</label>
                          <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>{selectedLead.email}</p>
                        </div>
                        <div>
                          <label className={`text-sm font-medium ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>Phone</label>
                          <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>{selectedLead.phone}</p>
                        </div>
                      </div>
                    </div>

                    {/* Course Information */}
                    <div className={`rounded-lg p-5 ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                    }`}>
                      <h4 className={`text-lg font-medium mb-4 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>Course Information</h4>
                      <div className="space-y-4">
                        <div>
                          <label className={`text-sm font-medium ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>Course Category</label>
                          <div className={`inline-block px-3 py-1 text-sm rounded-full mt-1 ${getCategoryColor(selectedLead.category)}`}>
                            {getCourseTitle(selectedLead.category)}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className={`text-sm font-medium ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>Experience Level</label>
                            <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>{selectedLead.experienceLevel.replace('-', ' ')}</p>
                          </div>
                          <div>
                            <label className={`text-sm font-medium ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>Preferred Schedule</label>
                            <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>{selectedLead.preferredSchedule.replace('-', ' ')}</p>
                          </div>
                        </div>
                        <div>
                          <label className={`text-sm font-medium ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>Preferred Training Period</label>
                          <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>{formatPreferredTrainingPeriod(selectedLead.preferredMonth, selectedLead.preferredYear)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Payment Information */}
                    <div className={`rounded-lg p-5 ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                    }`}>
                      <h4 className={`text-lg font-medium mb-4 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>Payment Information</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={`text-sm font-medium ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>Course Price</label>
                          <p className={`font-semibold text-lg ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>{selectedLead.currency} {selectedLead.price.toLocaleString()}</p>
                        </div>
                        <div>
                          <label className={`text-sm font-medium ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>Payment Status</label>
                          <div className={`inline-block px-3 py-1 text-sm rounded-full mt-1 ${getPaymentStatusColor(selectedLead.paymentStatus)}`}>
                            {selectedLead.paymentStatus.charAt(0).toUpperCase() + selectedLead.paymentStatus.slice(1)}
                          </div>
                        </div>
                        {selectedLead.paymentMethod && (
                          <div>
                            <label className={`text-sm font-medium ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>Payment Method</label>
                            <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>{selectedLead.paymentMethod.replace('_', ' ')}</p>
                          </div>
                        )}
                        {selectedLead.paymentId && (
                          <div>
                            <label className={`text-sm font-medium ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>Payment ID</label>
                            <p className={`font-mono text-sm ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>{selectedLead.paymentId}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Application Details */}
                  <div className="space-y-6">
                    {/* Status Information */}
                    <div className={`rounded-lg p-5 ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                    }`}>
                      <h4 className={`text-lg font-medium mb-4 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>Application Status</h4>
                      <div className="space-y-4">
                        <div>
                          <label className={`text-sm font-medium ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>Current Status</label>
                          <div className={`inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full border mt-1 ${getStatusColor(selectedLead.status)}`}>
                            {getStatusIcon(selectedLead.status)}
                            <span className="ml-1">{selectedLead.status.charAt(0).toUpperCase() + selectedLead.status.slice(1)}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className={`text-sm font-medium ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>Applied</label>
                            <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>{formatDate(selectedLead.createdAt)}</p>
                          </div>
                          {selectedLead.scheduledStartDate && (
                            <div>
                              <label className={`text-sm font-medium ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-500'
                              }`}>Scheduled Start</label>
                              <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>{formatDate(selectedLead.scheduledStartDate)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Motivation & Goals */}
                    <div className={`rounded-lg p-5 ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                    }`}>
                      <h4 className={`text-lg font-medium mb-4 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>Motivation & Goals</h4>
                      <div className="space-y-4">
                        <div>
                          <label className={`text-sm font-medium ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>Motivation</label>
                          <p className={`mt-1 text-sm leading-relaxed ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>{selectedLead.motivation}</p>
                        </div>
                        <div>
                          <label className={`text-sm font-medium ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>Goals</label>
                          <p className={`mt-1 text-sm leading-relaxed ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>{selectedLead.goals}</p>
                        </div>
                      </div>
                    </div>

                    {/* Admin Notes */}
                    <div className={`rounded-lg p-5 ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                    }`}>
                      <h4 className={`text-lg font-medium mb-4 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>Admin Notes</h4>
                      <div>
                        <textarea
                          className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors ${
                            isDarkMode 
                              ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-600 placeholder-gray-500'
                          }`}
                          rows="4"
                          placeholder="Add admin notes..."
                          defaultValue={selectedLead.adminNotes}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className={`flex justify-between items-center mt-8 pt-6 border-t transition-colors ${
                  isDarkMode ? 'border-gray-700' : 'border-gray-200'
                }`}>
                  <button
                    onClick={() => setSelectedLead(null)}
                    className={`px-6 py-2 border rounded-xl transition-colors ${
                      isDarkMode 
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Close
                  </button>
                  <div className="flex space-x-3">
                    {selectedLead.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateLeadStatus(selectedLead._id, 'reviewed')}
                          className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                        >
                          Mark as Reviewed
                        </button>
                        <button
                          onClick={() => updateLeadStatus(selectedLead._id, 'rejected')}
                          className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                        >
                          Reject Application
                        </button>
                      </>
                    )}
                    {selectedLead.status === 'reviewed' && (
                      <>
                        <button
                          onClick={() => updateLeadStatus(selectedLead._id, 'accepted')}
                          className="px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                        >
                          Accept Application
                        </button>
                        <button
                          onClick={() => updateLeadStatus(selectedLead._id, 'rejected')}
                          className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                        >
                          Reject Application
                        </button>
                      </>
                    )}
                    {selectedLead.status === 'accepted' && (
                      <button
                        onClick={() => updateLeadStatus(selectedLead._id, 'completed')}
                        className="px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
                      >
                        Mark as Completed
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}