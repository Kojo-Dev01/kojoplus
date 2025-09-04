'use client';

import { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  Search, 
  Filter, 
  RefreshCw, 
  Clock, 
  User, 
  Mail, 
  Phone,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Reply,
  Archive,
  Trash2,
  Plus,
  ArrowLeft,
  MessageSquare,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import DashboardLayout from '@/components/DashboardLayout';
import ChatInterface from '@/components/chat/ChatInterface';
import CustomDropdown from '@/components/ui/CustomDropdown';
import { useRouter } from 'next/navigation';

export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [showChatInterface, setShowChatInterface] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEnquiries, setTotalEnquiries] = useState(0);
  const [itemsPerPage] = useState(50); // Changed to 50

  const { isDarkMode } = useTheme();

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

  useEffect(() => {
    fetchEnquiries();
  }, [currentPage, statusFilter, priorityFilter, searchTerm]);

  const fetchEnquiries = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchTerm.trim(),
        status: statusFilter !== 'all' ? statusFilter : '',
        priority: priorityFilter !== 'all' ? priorityFilter : ''
      });

      const response = await fetch(`/api/enquiries?${params}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('API Response:', data); // Debug log
        
        setEnquiries(data.enquiries || []);
        setTotalPages(data.totalPages || 1);
        setTotalEnquiries(data.total || 0);
      } else {
        console.error('Failed to fetch enquiries:', response.status);
        const errorData = await response.json();
        console.error('Error details:', errorData);
      }
    } catch (error) {
      console.error('Error fetching enquiries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEnquiries();
    setRefreshing(false);
  };

  const handleChatWithEnquiry = (enquiry) => {
    setSelectedEnquiry(enquiry);
    setShowChatInterface(true);
  };

  const handleCloseChatInterface = () => {
    setShowChatInterface(false);
    setSelectedEnquiry(null);
    // Refresh enquiries to get updated data
    fetchEnquiries();
  };

  const handleUpdateEnquiryStatus = async (enquiryId, status) => {
    try {
      const response = await fetch(`/api/enquiries/${enquiryId}`, {
        method: 'PATCH',
        credentials: 'include',
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        setEnquiries(prev => prev.map(enquiry => 
          enquiry._id === enquiryId ? { ...enquiry, status } : enquiry
        ));
      }
    } catch (error) {
      console.error('Error updating enquiry status:', error);
    }
  };

  const handleStatusUpdate = (enquiryId, newStatus) => {
    handleUpdateEnquiryStatus(enquiryId, newStatus);
  };

  // Check if enquiry is new (created within last 2 days)
  const isNewEnquiry = (createdAt) => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    return new Date(createdAt) > twoDaysAgo;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'closed':
        return <XCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <MessageCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return isDarkMode 
          ? 'bg-orange-900/30 text-orange-200 border-2 border-orange-600 shadow-lg shadow-orange-500/20' 
          : 'bg-orange-100 text-orange-900 border-2 border-orange-400 shadow-lg shadow-orange-200/50';
      case 'in_progress':
        return isDarkMode 
          ? 'bg-blue-900/20 text-blue-300 border-blue-800' 
          : 'bg-blue-100 text-blue-800 border-blue-200';
      case 'resolved':
        return isDarkMode 
          ? 'bg-green-900/20 text-green-300 border-green-800' 
          : 'bg-green-100 text-green-800 border-green-200';
      case 'closed':
        return isDarkMode 
          ? 'bg-gray-900/20 text-gray-300 border-gray-800' 
          : 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return isDarkMode 
          ? 'bg-gray-900/20 text-gray-300 border-gray-800' 
          : 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return isDarkMode 
          ? 'bg-red-900/20 text-red-300 border-red-800' 
          : 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return isDarkMode 
          ? 'bg-yellow-900/20 text-yellow-300 border-yellow-800' 
          : 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return isDarkMode 
          ? 'bg-green-900/20 text-green-300 border-green-800' 
          : 'bg-green-100 text-green-800 border-green-200';
      default:
        return isDarkMode 
          ? 'bg-gray-900/20 text-gray-300 border-gray-800' 
          : 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' }
  ];

  const priorityOptions = [
    { value: 'all', label: 'All Priority' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' }
  ];

  // If chat interface is open, show it instead of the main content
  if (showChatInterface && selectedEnquiry) {
    return (
      <DashboardLayout user={user}>
        <div className="h-full flex flex-col">
          {/* Chat Header */}
          <div className={`flex items-center space-x-4 p-4 border-b ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <button
              onClick={handleCloseChatInterface}
              className={`flex items-center space-x-2 px-4 py-2 border rounded-xl transition-colors ${
                isDarkMode 
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Enquiries</span>
            </button>
            <div>
              <h1 className={`text-2xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Chat with {selectedEnquiry.customerName}
              </h1>
              <p className={`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Enquiry: {selectedEnquiry.subject}
              </p>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="flex-1 overflow-hidden">
            <ChatInterface
              isOpen={true}
              onClose={handleCloseChatInterface}
              enquiry={selectedEnquiry}
              onStatusUpdate={handleStatusUpdate}
              mode="embedded"
            />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className={`text-3xl font-bold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Customer Enquiries
            </h1>
            <p className={`mt-2 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Manage and respond to customer inquiries and support requests
            </p>
          </div>
          
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className={`flex items-center space-x-2 px-4 py-2 border rounded-xl transition-colors ${
                isDarkMode 
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className={`rounded-2xl border p-6 transition-colors ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className={`absolute left-3 top-3 w-5 h-5 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-400'
                }`} />
                <input
                  type="text"
                  placeholder="Search enquiries..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1); // Reset to first page on search
                  }}
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
              <CustomDropdown
                options={statusOptions}
                value={statusFilter}
                onChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1); // Reset to first page on filter change
                }}
                placeholder="Select Status"
                className="min-w-[150px]"
              />

              <CustomDropdown
                options={priorityOptions}
                value={priorityFilter}
                onChange={(value) => {
                  setPriorityFilter(value);
                  setCurrentPage(1); // Reset to first page on filter change
                }}
                placeholder="Select Priority"
                className="min-w-[150px]"
              />
            </div>
          </div>
        </div>

        {/* Enquiries List */}
        <div className={`rounded-2xl border transition-colors ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className={`text-xl font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Enquiries
              </h3>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                isDarkMode 
                  ? 'bg-gray-700 text-gray-300' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {totalEnquiries} total enquiries
              </span>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className={`text-lg ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>Loading enquiries...</span>
                </div>
              </div>
            ) : enquiries.length > 0 ? (
              <>
                <div className="space-y-4">
                  {enquiries.map((enquiry) => (
                    <div
                      key={enquiry._id}
                      className={`p-4 border rounded-xl transition-colors hover:shadow-md ${
                        isDarkMode 
                          ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/50' 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className={`text-lg font-semibold ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {enquiry.subject || 'No Subject'}
                            </h4>
                            
                            {/* New Badge for recent enquiries */}
                            {isNewEnquiry(enquiry.createdAt) && (
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold border-2 animate-pulse ${
                                isDarkMode 
                                  ? 'bg-emerald-900/30 text-emerald-200 border-emerald-500 shadow-lg shadow-emerald-500/20' 
                                  : 'bg-emerald-100 text-emerald-900 border-emerald-400 shadow-lg shadow-emerald-200/50'
                              }`}>
                                NEW
                              </span>
                            )}
                            
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                              getStatusColor(enquiry.status)
                            }`}>
                              {getStatusIcon(enquiry.status)}
                              <span className="ml-1 capitalize">{enquiry.status?.replace('_', ' ')}</span>
                            </span>
                            
                            {enquiry.priority && (
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                                getPriorityColor(enquiry.priority)
                              }`}>
                                {enquiry.priority.toUpperCase()} PRIORITY
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-6 text-sm mb-3">
                            {(enquiry.customerName || `${enquiry.firstName} ${enquiry.lastName}`) && (
                              <div className="flex items-center space-x-2">
                                <User className={`w-4 h-4 ${
                                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`} />
                                <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                                  {enquiry.customerName || `${enquiry.firstName} ${enquiry.lastName}`}
                                </span>
                              </div>
                            )}
                            
                            {enquiry.email && (
                              <div className="flex items-center space-x-2">
                                <Mail className={`w-4 h-4 ${
                                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`} />
                                <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                                  {enquiry.email}
                                </span>
                              </div>
                            )}
                            
                            {enquiry.phone && (
                              <div className="flex items-center space-x-2">
                                <Phone className={`w-4 h-4 ${
                                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`} />
                                <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                                  {enquiry.phone}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {enquiry.message && (
                            <p className={`text-sm mb-3 line-clamp-2 ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-600'
                            }`}>
                              {enquiry.message}
                            </p>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-xs">
                              <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                                ID: {enquiry.enquiryId || enquiry._id?.toString()?.slice(-8)}
                              </span>
                              <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                                {formatDate(enquiry.createdAt)}
                              </span>
                              {enquiry.responseCount > 0 && (
                                <span className={`px-2 py-1 rounded-full ${
                                  isDarkMode 
                                    ? 'bg-blue-900/20 text-blue-300' 
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {enquiry.responseCount} response{enquiry.responseCount !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => handleChatWithEnquiry(enquiry)}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                              isDarkMode 
                                ? 'hover:bg-gray-700 text-blue-400 hover:text-blue-300 border border-blue-500/30 hover:border-blue-400' 
                                : 'hover:bg-gray-100 text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-300'
                            }`}
                            title="Chat with customer"
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span className="text-sm font-medium">Chat</span>
                          </button>
                          
                          {enquiry.status !== 'closed' && (
                            <button
                              onClick={() => handleUpdateEnquiryStatus(enquiry._id, 'closed')}
                              className={`p-2 rounded-lg transition-colors ${
                                isDarkMode 
                                  ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300' 
                                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-600'
                              }`}
                              title="Close enquiry"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-between">
                    <div className={`text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalEnquiries)} of {totalEnquiries} enquiries
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`flex items-center space-x-1 px-3 py-2 border rounded-lg transition-colors ${
                          currentPage === 1
                            ? isDarkMode 
                              ? 'border-gray-700 text-gray-600 cursor-not-allowed' 
                              : 'border-gray-200 text-gray-400 cursor-not-allowed'
                            : isDarkMode
                              ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Previous</span>
                      </button>

                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 7) {
                            pageNum = i + 1;
                          } else if (currentPage <= 4) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 3) {
                            pageNum = totalPages - 6 + i;
                          } else {
                            pageNum = currentPage - 3 + i;
                          }
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`px-3 py-2 border rounded-lg transition-colors ${
                                pageNum === currentPage
                                  ? 'bg-blue-600 border-blue-600 text-white'
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
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`flex items-center space-x-1 px-3 py-2 border rounded-lg transition-colors ${
                          currentPage === totalPages
                            ? isDarkMode 
                              ? 'border-gray-700 text-gray-600 cursor-not-allowed' 
                              : 'border-gray-200 text-gray-400 cursor-not-allowed'
                            : isDarkMode
                              ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span>Next</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <MessageCircle className={`w-16 h-16 mx-auto mb-4 ${
                  isDarkMode ? 'text-gray-600' : 'text-gray-400'
                }`} />
                <h3 className={`text-xl font-semibold mb-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' 
                    ? 'No matching enquiries found' 
                    : 'No enquiries yet'
                  }
                </h3>
                <p className={`mb-6 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Customer enquiries will appear here when they contact you.'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
