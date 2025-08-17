'use client';

import React, { useState } from 'react';
import { X, Eye, Edit, Trash2, Play, BookOpen, Users, User, Calendar, Tag, CheckCircle, Clock, Star, DollarSign, Award, Globe, Lock, Video, FileText, List, ChevronRight, ChevronDown, ArrowRight, ArrowLeft, ExternalLink, Maximize2, Minimize2, BarChart3, Shield, TrendingUp, Download } from 'lucide-react';
import CourseOverviewTab from './CourseOverviewTab';
import CourseContentTab from './CourseContentTab';
import CourseSubscribersTab from './CourseSubscribersTab';

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

export default function CourseDetailsModal({ isOpen, onClose, course, onEdit, onDelete }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [expandedModules, setExpandedModules] = useState(new Set());
  const [expandedSections, setExpandedSections] = useState(new Set());
  const [selectedModule, setSelectedModule] = useState(null);
  const [showContentManager, setShowContentManager] = useState(false);

  if (!isOpen || !course) return null;

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await onDelete(course);
      setShowDeleteConfirm(false);
      onClose();
    } catch (error) {
      console.error('Error deleting course:', error);
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLevelColor = (level) => {
    return LEVEL_COLORS[level] || 'bg-gray-100 text-gray-800';
  };

  const AccessIcon = ACCESS_LEVEL_ICONS[course.accessLevel] || Globe;
  const CourseTypeIcon = COURSE_TYPE_ICONS[course.courseType] || BookOpen;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'content', label: 'Content', icon: Video },
    { id: 'subscribers', label: 'Students', icon: Users },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
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

      case 'content':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Course Content</h2>
            </div>
            
            {/* Description */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{course.description}</p>
            </div>

            {/* Learning Outcomes */}
            {course.learningOutcomes && course.learningOutcomes.length > 0 && (
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Outcomes</h3>
                <ul className="space-y-2">
                  {course.learningOutcomes.map((outcome, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{outcome}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Prerequisites */}
            {course.prerequisites && course.prerequisites.length > 0 && (
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Prerequisites</h3>
                <ul className="space-y-2">
                  {course.prerequisites.map((prerequisite, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-700">{prerequisite}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Course Modules */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Modules</h3>
              {course.modules && course.modules.length > 0 ? (
                <div className="space-y-3">
                  {course.modules.map((module, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900">{module.title}</h4>
                      {module.description && (
                        <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No modules added yet</p>
              )}
            </div>

            {/* Course Structure Table of Contents */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Table of Contents</h3>
              
              {course.modules && course.modules.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <List className="w-5 h-5 mr-2 text-blue-600" />
                      Course Structure
                    </h3>
                    <div className="text-sm text-gray-500">
                      {course.totalModules} modules • {course.totalSections} sections • {course.totalLessons} lessons
                    </div>
                  </div>

                  <div className="space-y-3">
                    {course.modules.map((module, moduleIndex) => (
                      <div key={module._id} className="border border-gray-200 rounded-lg overflow-hidden">
                        {/* Module Header */}
                        <div
                          className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                          onClick={() => toggleModule(module._id)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              {expandedModules.has(module._id) ? (
                                <ChevronDown className="w-5 h-5 text-gray-600" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-gray-600" />
                              )}
                            </div>
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold text-blue-600">{moduleIndex + 1}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-base font-semibold text-gray-900 truncate">
                                {module.title}
                              </h4>
                              {module.description && (
                                <p className="text-sm text-gray-600 truncate mt-1">
                                  {module.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <FileText className="w-4 h-4 mr-1" />
                              <span>{(module.sections?.length || 0) + (module.lessons?.length || 0)} items</span>
                            </div>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                              module.isPublished 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {module.isPublished ? 'Published' : 'Draft'}
                            </div>
                          </div>
                        </div>

                        {/* Module Content */}
                        {expandedModules.has(module._id) && (
                          <div className="bg-white">
                            {/* Module Direct Lessons */}
                            {module.lessons && module.lessons.length > 0 && (
                              <div className="border-l-4 border-blue-200 ml-8">
                                {module.lessons.map((lesson, lessonIndex) => (
                                  <div key={lesson._id} className="flex items-center p-3 border-b border-gray-100 last:border-b-0 ml-4">
                                    <div className="flex items-center space-x-3 flex-1">
                                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                        <Play className="w-3 h-3 text-green-600" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h5 className="text-sm font-medium text-gray-900 truncate">
                                          {lesson.title}
                                        </h5>
                                        {lesson.description && (
                                          <p className="text-xs text-gray-600 truncate mt-1">
                                            {lesson.description}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-3 text-xs text-gray-500">
                                      {lesson.duration && (
                                        <div className="flex items-center">
                                          <Clock className="w-3 h-3 mr-1" />
                                          <span>{lesson.duration}min</span>
                                        </div>
                                      )}
                                      <div className={`px-2 py-1 rounded-full font-medium ${
                                        lesson.isPublished 
                                          ? 'bg-green-100 text-green-800' 
                                          : 'bg-yellow-100 text-yellow-800'
                                      }`}>
                                        {lesson.isPublished ? 'Published' : 'Draft'}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Module Sections */}
                            {module.sections && module.sections.length > 0 && (
                              <div className="space-y-2 p-2">
                                {module.sections.map((section, sectionIndex) => (
                                  <div key={section._id} className="border border-gray-100 rounded-md overflow-hidden ml-6">
                                    {/* Section Header */}
                                    <div
                                      className="flex items-center justify-between p-3 bg-gray-25 hover:bg-gray-50 cursor-pointer transition-colors"
                                      onClick={() => toggleSection(section._id)}
                                    >
                                      <div className="flex items-center space-x-3">
                                        <div className="flex-shrink-0">
                                          {expandedSections.has(section._id) ? (
                                            <ChevronDown className="w-4 h-4 text-gray-500" />
                                          ) : (
                                            <ChevronRight className="w-4 h-4 text-gray-500" />
                                          )}
                                        </div>
                                        <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                                          <span className="text-xs font-bold text-purple-600">{sectionIndex + 1}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <h5 className="text-sm font-medium text-gray-900 truncate">
                                            {section.title}
                                          </h5>
                                          {section.description && (
                                            <p className="text-xs text-gray-600 truncate mt-1">
                                              {section.description}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center space-x-3 text-xs text-gray-500">
                                        <div className="flex items-center">
                                          <Video className="w-3 h-3 mr-1" />
                                          <span>{section.lessons?.length || 0} lessons</span>
                                        </div>
                                        <div className={`px-2 py-1 rounded-full font-medium ${
                                          section.isPublished 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                          {section.isPublished ? 'Published' : 'Draft'}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Section Lessons */}
                                    {expandedSections.has(section._id) && section.lessons && section.lessons.length > 0 && (
                                      <div className="bg-white border-l-4 border-purple-200 ml-8">
                                        {section.lessons.map((lesson, lessonIndex) => (
                                          <div key={lesson._id} className="flex items-center p-3 border-b border-gray-50 last:border-b-0 ml-4">
                                            <div className="flex items-center space-x-3 flex-1">
                                              <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                                                <Play className="w-2.5 h-2.5 text-green-600" />
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <h6 className="text-sm font-medium text-gray-900 truncate">
                                                  {lesson.title}
                                                </h6>
                                                {lesson.description && (
                                                  <p className="text-xs text-gray-600 truncate mt-1">
                                                    {lesson.description}
                                                  </p>
                                                )}
                                              </div>
                                            </div>
                                            <div className="flex items-center space-x-3 text-xs text-gray-500">
                                              {lesson.duration && (
                                                <div className="flex items-center">
                                                  <Clock className="w-3 h-3 mr-1" />
                                                  <span>{lesson.duration}min</span>
                                                </div>
                                              )}
                                              <div className={`px-2 py-1 rounded-full font-medium ${
                                                lesson.isPublished 
                                                  ? 'bg-green-100 text-green-800' 
                                                  : 'bg-yellow-100 text-yellow-800'
                                              }`}>
                                                {lesson.isPublished ? 'Published' : 'Draft'}
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No modules available</p>
              )}
            </div>
          </div>
        );

      case 'subscribers':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Subscribers</h2>
            
            {/* Subscribers List */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Enrolled Students</h3>
              {course.enrollments && course.enrollments.length > 0 ? (
                <ul className="space-y-3">
                  {course.enrollments.map((student, index) => (
                    <li key={student._id} className="flex items-center justify-between p-3 border-b border-gray-200 last:border-b-0">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <User className="w-6 h-6 text-gray-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {student.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {student.email}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium rounded-full px-3 py-1 bg-green-100 text-green-800">
                          Enrolled
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No students enrolled yet</p>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Toggle module expansion
  const toggleModule = (moduleId) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
      // Also collapse all sections in this module
      const moduleExpanded = new Set(expandedSections);
      course.modules.find(m => m._id === moduleId)?.sections?.forEach(section => {
        moduleExpanded.delete(section._id);
      });
      setExpandedSections(moduleExpanded);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  // Toggle section expansion
  const toggleSection = (sectionId) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handleManageModuleContent = (module) => {
    setSelectedModule(module);
    setShowContentManager(true);
  };

  const handleContentUpdate = (updatedCourse) => {
    // Update the course data and refresh the view
    onEdit(updatedCourse);
  };

  // If content manager is shown, render it
  if (showContentManager && selectedModule) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Content Manager</h2>
                <p className="text-gray-600">{course.title}</p>
              </div>
            </div>
            <button
              onClick={() => setShowContentManager(false)}
              className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Content Manager */}
          {/* <div className="flex-1 overflow-y-auto p-6">
            <ModuleContentManager
              module={selectedModule}
              courseId={course._id}
              onContentUpdate={handleContentUpdate}
              onEditItem={() => {}} // TODO: Implement edit handlers
              onDeleteItem={() => {}} // TODO: Implement delete handlers
              onAddSection={() => {}} // TODO: Implement add handlers
              onAddLesson={() => {}} // TODO: Implement add handlers
            />
          </div> */}

          {/* Footer */}
          <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={() => setShowContentManager(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back to Course Details
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 ${isFullscreen ? 'p-0' : 'p-4'}`}>
      <div className={`bg-gray-50 shadow-2xl flex ${isFullscreen ? 'w-full h-full' : 'w-full max-w-7xl h-[95vh] mx-auto my-auto rounded-2xl overflow-hidden'}`}>
        {/* Sidebar Navigation */}
        <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 truncate">Course Details</h3>
                  <p className="text-xs text-gray-500">Management Panel</p>
                </div>
              </div>
              
              {/* Fullscreen Toggle Button */}
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Navigation */}
          <div className="p-4 flex-1">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-600 border border-blue-200'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                    {activeTab === tab.id && (
                      <ArrowRight className="w-3 h-3 ml-auto" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Quick Actions */}
          <div className="p-4 border-t border-gray-200 flex-shrink-0">
            <div className="space-y-2">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Course</span>
              </button>
              <button
                onClick={onClose}
                className="w-full flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Close Panel</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 h-full">
          {/* Content Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => {
                    const currentIndex = tabs.findIndex(s => s.id === activeTab);
                    const prevIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
                    setActiveTab(tabs[prevIndex].id);
                  }}
                  className="p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h2 className="font-semibold text-gray-900">
                    {tabs.find(s => s.id === activeTab)?.label}
                  </h2>
                  <p className="text-sm text-gray-500 truncate max-w-96">{course.title}</p>
                </div>
              </div>
              
              {/* Header Actions */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    onEdit(course);
                    onClose();
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                
                <button
                  onClick={() => {
                    const currentIndex = tabs.findIndex(s => s.id === activeTab);
                    const nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
                    setActiveTab(tabs[nextIndex].id);
                  }}
                  className="p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 min-h-0 overflow-y-auto p-6">
            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'overview' && <CourseOverviewTab course={course} />}
              {activeTab === 'content' && <CourseContentTab course={course} />}
              {activeTab === 'subscribers' && (
                <div>
                  <CourseSubscribersTab course={course} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-md w-full">
            <div className="p-6">
              <div className="flex items-start space-x-4 mb-6">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900">Delete Course</h3>
                  <p className="text-gray-600 mt-1">This action cannot be undone</p>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800 text-sm">
                  Are you sure you want to delete &quot;<strong className="font-semibold">{course.title}</strong>&quot;? 
                  This will permanently remove the course and all associated modules.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm font-medium"
                >
                  {deleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Course</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
