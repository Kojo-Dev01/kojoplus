'use client';

import React, { useState } from 'react';
import { X, Edit, Trash2, Download, Eye, Play, ExternalLink, FileText, BookOpen, Headphones, Presentation, Wrench, FileImage, Calendar, User, Tag, Globe, Users, Crown, Lock, BarChart3, Clock, Shield, ArrowRight, ArrowLeft, Maximize2, Minimize2, TrendingUp } from 'lucide-react';

const RESOURCE_TYPE_ICONS = {
  video: Play,
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

const DIFFICULTY_COLORS = {
  beginner: 'bg-green-100 text-green-800',
  intermediate: 'bg-yellow-100 text-yellow-800',
  advanced: 'bg-orange-100 text-orange-800',
  expert: 'bg-red-100 text-red-800'
};

export default function ResourceDetailsModal({ isOpen, onClose, resource, onEdit, onDelete }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [isFullscreen, setIsFullscreen] = useState(false); // Start in windowed mode

  if (!isOpen || !resource) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const result = await onDelete(resource);
      if (result?.success !== false) {
        setShowDeleteConfirm(false);
        onClose();
      }
    } catch (error) {
      console.error('Error deleting resource:', error);
    } finally {
      setDeleting(false);
    }
  };

  const getYouTubeVideoId = (url) => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const getVimeoVideoId = (url) => {
    const regex = /vimeo\.com\/(\d+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const renderResourceContent = () => {
    const TypeIcon = RESOURCE_TYPE_ICONS[resource.type] || FileText;

    switch (resource.type) {
      case 'video':
        if (resource.url) {
          const youtubeId = getYouTubeVideoId(resource.url);
          const vimeoId = getVimeoVideoId(resource.url);

          if (youtubeId) {
            return (
              <div className="aspect-video rounded-lg overflow-hidden bg-black">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  title={resource.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            );
          } else if (vimeoId) {
            return (
              <div className="aspect-video rounded-lg overflow-hidden bg-black">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://player.vimeo.com/video/${vimeoId}`}
                  title={resource.title}
                  frameBorder="0"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            );
          } else {
            return (
              <div className="aspect-video rounded-lg overflow-hidden bg-gray-900 flex items-center justify-center">
                <video
                  controls
                  className="w-full h-full object-contain"
                  src={resource.fileUrl || resource.url}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            );
          }
        } else if (resource.fileUrl) {
          return (
            <div className="aspect-video rounded-lg overflow-hidden bg-gray-900 flex items-center justify-center">
              <video
                controls
                className="w-full h-full object-contain"
                src={resource.fileUrl}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          );
        } else {
          return (
            <div className="aspect-video rounded-lg bg-gray-100 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Play className="w-16 h-16 mx-auto mb-4" />
                <p>Video content not available</p>
              </div>
            </div>
          );
        }

      case 'podcast':
        if (resource.fileUrl || resource.url) {
          return (
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Headphones className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{resource.title}</h4>
                  {resource.duration && (
                    <p className="text-sm text-gray-600">Duration: {resource.duration}</p>
                  )}
                </div>
              </div>
              <audio controls className="w-full">
                <source src={resource.fileUrl || resource.url} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </div>
          );
        }
        break;

      case 'article':
        if (resource.content) {
          return (
            <div className="prose max-w-none">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="whitespace-pre-wrap text-gray-900 leading-relaxed">
                  {resource.content}
                </div>
              </div>
            </div>
          );
        }
        break;

      case 'infographic':
      case 'ebook':
      case 'template':
        if (resource.fileUrl) {
          return (
            <div className="text-center bg-gray-50 rounded-lg p-8">
              <div className="w-20 h-20 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TypeIcon className="w-10 h-10 text-blue-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">{resource.title}</h4>
              <p className="text-gray-600 mb-4">
                {resource.fileName && `File: ${resource.fileName}`}
                {resource.fileSize && ` (${(resource.fileSize / (1024 * 1024)).toFixed(2)} MB)`}
              </p>
              <div className="flex justify-center space-x-4">
                <a
                  href={resource.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View
                </a>
                <a
                  href={resource.fileUrl}
                  download={resource.fileName}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </a>
              </div>
            </div>
          );
        }
        break;

      case 'tool':
        if (resource.url) {
          return (
            <div className="text-center bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-8 border border-purple-200">
              <div className="w-20 h-20 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Wrench className="w-10 h-10 text-purple-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">{resource.title}</h4>
              <p className="text-gray-600 mb-4">Access the trading tool or calculator</p>
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Tool
              </a>
            </div>
          );
        }
        break;

      default:
        break;
    }

    // Fallback content
    return (
      <div className="text-center bg-gray-50 rounded-lg p-8">
        <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
          <TypeIcon className="w-10 h-10 text-gray-400" />
        </div>
        <h4 className="text-lg font-semibold text-gray-900 mb-2">{resource.title}</h4>
        <p className="text-gray-600">Content preview not available</p>
        {resource.url && (
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open Resource
          </a>
        )}
      </div>
    );
  };

  const AccessIcon = ACCESS_LEVEL_ICONS[resource.accessLevel] || Globe;
  const TypeIcon = RESOURCE_TYPE_ICONS[resource.type] || FileText;

  const sections = [
    { id: 'overview', label: 'Overview', icon: Eye },
    { id: 'content', label: 'Content', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Shield },
    { id: 'activity', label: 'Activity', icon: Clock }
  ];

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-8">
            {/* Minimalist Hero Section */}
            <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 rounded-xl overflow-hidden">
              <div className="absolute inset-0 bg-black/10"></div>
              
              {/* Subtle Background Pattern */}
              <div className="absolute top-0 right-0 w-64 h-64 opacity-5">
                <div className="w-full h-full bg-gradient-to-br from-white to-transparent rounded-full blur-2xl"></div>
              </div>
              
              <div className="relative z-10 p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Simple Icon */}
                    <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <TypeIcon className="w-8 h-8 text-white" />
                    </div>
                    
                    {/* Title and Metadata */}
                    <div className="flex-1 min-w-0">
                      <h1 className="text-2xl font-bold mb-3 text-white leading-tight">
                        {resource.title}
                      </h1>
                      
                      {/* Clean Status Badges */}
                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        <span className="px-3 py-1 text-sm font-medium rounded-full bg-white/20 backdrop-blur-sm border border-white/10 text-white/90">
                          {resource.difficulty}
                        </span>
                        
                        <span className="px-3 py-1 text-sm font-medium rounded-full bg-white/10 backdrop-blur-sm text-white/80 uppercase tracking-wide">
                          {resource.type}
                        </span>
                        
                        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
                          resource.isPublished 
                            ? 'bg-white/20 border-white/20' 
                            : 'bg-white/10 border-white/10'
                        } border`}>
                          <div className={`w-2 h-2 rounded-full ${
                            resource.isPublished ? 'bg-green-300' : 'bg-yellow-300'
                          }`}></div>
                          <span className="text-sm font-medium text-white/80">
                            {resource.isPublished ? 'Published' : 'Draft'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Description */}
                      <p className="text-white/80 text-base leading-relaxed max-w-2xl">
                        {resource.description}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Clean Actions Bar */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <div className="flex items-center space-x-4 text-white/70 text-sm">
                    <div className="flex items-center space-x-2">
                      <AccessIcon className="w-4 h-4" />
                      <span>{resource.accessLevel}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>{resource.author || 'Kojo Team'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(resource.createdAt)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {(resource.url || resource.fileUrl) && (
                      <>
                        {resource.url && (
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 px-3 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-colors text-white/90 hover:text-white text-sm"
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span>Open</span>
                          </a>
                        )}
                        {resource.fileUrl && (
                          <a
                            href={resource.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 px-3 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-colors text-white/90 hover:text-white text-sm"
                          >
                            <Download className="w-4 h-4" />
                            <span>Download</span>
                          </a>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Minimal Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Views', value: resource.views || 0, icon: Eye },
                { label: 'Downloads', value: resource.downloads || 0, icon: Download },
                { label: 'Popularity', value: resource.popularityScore || 0, icon: BarChart3 },
                { label: 'Rating', value: '4.8', icon: TrendingUp }
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

            {/* Clean Information Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Resource Information */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Resource Information</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Author</span>
                    <span className="text-sm text-gray-900">{resource.author || 'Kojo Team'}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Category</span>
                    <span className="text-sm text-gray-900 capitalize">{resource.category.replace('-', ' ')}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Created</span>
                    <span className="text-sm text-gray-900">{formatDate(resource.createdAt)}</span>
                  </div>
                  
                  {resource.duration && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">Duration</span>
                      <span className="text-sm text-gray-900">{resource.duration}</span>
                    </div>
                  )}
                  
                  {resource.fileSize && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm font-medium text-gray-600">File Size</span>
                      <span className="text-sm text-gray-900">
                        {(resource.fileSize / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Access & Status */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Access & Status</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Access Level</span>
                    <div className="flex items-center space-x-2">
                      <AccessIcon className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-900 capitalize">
                        {resource.isPremium ? 'Premium' : resource.accessLevel}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Status</span>
                    <span className={`text-sm font-medium ${
                      resource.isPublished ? 'text-gray-900' : 'text-gray-600'
                    }`}>
                      {resource.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Type</span>
                    <span className="text-sm text-gray-900 capitalize">{resource.type}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-medium text-gray-600">Last Modified</span>
                    <span className="text-sm text-gray-900">
                      {formatDate(resource.updatedAt || resource.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags Section */}
            {resource.tags && resource.tags.length > 0 && (
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Tags</h3>
                  <span className="text-sm text-gray-500">
                    {resource.tags.length} tag{resource.tags.length !== 1 ? 's' : ''}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {resource.tags.map((tag, index) => (
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
              <h2 className="text-2xl font-bold text-gray-900">Content Preview</h2>
              {(resource.url || resource.fileUrl) && (
                <div className="flex space-x-3">
                  {resource.url && (
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Open Link</span>
                    </a>
                  )}
                  {resource.fileUrl && (
                    <a
                      href={resource.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </a>
                  )}
                </div>
              )}
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-6">
                {renderResourceContent()}
              </div>
            </div>

            {/* Tags Section */}
            {resource.tags && resource.tags.length > 0 && (
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {resource.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm"
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* SEO Section */}
            {resource.metaDescription && (
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">SEO Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Meta Description</label>
                    <p className="text-gray-900 mt-1">{resource.metaDescription}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Performance Analytics</h2>
            
            {/* Performance Chart Placeholder */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Views Over Time</h3>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">Analytics chart would appear here</p>
                  <p className="text-sm text-gray-500">Integration with analytics service required</p>
                </div>
              </div>
            </div>

            {/* Engagement Metrics */}
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">Engagement Rate</h4>
                <div className="text-3xl font-bold text-blue-600 mb-1">--</div>
                <p className="text-sm text-gray-600">Coming soon</p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">Average Time</h4>
                <div className="text-3xl font-bold text-green-600 mb-1">--</div>
                <p className="text-sm text-gray-600">Coming soon</p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">Bounce Rate</h4>
                <div className="text-3xl font-bold text-orange-600 mb-1">--</div>
                <p className="text-sm text-gray-600">Coming soon</p>
              </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Resource Settings</h2>
            
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Current Configuration</h3>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Publication Status</label>
                    <div className="mt-1">
                      <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                        resource.isPublished 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {resource.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Access Control</label>
                    <div className="mt-1">
                      <span className="inline-flex items-center space-x-2">
                        <AccessIcon className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-900 capitalize">
                          {resource.isPremium ? 'Premium' : resource.accessLevel}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Resource Type</label>
                    <div className="mt-1">
                      <span className="text-gray-900 capitalize">{resource.type}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Category</label>
                    <div className="mt-1">
                      <span className="text-gray-900 capitalize">{resource.category.replace('-', ' ')}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    onEdit(resource);
                    onClose();
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit Settings</span>
                </button>
              </div>
            </div>
          </div>
        );

      case 'activity':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Activity Timeline</h2>
            
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="space-y-6">
                {/* Timeline Items */}
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-3"></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">Resource Created</h4>
                      <span className="text-sm text-gray-500">{formatDate(resource.createdAt)}</span>
                    </div>
                    <p className="text-gray-600 text-sm mt-1">Resource was created by {resource.author || 'Kojo Team'}</p>
                  </div>
                </div>
                
                {resource.publishedAt && (
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-3"></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">Resource Published</h4>
                        <span className="text-sm text-gray-500">{formatDate(resource.publishedAt)}</span>
                      </div>
                      <p className="text-gray-600 text-sm mt-1">Made available to users</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-2 h-2 bg-gray-300 rounded-full mt-3"></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">Last Updated</h4>
                      <span className="text-sm text-gray-500">{formatDate(resource.updatedAt || resource.createdAt)}</span>
                    </div>
                    <p className="text-gray-600 text-sm mt-1">Resource information was last modified</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 ${isFullscreen ? 'p-0' : 'p-4'}`}>
        <div className={`bg-gray-800 shadow-2xl flex ${isFullscreen ? 'w-full h-full' : 'w-full max-w-7xl h-[95vh] mx-auto my-auto rounded-2xl overflow-hidden'}`}>
          {/* Sidebar Navigation */}
          <div className="w-64 bg-gray-900 border-r border-gray-700 flex-shrink-0 flex flex-col h-full">
            {/* Header */}
            <div className="p-6 border-b border-gray-700 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
                    <TypeIcon className="w-4 h-4 text-gray-300" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white truncate">Resource Details</h3>
                    <p className="text-xs text-gray-400">Management Panel</p>
                  </div>
                </div>
                
                {/* Fullscreen Toggle Button */}
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded-lg transition-colors"
                  title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Navigation */}
            <div className="p-4 flex-1">
              <nav className="space-y-1">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeSection === section.id
                          ? 'bg-blue-900/50 text-blue-300 border border-blue-700/50'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{section.label}</span>
                      {activeSection === section.id && (
                        <ArrowRight className="w-3 h-3 ml-auto" />
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Quick Actions - Fixed at bottom */}
            <div className="p-4 border-t border-gray-700 flex-shrink-0">
              <div className="space-y-2">
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-red-400 hover:bg-red-900/20 rounded-lg text-sm font-medium transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Resource</span>
                </button>
                <button
                  onClick={onClose}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-gray-400 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
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
            <div className="bg-gray-900 border-b border-gray-700 px-6 py-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => {
                      const currentIndex = sections.findIndex(s => s.id === activeSection);
                      const prevIndex = currentIndex > 0 ? currentIndex - 1 : sections.length - 1;
                      setActiveSection(sections[prevIndex].id);
                    }}
                    className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <h2 className="font-semibold text-white">
                      {sections.find(s => s.id === activeSection)?.label}
                    </h2>
                    <p className="text-sm text-gray-400 truncate max-w-96">{resource.title}</p>
                  </div>
                </div>
                
                {/* Header Actions */}
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {
                      onEdit(resource);
                      onClose();
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      const currentIndex = sections.findIndex(s => s.id === activeSection);
                      const nextIndex = currentIndex < sections.length - 1 ? currentIndex + 1 : 0;
                      setActiveSection(sections[nextIndex].id);
                    }}
                    className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content Area - Always takes remaining height */}
            <div className="flex-1 min-h-0 overflow-y-auto p-6 bg-gray-800">
              {renderSectionContent()}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-60 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 max-w-md w-full">
            <div className="p-6">
              <div className="flex items-start space-x-4 mb-6">
                <div className="w-10 h-10 bg-red-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-white">Delete Resource</h3>
                  <p className="text-gray-300 mt-1">This action cannot be undone</p>
                </div>
              </div>

              <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 mb-6">
                <p className="text-red-300 text-sm">
                  Are you sure you want to delete &quot;<strong className="font-semibold">{resource.title}</strong>&quot;? 
                  This will permanently remove the resource and all associated data.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
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
                      <span>Delete Resource</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
