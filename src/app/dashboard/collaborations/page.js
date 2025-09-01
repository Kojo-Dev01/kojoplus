'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, ChevronDown, Eye, Mail, Phone, Globe, Building, Calendar, User, CheckCircle, XCircle, Clock, AlertCircle, FilterX, RefreshCw } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useTheme } from '@/contexts/ThemeContext';

export default function CollaborationsPage() {
  const [collaborations, setCollaborations] = useState([]);
  const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});
      const router = useRouter();
  const [filters, setFilters] = useState({
    status: '',
    collaborationType: '',
    priority: '',
    search: ''
  });
  const [selectedCollaboration, setSelectedCollaboration] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const { isDarkMode } = useTheme();

  useEffect(() => {
      const checkAuth = async () => {
        try {
          const response = await fetch('/api/auth/me');
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
            
            // Check if user has access to resources
            if (userData?.isAdministrator && !userData.tabAccess?.includes('collaborations')) {
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

  const fetchCollaborations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await fetch(`/api/collaborations?${params}`, {
        credentials: 'include' // Use cookies for authentication
      });

      if (response.ok) {
        const data = await response.json();
        setCollaborations(data.collaborations.map(collab => ({
          ...collab,
          createdAt: new Date(collab.createdAt),
          reviewedAt: collab.reviewedAt ? new Date(collab.reviewedAt) : null
        })));
        setStats(data.stats);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch collaborations');
      }
    } catch (err) {
      if (err.message !== 'Authentication expired') {
        setError('Failed to fetch collaborations');
        console.error('Error fetching collaborations:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateCollaborationStatus = async (id, status) => {
    try {
      const response = await fetch(`/api/collaborations/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        fetchCollaborations();
        if (selectedCollaboration && selectedCollaboration._id === id) {
          const data = await response.json();
          setSelectedCollaboration(data.collaboration);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update collaboration');
      }
    } catch (err) {
      if (err.message !== 'Authentication expired') {
        setError('Failed to update collaboration');
        console.error('Error updating collaboration:', err);
      }
    }
  };

  useEffect(() => {
    fetchCollaborations();
  }, [filters]);

  const clearAllFilters = () => {
    setFilters({
      status: '',
      collaborationType: '',
      priority: '',
      search: ''
    });
  };

  const hasActiveFilters = () => {
    return Object.values(filters).some(filter => filter !== '');
  };

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
      completed: <CheckCircle className="w-4 h-4" />
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

  const getStatusBadgeColor = (status) => {
    const colors = {
      pending: 'bg-amber-100 text-amber-800 hover:bg-amber-200',
      reviewed: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
      accepted: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200',
      rejected: 'bg-red-100 text-red-800 hover:bg-red-200'
    };
    return colors[status] || colors.pending;
  };

  const getPriorityBadgeColor = (priority) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
      medium: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
      high: 'bg-red-100 text-red-800 hover:bg-red-200'
    };
    return colors[priority] || colors.medium;
  };

  const getTypeBadgeColor = (type) => {
    const colors = {
      'Sponsored Content': 'bg-purple-100 text-purple-800 hover:bg-purple-200',
      'Product Review': 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200',
      'Brand Partnership': 'bg-pink-100 text-pink-800 hover:bg-pink-200',
      'Affiliate Program': 'bg-green-100 text-green-800 hover:bg-green-200',
      'Event Collaboration': 'bg-orange-100 text-orange-800 hover:bg-orange-200',
      'Long-term Partnership': 'bg-teal-100 text-teal-800 hover:bg-teal-200',
      'Other': 'bg-gray-100 text-gray-800 hover:bg-gray-200'
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
            }`}>Collaboration Requests</h1>
            <p className={`mt-1 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>Manage partnership and collaboration inquiries</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                showFilters 
                  ? 'bg-red-600 text-white shadow-lg' 
                  : isDarkMode
                    ? 'border border-gray-600 hover:bg-gray-700 text-gray-300'
                    : 'border border-gray-300 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              {hasActiveFilters() && (
                <span className="bg-white text-red-600 text-xs px-2 py-0.5 rounded-full font-medium">
                  {Object.values(filters).filter(f => f !== '').length}
                </span>
              )}
            </button>
            <button
              onClick={fetchCollaborations}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Compact Filter Pills */}
        {showFilters && (
          <div className={`rounded-xl shadow-sm border p-4 transition-colors ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-red-600" />
                <span className={`font-medium ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Quick Filters</span>
              </div>
              {hasActiveFilters() && (
                <button
                  onClick={clearAllFilters}
                  className={`flex items-center space-x-1 px-2 py-1 rounded-lg transition-colors text-sm ${
                    isDarkMode 
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <FilterX className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            <div className="space-y-3">
              {/* Status Pills */}
              <div>
                <label className={`block text-xs font-medium mb-2 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Status</label>
                <div className="flex flex-wrap gap-2">
                  {['pending', 'reviewed', 'accepted', 'rejected'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setFilters(prev => ({ 
                        ...prev, 
                        status: prev.status === status ? '' : status 
                      }))}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                        filters.status === status
                          ? 'bg-red-100 text-red-700 border-red-300'
                          : isDarkMode
                            ? 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {getStatusIcon(status)}
                      <span className="ml-1 capitalize">{status}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Type Pills */}
              <div>
                <label className={`block text-xs font-medium mb-2 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Collaboration Type</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Sponsored Content',
                    'Product Review', 
                    'Brand Partnership',
                    'Affiliate Program',
                    'Event Collaboration',
                    'Long-term Partnership',
                    'Other'
                  ].map((type) => (
                    <button
                      key={type}
                      onClick={() => setFilters(prev => ({ 
                        ...prev, 
                        collaborationType: prev.collaborationType === type ? '' : type 
                      }))}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                        filters.collaborationType === type
                          ? 'bg-red-100 text-red-700 border-red-300'
                          : isDarkMode
                            ? 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority Pills */}
              <div>
                <label className={`block text-xs font-medium mb-2 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Priority</label>
                <div className="flex flex-wrap gap-2">
                  {['low', 'medium', 'high'].map((priority) => (
                    <button
                      key={priority}
                      onClick={() => setFilters(prev => ({ 
                        ...prev, 
                        priority: prev.priority === priority ? '' : priority 
                      }))}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                        filters.priority === priority
                          ? 'bg-red-100 text-red-700 border-red-300'
                          : isDarkMode
                            ? 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <div className={`inline-block w-2 h-2 rounded-full mr-1 ${
                        priority === 'high' ? 'bg-red-400' :
                        priority === 'medium' ? 'bg-blue-400' : 'bg-gray-400'
                      }`}></div>
                      <span className="capitalize">{priority}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

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
                <Building className={`w-6 h-6 ${
                  isDarkMode ? 'text-blue-300' : 'text-blue-600'
                }`} />
              </div>
              <div className="ml-4">
                <div className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Total Requests</div>
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
                <Eye className={`w-6 h-6 ${
                  isDarkMode ? 'text-blue-300' : 'text-blue-600'
                }`} />
              </div>
              <div className="ml-4">
                <div className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Reviewed</div>
                <div className={`text-2xl font-bold ${
                  isDarkMode ? 'text-blue-300' : 'text-blue-600'
                }`}>{loading ? '...' : stats.reviewed}</div>
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
                isDarkMode ? 'bg-red-900/30 border border-red-700/50' : 'bg-red-100'
              }`}>
                <XCircle className={`w-6 h-6 ${
                  isDarkMode ? 'text-red-300' : 'text-red-600'
                }`} />
              </div>
              <div className="ml-4">
                <div className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Rejected</div>
                <div className={`text-2xl font-bold ${
                  isDarkMode ? 'text-red-300' : 'text-red-600'
                }`}>{loading ? '...' : stats.rejected}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Collaborations Table with Search */}
        <div className={`rounded-2xl shadow-sm border overflow-hidden transition-colors ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          {/* Table Header with Search */}
          <div className={`px-6 py-4 border-b transition-colors ${
            isDarkMode 
              ? 'border-gray-700 bg-gray-700' 
              : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h3 className={`text-lg font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Collaboration Requests</h3>
                <span className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {loading ? '...' : `${collaborations.length} request${collaborations.length !== 1 ? 's' : ''}`}
                </span>
              </div>
              
              {/* Search Input */}
              <div className="relative w-80">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-400'
                }`} />
                <input
                  type="text"
                  placeholder="Search by name, email, company..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all text-sm font-medium ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                  }`}
                />
                {filters.search && (
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                    className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${
                      isDarkMode 
                        ? 'text-gray-400 hover:text-gray-200' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className={`min-w-full divide-y ${
              isDarkMode ? 'divide-gray-700' : 'divide-gray-200'
            }`}>
              <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                <tr>
                  <th className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>Contact</th>
                  <th className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>Company & Type</th>
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
                ) : collaborations.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center">
                      <div className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                        <Building className={`w-12 h-12 mx-auto mb-4 ${
                          isDarkMode ? 'text-gray-500' : 'text-gray-300'
                        }`} />
                        <p className="text-lg font-medium">No collaboration requests found</p>
                        <p className="text-sm">Try adjusting your filters or check back later.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  collaborations.map((collaboration) => (
                    <tr key={collaboration._id} className={`transition-colors ${
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
                              {collaboration.firstName} {collaboration.lastName}
                            </div>
                            <div className={`text-sm flex items-center mt-1 ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              <Mail className="w-4 h-4 mr-1" />
                              {collaboration.email}
                            </div>
                            {collaboration.phone && (
                              <div className={`text-sm flex items-center mt-1 ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                                <Phone className="w-4 h-4 mr-1" />
                                {collaboration.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          <div className="flex items-center mb-2">
                            <Building className={`w-4 h-4 mr-2 ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-400'
                            }`} />
                            <span className="font-medium">{collaboration.company}</span>
                          </div>
                          {collaboration.website && (
                            <div className="flex items-center mb-2">
                              <Globe className={`w-4 h-4 mr-2 ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-400'
                              }`} />
                              <a 
                                href={collaboration.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-xs"
                              >
                                Visit Website
                              </a>
                            </div>
                          )}
                          <div className={`text-xs px-2 py-1 rounded-full inline-block ${
                            isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {collaboration.collaborationType}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-2">
                          <div className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(collaboration.status)}`}>
                            {getStatusIcon(collaboration.status)}
                            <span className="ml-1">{collaboration.status.charAt(0).toUpperCase() + collaboration.status.slice(1)}</span>
                          </div>
                          <div className={`text-xs font-medium ${getPriorityColor(collaboration.priority)}`}>
                            {collaboration.priority.charAt(0).toUpperCase() + collaboration.priority.slice(1)} Priority
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
                            {formatDate(collaboration.createdAt)}
                          </div>
                          {collaboration.reviewedAt && (
                            <div className={`text-xs mt-1 ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              Reviewed: {formatDate(collaboration.reviewedAt)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSelectedCollaboration(collaboration)}
                            className={`flex items-center px-3 py-1 rounded-lg transition-colors ${
                              isDarkMode 
                                ? 'bg-blue-900/50 text-blue-300 hover:bg-blue-900/70' 
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            }`}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Modal */}
        {selectedCollaboration && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={`rounded-2xl shadow-2xl border max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-colors ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <h3 className={`text-xl font-semibold ${
                    isDarkMode ? 'text-white' : 'text-black'
                  }`}>Collaboration Request Details</h3>
                  <button
                    onClick={() => setSelectedCollaboration(null)}
                    className={`transition-colors ${
                      isDarkMode 
                        ? 'text-gray-400 hover:text-gray-200' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-6">
                  {/* Contact Information */}
                  <div>
                    <h4 className={`text-lg font-medium mb-3 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>Contact Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={`text-sm font-medium ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>Name</label>
                        <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>{selectedCollaboration.firstName} {selectedCollaboration.lastName}</p>
                      </div>
                      <div>
                        <label className={`text-sm font-medium ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>Email</label>
                        <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>{selectedCollaboration.email}</p>
                      </div>
                      <div>
                        <label className={`text-sm font-medium ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>Phone</label>
                        <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>{selectedCollaboration.phone || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className={`text-sm font-medium ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>Company</label>
                        <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>{selectedCollaboration.company}</p>
                      </div>
                    </div>
                    {selectedCollaboration.website && (
                      <div className="mt-4">
                        <label className={`text-sm font-medium ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>Website</label>
                        <p className="text-blue-600 hover:text-blue-800">
                          <a href={selectedCollaboration.website} target="_blank" rel="noopener noreferrer">
                            {selectedCollaboration.website}
                          </a>
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Collaboration Details */}
                  <div>
                    <h4 className={`text-lg font-medium mb-3 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>Collaboration Details</h4>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className={`text-sm font-medium ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>Type</label>
                        <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>{selectedCollaboration.collaborationType}</p>
                      </div>
                      <div>
                        <label className={`text-sm font-medium ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>Priority</label>
                        <p className={`font-medium ${getPriorityColor(selectedCollaboration.priority)}`}>
                          {selectedCollaboration.priority.charAt(0).toUpperCase() + selectedCollaboration.priority.slice(1)}
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className={`text-sm font-medium ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>Description</label>
                      <p className={`mt-1 whitespace-pre-wrap ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>{selectedCollaboration.description}</p>
                    </div>
                  </div>

                  {/* Status and Notes */}
                  <div>
                    <h4 className={`text-lg font-medium mb-3 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>Status & Notes</h4>
                    <div className="mb-4">
                      <label className={`text-sm font-medium ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>Current Status</label>
                      <div className={`inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full border mt-1 ${getStatusColor(selectedCollaboration.status)}`}>
                        {getStatusIcon(selectedCollaboration.status)}
                        <span className="ml-1">{selectedCollaboration.status.charAt(0).toUpperCase() + selectedCollaboration.status.slice(1)}</span>
                      </div>
                    </div>
                    {selectedCollaboration.notes && (
                      <div>
                        <label className={`text-sm font-medium ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>Admin Notes</label>
                        <p className={`mt-1 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>{selectedCollaboration.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className={`flex space-x-3 mt-6 pt-6 border-t transition-colors ${
                  isDarkMode ? 'border-gray-700' : 'border-gray-200'
                }`}>
                  <button
                    onClick={() => setSelectedCollaboration(null)}
                    className={`flex-1 px-4 py-2 border rounded-xl transition-colors ${
                      isDarkMode 
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Close
                  </button>
                  {selectedCollaboration.status === 'pending' && (
                    <>
                      <button
                        onClick={() => {
                          updateCollaborationStatus(selectedCollaboration._id, 'accepted');
                          setSelectedCollaboration(null);
                        }}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => {
                          updateCollaborationStatus(selectedCollaboration._id, 'rejected');
                          setSelectedCollaboration(null);
                        }}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
