'use client';

import { useState, useEffect } from 'react';
import { Users, Search, RefreshCw, Key, Clock, DollarSign, CreditCard, ChevronDown, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function CourseSubscribersTab({ course }) {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    inactive: 0,
    inProgress: 0
  });

  const { secureApiCall } = useAuth();

  const fetchSubscribers = async () => {
    if (!course?._id) return;

    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);

      const response = await secureApiCall(`/api/admin/courses/${course._id}/subscribers?${params}`);

      if (response.ok) {
        const data = await response.json();
        setSubscribers(data.subscribers || []);
        setStats(data.stats || {});
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch subscribers');
      }
    } catch (err) {
      if (err.message !== 'Authentication expired') {
        const errorMessage = err.message.includes('Schema hasn\'t been registered') 
          ? 'Database model error. Please contact support.' 
          : 'Failed to fetch subscribers';
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, [course?._id, searchTerm, statusFilter]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount);
  };

  const getStatusColor = (isActive, progressPercentage) => {
    if (progressPercentage >= 100) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (isActive) return 'bg-green-50 text-green-700 border-green-200';
    return 'bg-red-50 text-red-700 border-red-200';
  };

  const getStatusText = (isActive, progressPercentage) => {
    if (progressPercentage >= 100) return 'Completed';
    if (isActive) return 'Active';
    return 'Inactive';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <Users className="w-5 h-5 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{stats.total || 0}</div>
          <div className="text-sm text-gray-600">Total</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-green-600">{stats.active || 0}</div>
          <div className="text-sm text-gray-600">Active</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <CheckCircle className="w-5 h-5 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-blue-600">{stats.completed || 0}</div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <RefreshCw className="w-5 h-5 text-orange-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-orange-600">{stats.inProgress || 0}</div>
          <div className="text-sm text-gray-600">In Progress</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <Users className="w-5 h-5 text-red-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-red-600">{stats.inactive || 0}</div>
          <div className="text-sm text-gray-600">Inactive</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64 text-gray-900 placeholder-gray-500"
            />
          </div>

          {/* Custom Status Dropdown */}
          <div className="relative">
            <button
              type="button"
              className="relative w-40 bg-white border border-gray-300 rounded-lg shadow-sm pl-3 pr-10 py-2 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
            >
              <span className="block truncate font-medium text-gray-900">
                {statusFilter ? 
                  statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1) : 
                  'All Status'
                }
              </span>
              <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <ChevronDown className={`h-4 w-4 text-gray-600 transition-transform duration-200 ${showStatusDropdown ? 'rotate-180' : ''}`} />
              </span>
            </button>

            {showStatusDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-10"
                  onClick={() => setShowStatusDropdown(false)}
                />
                <div className="absolute z-20 mt-1 w-full bg-white shadow-lg max-h-60 rounded-lg py-1 ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
                  {[
                    { value: '', label: 'All Status' },
                    { value: 'active', label: 'Active' },
                    { value: 'completed', label: 'Completed' },
                    { value: 'inactive', label: 'Inactive' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`w-full text-left relative cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-blue-50 transition-colors ${
                        statusFilter === option.value 
                          ? 'bg-blue-50 text-blue-900 font-semibold' 
                          : 'text-gray-900 font-medium hover:text-blue-900'
                      }`}
                      onClick={() => {
                        setStatusFilter(option.value);
                        setShowStatusDropdown(false);
                      }}
                    >
                      <span className="block truncate">{option.label}</span>
                      {statusFilter === option.value && (
                        <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-blue-600">
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

        <button
          onClick={fetchSubscribers}
          className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Subscribers Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {subscribers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Subscribers Found</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter 
                ? 'No subscribers match your current filters.' 
                : 'This course doesn\'t have any subscribers yet.'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subscriber
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Activity
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {subscribers.map((subscriber) => {
                  const isCompleted = subscriber.progressPercentage >= 100;
                  
                  return (
                    <tr key={subscriber._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium text-sm">
                              {subscriber.userId?.firstName?.charAt(0) || '?'}{subscriber.userId?.lastName?.charAt(0) || '?'}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {subscriber.userId?.firstName || 'Unknown'} {subscriber.userId?.lastName || 'User'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {subscriber.userId?.email || 'No email'}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center mt-1">
                              <Key className="w-3 h-3 mr-1" />
                              {subscriber.username || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{subscriber.progressPercentage || 0}%</div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${subscriber.progressPercentage || 0}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {subscriber.completedLessons?.length || 0} / {course.totalLessons || 0} lessons
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-start space-x-2">
                          <DollarSign className="w-4 h-4 text-green-500 mt-0.5" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency(subscriber.paymentAmount || 0, subscriber.currency)}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center">
                              <CreditCard className="w-3 h-3 mr-1" />
                              Product: {subscriber.productId || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(subscriber.isActive, subscriber.progressPercentage)}`}>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            <span>{getStatusText(subscriber.isActive, subscriber.progressPercentage)}</span>
                          </div>
                          {subscriber.certificateIssued && (
                            <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Certified
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="flex items-center text-gray-600 mb-1">
                            <Clock className="w-3 h-3 mr-1" />
                            <span className="text-xs">Enrolled:</span>
                          </div>
                          <div className="text-xs text-gray-900">{formatDate(subscriber.enrolledAt)}</div>
                          
                          {subscriber.lastAccessedAt && (
                            <>
                              <div className="flex items-center text-gray-600 mt-2 mb-1">
                                <Clock className="w-3 h-3 mr-1" />
                                <span className="text-xs">Last active:</span>
                              </div>
                              <div className="text-xs text-gray-900">{formatDate(subscriber.lastAccessedAt)}</div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
