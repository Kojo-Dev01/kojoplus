'use client';

import { X, Eye, Edit, Trash2, Play, BookOpen, Users, User, Calendar, Tag, CheckCircle, Clock, Star, DollarSign, Award, Globe, Lock, Video, FileText, List, ChevronRight, ChevronDown, ArrowRight, ArrowLeft, ExternalLink, Maximize2, Minimize2, BarChart3, Shield, TrendingUp, Download } from 'lucide-react';
const COURSE_TYPE_ICONS = {
  free: Globe,
  paid: Lock
};

const ACCESS_LEVEL_ICONS = {
  public: Globe,
  members: Users,
  premium: Award,
  admin: Lock
};

const LEVEL_COLORS = {
  beginner: 'bg-green-100 text-green-800',
  intermediate: 'bg-yellow-100 text-yellow-800',
  advanced: 'bg-orange-100 text-orange-800',
  expert: 'bg-red-100 text-red-800'
};
export default function CourseOverviewTab({ course }) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };


  const AccessIcon = ACCESS_LEVEL_ICONS[course.accessLevel] || Globe;
  const CourseTypeIcon = COURSE_TYPE_ICONS[course.courseType] || BookOpen;

  const getLevelColor = (level) => {
    return LEVEL_COLORS[level] || 'bg-gray-100 text-gray-800';
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  // Get appropriate icon for course

  return (
    <div className="space-y-8">
            {/* Course Hero Section */}
            <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 rounded-xl overflow-hidden">
              {course.thumbnailUrl && (
                <div className="absolute inset-0">
                  <img
                    src={course.thumbnailUrl}
                    alt={course.title}
                    className="w-full h-full object-cover opacity-20"
                  />
                  <div className="absolute inset-0 bg-black/20"></div>
                </div>
              )}
              
              {/* Subtle Background Pattern */}
              <div className="absolute top-0 right-0 w-64 h-64 opacity-5">
                <div className="w-full h-full bg-gradient-to-br from-white to-transparent rounded-full blur-2xl"></div>
              </div>
              
              <div className="relative z-10 p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Course Icon */}
                    <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-white" />
                    </div>
                    
                    {/* Title and Metadata */}
                    <div className="flex-1 min-w-0">
                      <h1 className="text-2xl font-bold mb-3 text-white leading-tight">
                        {course.title}
                      </h1>
                      
                      {/* Status Badges */}
                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${getLevelColor(course.level)}`}>
                          {course.level}
                        </span>
                        
                        <span className="px-3 py-1 text-sm font-medium rounded-full bg-white/20 backdrop-blur-sm border border-white/10 text-white/90 uppercase tracking-wide">
                          {course.category.replace('-', ' ')}
                        </span>
                        
                        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
                          course.isPublished 
                            ? 'bg-white/20 border-white/20' 
                            : 'bg-white/10 border-white/10'
                        } border`}>
                          <div className={`w-2 h-2 rounded-full ${
                            course.isPublished ? 'bg-green-300' : 'bg-yellow-300'
                          }`}></div>
                          <span className="text-sm font-medium text-white/80">
                            {course.isPublished ? 'Published' : 'Draft'}
                          </span>
                        </div>

                        {course.isPremium && (
                          <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-white/20 border border-white/20">
                            <Award className="w-4 h-4 text-purple-300" />
                            <span className="text-sm font-medium text-purple-300">Premium</span>
                          </div>
                        )}

                        {course.courseType === 'paid' && (
                          <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-white/20 border border-white/20">
                            <DollarSign className="w-4 h-4 text-green-300" />
                            <span className="text-sm font-medium text-green-300">${course.price}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Description */}
                      <p className="text-white/80 text-base leading-relaxed max-w-2xl">
                        {course.shortDescription || course.description}
                      </p>
                    </div>
                  </div>
                  
                  {course.introVideoUrl && (
                    <button className="ml-6 w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                      <Play className="w-8 h-8 text-white ml-1" />
                    </button>
                  )}
                </div>
                
                {/* Course Actions Bar */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <div className="flex items-center space-x-4 text-white/70 text-sm">
                    <div className="flex items-center space-x-2">
                      <AccessIcon className="w-4 h-4" />
                      <span>{course.accessLevel}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>{course.instructor}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(course.createdAt)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {course.purchaseLink && (
                      <a
                        href={course.purchaseLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 px-3 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-colors text-white/90 hover:text-white text-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Purchase Link</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Modules', value: course.totalModules || 0, icon: BookOpen },
                { label: 'Enrolled', value: course.enrollments || 0, icon: Users },
                { label: 'Completed', value: course.completions || 0, icon: CheckCircle },
                { label: 'Rating', value: course.rating || 0, icon: Star }
              ].map((stat, index) => (
                <div key={index} className="bg-white rounded-xl p-4 border border-gray-200 hover:border-gray-300 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                      <stat.icon className="w-4 h-4 text-gray-600" />
                    </div>
                    <span className="text-xs text-gray-500">{stat.label}</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                </div>
              ))}
            </div>

            {/* Course Information Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Course Details */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Course Information</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Instructor</span>
                    <span className="text-sm text-gray-900">{course.instructor}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Section</span>
                    <span className="text-sm text-gray-900 capitalize">{course.section.replace('-', ' ')}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Duration</span>
                    <span className="text-sm text-gray-900">{course.totalDuration || 'Not specified'}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Course Type</span>
                    <div className="flex items-center space-x-2">
                      <CourseTypeIcon className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-900 capitalize">{course.courseType}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-medium text-gray-600">Price</span>
                    <span className="text-sm text-gray-900 font-semibold">
                      {course.courseType === 'free' || course.price === 0 ? 'Free' : `$${course.price}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Publication & Access */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Publication & Access</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Access Level</span>
                    <div className="flex items-center space-x-2">
                      <AccessIcon className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-900 capitalize">{course.accessLevel}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Status</span>
                    <span className={`text-sm font-medium ${
                      course.isPublished ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {course.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Featured</span>
                    <span className={`text-sm font-medium ${
                      course.isFeatured ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {course.isFeatured ? 'Yes' : 'No'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Created</span>
                    <span className="text-sm text-gray-900">{formatDate(course.createdAt)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-medium text-gray-600">Last Modified</span>
                    <span className="text-sm text-gray-900">{formatDate(course.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Information (for paid courses) */}
            {course.courseType === 'paid' && course.productId && (
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Product Information</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Product ID</label>
                    <p className="text-gray-900 font-mono text-sm mt-1">{course.productId}</p>
                  </div>
                  
                  {course.purchaseLink && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Purchase Link</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="text-blue-600 text-sm truncate flex-1">{course.purchaseLink}</p>
                        <a
                          href={course.purchaseLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tags Section */}
            {course.tags && course.tags.length > 0 && (
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Tags</h3>
                  <span className="text-sm text-gray-500">
                    {course.tags.length} tag{course.tags.length !== 1 ? 's' : ''}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {course.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-800 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
  );
}
