'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, ChevronDown, Eye, Plus, Edit, Trash2, BarChart3, FileText, Video, Headphones, BookOpen, Wrench, FileImage, Presentation, Globe, Lock, Users, Crown, AlertCircle, XCircle, CheckCircle } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import CreateResourceModal from '@/components/resources/CreateResourceModal';
import EditResourceModal from '@/components/resources/EditResourceModal';
import ResourceDetailsModal from '@/components/resources/ResourceDetailsModal';

const RESOURCE_TYPE_ICONS = {
  video: Video,
  article: FileText,
  ebook: BookOpen,
  webinar: Presentation,
  podcast: Headphones,
  infographic: FileImage,
  tool: Wrench,
  template: FileText,
  course: BookOpen
};

const ACCESS_LEVEL_ICONS = {
  public: Globe,
  members: Users,
  premium: Crown,
  admin: Lock
};

const RESOURCE_TYPES = [
  { value: 'video', label: 'Video' },
  { value: 'article', label: 'Article' },
  { value: 'ebook', label: 'E-book' },
  { value: 'webinar', label: 'Webinar' },
  { value: 'podcast', label: 'Podcast' },
  { value: 'infographic', label: 'Infographic' },
  { value: 'tool', label: 'Tool' },
  { value: 'template', label: 'Template' },
  { value: 'course', label: 'Course' }
];

const RESOURCE_CATEGORIES = [
  { value: 'trading', label: 'Trading' },
  { value: 'education', label: 'Education' },
  { value: 'analysis', label: 'Analysis' },
  { value: 'tools', label: 'Tools' },
  { value: 'strategies', label: 'Strategies' },
  { value: 'psychology', label: 'Psychology' },
  { value: 'risk-management', label: 'Risk Management' },
  { value: 'market-news', label: 'Market News' },
  { value: 'tutorials', label: 'Tutorials' },
  { value: 'general', label: 'General' }
];

const RESOURCE_STATUS = [
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'review', label: 'Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'archived', label: 'Archived' }
];

export default function ResourcesPage() {
  const [user, setUser] = useState(null);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [stats, setStats] = useState({});
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    category: '',
    status: '',
    page: 1
  });
  const [selectedResource, setSelectedResource] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          
          // Check if user has access to resources
          if (userData?.isAdministrator && !userData.tabAccess?.includes('resources')) {
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

  const fetchResources = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await fetch(`/api/resources?${params}`, {
        credentials: 'include' // Use cookies for authentication
      });

      if (response.ok) {
        const data = await response.json();
        setResources(data.resources || []);
        setStats(data.stats || {});
        setPagination(data.pagination || {});
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch resources');
      }
    } catch (error) {
      setError('Failed to fetch resources');
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteResource = async (resource) => {
    try {
      const response = await fetch(`/api/resources/${resource._id}`, {
        method: 'DELETE',
        credentials: 'include' // Use cookies for authentication
      });

      if (response.ok) {
        setResources(prev => prev.filter(r => r._id !== resource._id));
        fetchResources(); // Refresh stats
        return { success: true };
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete resource');
        return { success: false };
      }
    } catch (err) {
      setError('Failed to delete resource');
      console.error('Error deleting resource:', err);
      return { success: false };
    }
  };

  useEffect(() => {
    if (user) {
      fetchResources();
    }
  }, [filters, user]);

  // Handle resource actions
  const handleViewResource = (resource) => {
    setSelectedResource(resource);
    setShowDetailsModal(true);
  };

  const handleEditResource = (resource) => {
    setSelectedResource(resource);
    setShowEditModal(true);
  };

  const handleDeleteResource = async (resource) => {
    try {
      const response = await fetch(`/api/resources/${resource._id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setResources(prev => prev.filter(r => r._id !== resource._id));
        fetchResources(); // Refresh stats
        return { success: true };
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete resource');
        return { success: false };
      }
    } catch (err) {
      setError('Failed to delete resource');
      console.error('Error deleting resource:', err);
      return { success: false };
    }
  };

  const handleCreateSuccess = () => {
    fetchResources();
    setShowCreateModal(false);
  };

  const handleEditSuccess = () => {
    fetchResources();
    setShowEditModal(false);
    setShowDetailsModal(false);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTypeIcon = (type) => {
    const Icon = RESOURCE_TYPE_ICONS[type] || FileText;
    return <Icon className="w-4 h-4" />;
  };

  const getAccessLevelIcon = (accessLevel, isPremium) => {
    if (isPremium) {
      return <Crown className="w-4 h-4 text-yellow-500" />;
    }
    const Icon = ACCESS_LEVEL_ICONS[accessLevel] || Globe;
    return <Icon className="w-4 h-4" />;
  };

  const getStatusColor = (status) => {
    const colors = {
      published: 'bg-green-100 text-green-800',
      draft: 'bg-gray-100 text-gray-800',
      review: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      archived: 'bg-red-100 text-red-800'
    };
    return colors[status] || colors.draft;
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
              You don't have permission to access the Resource Library. Please contact your administrator if you need access.
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
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Resource Library</h1>
            <p className="mt-1 text-gray-300">Manage educational content and resources</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-600 text-gray-300 rounded-xl hover:bg-gray-700 transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              <ChevronDown className={`w-4 h-4 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            <button
              onClick={fetchResources}
              className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
            >
              Refresh
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Resource</span>
            </button>
          </div>
        </div>

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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-lg bg-blue-900/30 border border-blue-700/50 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Total Resources</p>
                <p className="text-2xl font-bold text-white">{loading ? '...' : stats.total || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-lg bg-green-900/30 border border-green-700/50 flex items-center justify-center">
                <Globe className="w-5 h-5 text-green-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Published</p>
                <p className="text-2xl font-bold text-green-300">{loading ? '...' : stats.published || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-lg bg-gray-700 border border-gray-600 flex items-center justify-center">
                <Edit className="w-5 h-5 text-gray-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Drafts</p>
                <p className="text-2xl font-bold text-white">{loading ? '...' : stats.draft || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-lg bg-purple-900/30 border border-purple-700/50 flex items-center justify-center">
                <Eye className="w-5 h-5 text-purple-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Total Views</p>
                <p className="text-2xl font-bold text-purple-300">{loading ? '...' : stats.totalViews || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-lg bg-orange-900/30 border border-orange-700/50 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-orange-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Downloads</p>
                <p className="text-2xl font-bold text-orange-300">{loading ? '...' : stats.totalDownloads || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Search Input */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search resources..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-600 bg-gray-700 text-white placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Type</label>
                <div className="relative">
                  <button
                    type="button"
                    className="relative w-full border border-gray-600 bg-gray-700 text-white rounded-xl shadow-sm pl-3 pr-10 py-3 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                  >
                    <span className="block truncate font-medium text-white">
                      {filters.type ? RESOURCE_TYPES.find(t => t.value === filters.type)?.label : 'All Types'}
                    </span>
                    <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${
                        showTypeDropdown ? 'rotate-180' : ''
                      } text-gray-400`} />
                    </span>
                  </button>

                  {showTypeDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowTypeDropdown(false)} />
                      <div className="absolute z-20 mt-1 w-full bg-gray-800 ring-gray-600 shadow-lg max-h-60 rounded-xl py-1 ring-1 ring-opacity-5 overflow-auto focus:outline-none">
                        <button
                          type="button"
                          className="w-full text-left relative cursor-pointer select-none py-2 pl-3 pr-9 text-gray-300 font-medium hover:bg-gray-700 hover:text-white"
                          onClick={() => {
                            setFilters(prev => ({ ...prev, type: '', page: 1 }));
                            setShowTypeDropdown(false);
                          }}
                        >
                          All Types
                        </button>
                        {RESOURCE_TYPES.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            className={`w-full text-left relative cursor-pointer select-none py-2 pl-3 pr-9 transition-colors ${
                              filters.type === option.value 
                                ? 'bg-blue-900/50 text-blue-300 font-semibold'
                                : 'text-gray-300 font-medium hover:bg-gray-700 hover:text-white'
                            }`}
                            onClick={() => {
                              setFilters(prev => ({ ...prev, type: option.value, page: 1 }));
                              setShowTypeDropdown(false);
                            }}
                          >
                            <span className="block truncate">{option.label}</span>
                            {filters.type === option.value && (
                              <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-blue-400">
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

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Category</label>
                <div className="relative">
                  <button
                    type="button"
                    className="relative w-full border border-gray-600 bg-gray-700 text-white rounded-xl shadow-sm pl-3 pr-10 py-3 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  >
                    <span className="block truncate font-medium text-white">
                      {filters.category ? RESOURCE_CATEGORIES.find(c => c.value === filters.category)?.label : 'All Categories'}
                    </span>
                    <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${
                        showCategoryDropdown ? 'rotate-180' : ''
                      } text-gray-400`} />
                    </span>
                  </button>

                  {showCategoryDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowCategoryDropdown(false)} />
                      <div className="absolute z-20 mt-1 w-full bg-gray-800 ring-gray-600 shadow-lg max-h-60 rounded-xl py-1 ring-1 ring-opacity-5 overflow-auto focus:outline-none">
                        <button
                          type="button"
                          className="w-full text-left relative cursor-pointer select-none py-2 pl-3 pr-9 text-gray-300 font-medium hover:bg-gray-700 hover:text-white"
                          onClick={() => {
                            setFilters(prev => ({ ...prev, category: '', page: 1 }));
                            setShowCategoryDropdown(false);
                          }}
                        >
                          All Categories
                        </button>
                        {RESOURCE_CATEGORIES.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            className={`w-full text-left relative cursor-pointer select-none py-2 pl-3 pr-9 transition-colors ${
                              filters.category === option.value 
                                ? 'bg-blue-900/50 text-blue-300 font-semibold'
                                : 'text-gray-300 font-medium hover:bg-gray-700 hover:text-white'
                            }`}
                            onClick={() => {
                              setFilters(prev => ({ ...prev, category: option.value, page: 1 }));
                              setShowCategoryDropdown(false);
                            }}
                          >
                            <span className="block truncate">{option.label}</span>
                            {filters.category === option.value && (
                              <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-blue-400">
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

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Status</label>
                <div className="relative">
                  <button
                    type="button"
                    className="relative w-full border border-gray-600 bg-gray-700 text-white rounded-xl shadow-sm pl-3 pr-10 py-3 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  >
                    <span className="block truncate font-medium text-white">
                      {filters.status ? RESOURCE_STATUS.find(s => s.value === filters.status)?.label : 'All Status'}
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
                        <button
                          type="button"
                          className="w-full text-left relative cursor-pointer select-none py-2 pl-3 pr-9 text-gray-300 font-medium hover:bg-gray-700 hover:text-white"
                          onClick={() => {
                            setFilters(prev => ({ ...prev, status: '', page: 1 }));
                            setShowStatusDropdown(false);
                          }}
                        >
                          All Status
                        </button>
                        {RESOURCE_STATUS.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            className={`w-full text-left relative cursor-pointer select-none py-2 pl-3 pr-9 transition-colors ${
                              filters.status === option.value 
                                ? 'bg-blue-900/50 text-blue-300 font-semibold'
                                : 'text-gray-300 font-medium hover:bg-gray-700 hover:text-white'
                            }`}
                            onClick={() => {
                              setFilters(prev => ({ ...prev, status: option.value, page: 1 }));
                              setShowStatusDropdown(false);
                            }}
                          >
                            <span className="block truncate">{option.label}</span>
                            {filters.status === option.value && (
                              <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-blue-400">
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

        {/* Resources List */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : resources.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-500" />
              <p className="text-lg text-gray-400">No resources found</p>
              <p className="text-sm mt-2 text-gray-500">Create your first resource to get started</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Resource
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {resources.map((resource) => (
                <div key={resource._id} className="p-6 hover:bg-gray-700 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      {/* Thumbnail */}
                      <div className="w-20 h-20 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0">
                        {resource.thumbnailUrl ? (
                          <img
                            src={resource.thumbnailUrl}
                            alt={resource.title}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <div className="text-gray-500">
                            {getTypeIcon(resource.type)}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold truncate text-white">
                            {resource.title}
                          </h3>
                          <div className="flex items-center space-x-1">
                            {getTypeIcon(resource.type)}
                            <span className="text-xs uppercase text-gray-400">{resource.type}</span>
                          </div>
                        </div>
                        
                        <p className="text-sm mb-3 line-clamp-2 text-gray-300">
                          {resource.description}
                        </p>

                        <div className="flex items-center space-x-4 text-xs text-gray-400">
                          <span className="flex items-center space-x-1">
                            {getAccessLevelIcon(resource.accessLevel, resource.isPremium)}
                            <span>{resource.isPremium ? 'Premium' : resource.accessLevel}</span>
                          </span>
                          <span>Views: {resource.views || 0}</span>
                          <span>Downloads: {resource.downloads || 0}</span>
                          <span>{formatDate(resource.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status and Actions */}
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(resource.status)}`}>
                        {resource.status}
                      </span>
                      
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleViewResource(resource)}
                          className="p-2 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-blue-900/20 transition-colors"
                          title="View Resource"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditResource(resource)}
                          className="p-2 rounded-lg text-gray-400 hover:text-green-400 hover:bg-green-900/20 transition-colors"
                          title="Edit Resource"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteResource(resource)}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                          title="Delete Resource"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-gray-800 border-t border-gray-700 px-4 py-3 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-300">
                  Showing page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalCount} resources)
                </div>
                
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
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
                          onClick={() => setFilters(prev => ({ ...prev, page: pageNum }))}
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
                  
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
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

        {/* Modals */}
        <CreateResourceModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />

        <EditResourceModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
          resource={selectedResource}
        />

        <ResourceDetailsModal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          resource={selectedResource}
          onEdit={handleEditResource}
          onDelete={handleDeleteResource}
        />
      </div>
    </DashboardLayout>
  );
}
