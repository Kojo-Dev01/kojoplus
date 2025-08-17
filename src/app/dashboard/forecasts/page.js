'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, ChevronDown, Eye, Edit, Trash2, Plus, Upload, Image as ImageIcon, BarChart3, TrendingUp, Heart, Users, MessageSquare, AlertCircle, XCircle } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import CreateForecastModal from '@/components/forecasts/CreateForecastModal';
import EditForecastModal from '@/components/forecasts/EditForecastModal';
import ForecastDetailModal from '@/components/forecasts/ForecastDetailModal';

export default function ForecastsPage() {
  const [user, setUser] = useState(null);
  const [forecasts, setForecasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [stats, setStats] = useState({});
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    page: 1
  });
  const [selectedForecast, setSelectedForecast] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);

          // Check if user has access to forecasts
          if (userData?.isAdministrator && !userData.tabAccess?.includes('forecasts')) {
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

  const fetchForecasts = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      params.append('page', filters.page);
      params.append('limit', 20);

      const response = await fetch(`/api/forecasts?${params}`, {
        credentials: 'include' // Use cookies for authentication
      });

      if (response.ok) {
        const data = await response.json();
        setForecasts(data.forecasts);
        setStats(data.stats);
        setPagination(data.pagination);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch forecasts');
      }
    } catch (error) {
      setError('Failed to fetch forecasts');
      console.error('Error fetching forecasts:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteForecast = async (id) => {
    if (!confirm('Are you sure you want to delete this forecast?')) return;

    try {
      const response = await fetch(`/api/forecasts/${id}`, {
        method: 'DELETE',
        credentials: 'include' // Use cookies for authentication
      });

      if (response.ok) {
        fetchForecasts();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete forecast');
      }
    } catch (err) {
      setError('Failed to delete forecast');
      console.error('Error deleting forecast:', err);
    }
  };

  const toggleForecastStatus = async (id, currentStatus) => {
    try {
      const response = await fetch(`/api/forecasts/${id}`, {
        method: 'PATCH',
        credentials: 'include', // Use cookies for authentication
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isPublished: !currentStatus
        })
      });

      if (response.ok) {
        fetchForecasts();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update forecast status');
      }
    } catch (err) {
      setError('Failed to update forecast status');
      console.error('Error updating forecast status:', err);
    }
  };

  useEffect(() => {
    if (user && !accessDenied) {
      fetchForecasts();
    }
  }, [filters.status, filters.search, filters.page, user, accessDenied]);

  const handleViewForecast = (forecast) => {
    setSelectedForecast(forecast);
    setShowDetailModal(true);
  };

  const handleEditForecast = (forecast) => {
    setSelectedForecast(forecast);
    setShowEditModal(true);
  };

  const handleDeleteForecast = (forecast) => {
    if (window.confirm(`Are you sure you want to delete "${forecast.title}"? This action cannot be undone.`)) {
      deleteForecast(forecast._id);
    }
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

  const getStatusColor = (isActive) => {
    return isActive 
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
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
              You don't have permission to access Forecasts. Please contact your administrator if you need access.
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
              <AlertCircle className="w-5 h-5 mr-2 text-red-400" />
              <p className="text-red-300">{error}</p>
              <button 
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-300"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Trading Forecasts</h1>
            <p className="mt-1 text-gray-300">Manage and publish trading forecasts</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Forecast</span>
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
              onClick={fetchForecasts}
              className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-900/30 border border-blue-700/50">
                <TrendingUp className="w-6 h-6 text-blue-300" />
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-400">Total Forecasts</div>
                <div className="text-2xl font-bold text-white">{loading ? '...' : stats.total || 0}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-900/30 border border-green-700/50">
                <BarChart3 className="w-6 h-6 text-green-300" />
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-400">Published</div>
                <div className="text-2xl font-bold text-green-300">{loading ? '...' : stats.published || 0}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-yellow-900/30 border border-yellow-700/50">
                <svg className="w-6 h-6 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-400">Drafts</div>
                <div className="text-2xl font-bold text-yellow-300">{loading ? '...' : (stats.total - stats.published) || 0}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-900/30 border border-purple-700/50">
                <Users className="w-6 h-6 text-purple-300" />
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-400">Total Views</div>
                <div className="text-2xl font-bold text-purple-300">{loading ? '...' : stats.totalViews || 0}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-pink-900/30 border border-pink-700/50">
                <Heart className="w-6 h-6 text-pink-300" />
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-400">Total Likes</div>
                <div className="text-2xl font-bold text-pink-300">{loading ? '...' : stats.totalLikes || 0}</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-indigo-900/30 border border-indigo-700/50">
                <MessageSquare className="w-6 h-6 text-indigo-300" />
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-400">Total Comments</div>
                <div className="text-2xl font-bold text-indigo-300">{loading ? '...' : stats.totalComments || 0}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Search Input */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by title or description..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-600 bg-gray-700 text-white placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 font-medium"
                  />
                </div>
              </div>
              
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Status</label>
                <div className="relative">
                  <button
                    type="button"
                    className="relative w-full bg-gray-700 border border-gray-600 text-white rounded-xl shadow-sm pl-3 pr-10 py-3 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  >
                    <span className="block truncate font-medium text-white">
                      {filters.status ? 
                        filters.status.charAt(0).toUpperCase() + filters.status.slice(1) : 
                        'All Status'
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
                          { value: 'active', label: 'Active' },
                          { value: 'inactive', label: 'Inactive' }
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            className={`w-full text-left relative cursor-pointer select-none py-2 pl-3 pr-9 transition-colors ${
                              filters.status === option.value 
                                ? 'bg-red-900/50 text-red-300 font-semibold'
                                : 'text-gray-300 font-medium hover:bg-gray-700 hover:text-white'
                            }`}
                            onClick={() => {
                              setFilters(prev => ({ ...prev, status: option.value, page: 1 }));
                              setShowStatusDropdown(false);
                            }}
                          >
                            <span className="block truncate">{option.label}</span>
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

        {/* Forecasts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-gray-800 border border-gray-700 rounded-2xl shadow-sm overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-700"></div>
                <div className="p-6">
                  <div className="h-4 rounded w-3/4 mb-2 bg-gray-700"></div>
                  <div className="h-3 rounded w-full mb-1 bg-gray-700"></div>
                  <div className="h-3 rounded w-2/3 bg-gray-700"></div>
                </div>
              </div>
            ))
          ) : forecasts.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <h3 className="text-lg font-medium mb-2 text-white">No forecasts found</h3>
              <p className="mb-4 text-gray-400">
                {filters.search || filters.status ? 'Try adjusting your filters' : 'Get started by creating your first forecast'}
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                Create First Forecast
              </button>
            </div>
          ) : (
            forecasts.map((forecast) => (
              <div key={forecast._id} className="bg-gray-800 border border-gray-700 rounded-2xl shadow-sm overflow-hidden hover:bg-gray-750 transition-all">
                {/* Image */}
                <div className="relative h-48 bg-gray-700">
                  <img
                    src={forecast.imageUrl}
                    alt={forecast.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = '/placeholder-forecast.jpg';
                    }}
                  />
                  <div className="absolute top-3 right-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(forecast.isActive)}`}>
                      {forecast.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-2 line-clamp-2 text-white">
                    {forecast.title}
                  </h3>
                  <p className="text-sm mb-4 line-clamp-3 text-gray-300">
                    {forecast.description}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm mb-4 text-gray-400">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{forecast.views || 0}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Heart className="w-4 h-4" />
                        <span>{forecast.likeCount || forecast.likes?.length || 0}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageSquare className="w-4 h-4" />
                        <span>{forecast.commentCount || forecast.comments?.length || 0}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span>{formatDate(forecast.createdAt)}</span>
                      {!forecast.isPublished && (
                        <span className="text-xs font-medium text-yellow-400">Draft</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewForecast(forecast)}
                      className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-900/50 text-blue-300 hover:bg-blue-900/70 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </button>
                    <button
                      onClick={() => handleEditForecast(forecast)}
                      className="flex-1 flex items-center justify-center px-3 py-2 bg-green-900/50 text-green-300 hover:bg-green-900/70 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => toggleForecastStatus(forecast._id, forecast.isActive)}
                      className={`px-3 py-2 rounded-lg transition-colors ${
                        forecast.isActive 
                          ? 'bg-red-900/50 text-red-300 hover:bg-red-900/70'
                          : 'bg-green-900/50 text-green-300 hover:bg-green-900/70'
                      }`}
                      title={forecast.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {forecast.isActive ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteForecast(forecast)}
                      className="px-3 py-2 bg-red-900/50 text-red-300 hover:bg-red-900/70 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-300">
              Showing page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalCount} total)
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={!pagination.hasPrev}
                className="px-3 py-1 bg-black text-white border border-black rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={!pagination.hasNext}
                className="px-3 py-1 bg-black text-white border border-black rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Modals */}
        <CreateForecastModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={fetchForecasts}
        />

        <EditForecastModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={fetchForecasts}
          forecast={selectedForecast}
        />

        <ForecastDetailModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          forecast={selectedForecast}
        />
      </div>
    </DashboardLayout>
  );
}
