'use client';

import { useState, useEffect } from 'react';
import { X, Upload, Image as ImageIcon, Save, FileText, Video, Headphones, BookOpen, Wrench, FileImage, Presentation, ChevronDown, CheckCircle } from 'lucide-react';

const RESOURCE_TYPES = [
  { value: 'video', label: 'Video', icon: Video, description: 'YouTube, Vimeo, or uploaded video content' },
  { value: 'article', label: 'Article', icon: FileText, description: 'Written content, blog posts, guides' },
  { value: 'ebook', label: 'E-book', icon: BookOpen, description: 'PDF books, guides, manuals' },
  { value: 'webinar', label: 'Webinar', icon: Presentation, description: 'Live or recorded webinar sessions' },
  { value: 'podcast', label: 'Podcast', icon: Headphones, description: 'Audio content and episodes' },
  { value: 'infographic', label: 'Infographic', icon: FileImage, description: 'Visual data presentations' },
  { value: 'tool', label: 'Tool', icon: Wrench, description: 'Calculators, converters, utilities' },
  { value: 'template', label: 'Template', icon: FileText, description: 'Trading templates, spreadsheets' },
  { value: 'course', label: 'Course', icon: BookOpen, description: 'Multi-part educational content' }
];

const CATEGORIES = [
  { value: 'trading', label: 'Trading', description: 'Live trading, strategies, signals' },
  { value: 'analysis', label: 'Analysis', description: 'Technical and fundamental analysis' },
  { value: 'education', label: 'Education', description: 'Learning materials, tutorials' },
  { value: 'strategy', label: 'Strategy', description: 'Trading strategies and methodologies' },
  { value: 'market-news', label: 'Market News', description: 'Market updates and news' },
  { value: 'tutorial', label: 'Tutorial', description: 'Step-by-step guides' },
  { value: 'beginner', label: 'Beginner', description: 'Entry-level content' },
  { value: 'advanced', label: 'Advanced', description: 'Expert-level content' },
  { value: 'tools', label: 'Tools', description: 'Trading tools and utilities' },
  { value: 'general', label: 'General', description: 'General forex content' }
];

const DIFFICULTY_LEVELS = [
  { value: 'beginner', label: 'Beginner', color: 'text-green-600' },
  { value: 'intermediate', label: 'Intermediate', color: 'text-yellow-600' },
  { value: 'advanced', label: 'Advanced', color: 'text-orange-600' },
  { value: 'expert', label: 'Expert', color: 'text-red-600' }
];

const ACCESS_LEVELS = [
  { value: 'public', label: 'Public', description: 'Available to everyone' },
  { value: 'members', label: 'Members Only', description: 'Registered users only' },
  { value: 'premium', label: 'Premium', description: 'Premium subscribers only' },
  { value: 'admin', label: 'Admin Only', description: 'Internal use only' }
];

export default function EditResourceModal({ isOpen, onClose, onSuccess, resource }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'article',
    category: 'general',
    url: '',
    content: '',
    duration: '',
    difficulty: 'beginner',
    author: '',
    isPremium: false,
    accessLevel: 'public',
    isPublished: false,
    metaDescription: '',
    tags: ''
  });
  const [selectedThumbnail, setSelectedThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('basic');

  // Custom dropdown states
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showDifficultyDropdown, setShowDifficultyDropdown] = useState(false);
  const [showAccessLevelDropdown, setShowAccessLevelDropdown] = useState(false);

  // Update form data when resource prop changes
  useEffect(() => {
    if (resource) {
      setFormData({
        title: resource.title || '',
        description: resource.description || '',
        type: resource.type || 'article',
        category: resource.category || 'general',
        url: resource.url || '',
        content: resource.content || '',
        duration: resource.duration || '',
        difficulty: resource.difficulty || 'beginner',
        author: resource.author || '',
        isPremium: resource.isPremium || false,
        accessLevel: resource.accessLevel || 'public',
        isPublished: resource.isPublished || false,
        metaDescription: resource.metaDescription || '',
        tags: resource.tags ? resource.tags.join(', ') : ''
      });
    }
  }, [resource]);

  const handleThumbnailSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Thumbnail must be an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Thumbnail size must be less than 5MB');
        return;
      }

      setSelectedThumbnail(file);
      setError('');

      // Create preview URL
      const url = URL.createObjectURL(file);
      setThumbnailPreview(url);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Title and description are required');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const submitFormData = new FormData();
      
      // Basic fields
      submitFormData.append('title', formData.title.trim());
      submitFormData.append('description', formData.description.trim());
      submitFormData.append('type', formData.type);
      submitFormData.append('category', formData.category);
      submitFormData.append('difficulty', formData.difficulty);
      submitFormData.append('accessLevel', formData.accessLevel);
      submitFormData.append('isPremium', formData.isPremium);
      submitFormData.append('isPublished', formData.isPublished);

      // Optional fields
      if (formData.url.trim()) submitFormData.append('url', formData.url.trim());
      if (formData.content.trim()) submitFormData.append('content', formData.content.trim());
      if (formData.duration.trim()) submitFormData.append('duration', formData.duration.trim());
      if (formData.author.trim()) submitFormData.append('author', formData.author.trim());
      if (formData.metaDescription.trim()) submitFormData.append('metaDescription', formData.metaDescription.trim());

      // Process tags
      if (formData.tags.trim()) {
        const tags = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        submitFormData.append('tags', JSON.stringify(tags));
      }

      // Thumbnail upload
      if (selectedThumbnail) {
        submitFormData.append('thumbnail', selectedThumbnail);
      }

      const response = await fetch(`/api/resources/${resource._id}`, {
        method: 'PATCH',
        credentials: 'include', // Use cookies for authentication
        body: submitFormData
      });

      if (response.ok) {
        setSelectedThumbnail(null);
        setThumbnailPreview(null);
        setActiveTab('basic');
        onSuccess();
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || errorData.message || 'Failed to update resource');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error updating resource:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setSelectedThumbnail(null);
      setThumbnailPreview(null);
      setError('');
      setActiveTab('basic');
      onClose();
    }
  };

  if (!isOpen || !resource) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 max-w-4xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex-shrink-0 bg-gradient-to-r from-gray-700 to-gray-600 px-6 py-4 border-b border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-white">Edit Resource</h3>
              <p className="text-gray-300 mt-1">Update resource information and content</p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-200"
              disabled={submitting}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-6 mt-4 bg-red-900/20 border border-red-800 rounded-lg p-3">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1">
          {/* Tab Navigation */}
          <div className="px-6 pt-4">
            <div className="flex space-x-1 bg-gray-700 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setActiveTab('basic')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'basic'
                    ? 'bg-gray-600 text-blue-300 shadow-sm'
                    : 'text-gray-300 hover:text-gray-100'
                }`}
              >
                Basic Info
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('content')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'content'
                    ? 'bg-gray-600 text-blue-300 shadow-sm'
                    : 'text-gray-300 hover:text-gray-100'
                }`}
              >
                Content
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'settings'
                    ? 'bg-gray-600 text-blue-300 shadow-sm'
                    : 'text-gray-300 hover:text-gray-100'
                }`}
              >
                Settings & SEO
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6 space-y-6">
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                {/* Current Thumbnail Display */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Current Thumbnail</label>
                  <div className="flex items-center space-x-4">
                    {resource.thumbnailUrl && (
                      <img
                        src={resource.thumbnailUrl}
                        alt="Current thumbnail"
                        className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                      />
                    )}
                    {thumbnailPreview && (
                      <div className="relative">
                        <img
                          src={thumbnailPreview}
                          alt="New thumbnail"
                          className="w-20 h-20 object-cover rounded-lg border-2 border-blue-500"
                        />
                        <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                          New
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Thumbnail Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Update Thumbnail (Optional)</label>
                  <div className="border-2 border-dashed border-gray-600 rounded-xl p-4 text-center hover:border-gray-500 transition-colors">
                    <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <div className="text-gray-400 mb-2">
                      <label htmlFor="thumbnail-upload" className="cursor-pointer text-blue-400 hover:text-blue-300 font-medium">
                        Upload new thumbnail
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                    <input
                      id="thumbnail-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailSelect}
                      className="hidden"
                      disabled={submitting}
                    />
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-600 bg-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
                    placeholder="Enter resource title..."
                    maxLength={200}
                    disabled={submitting}
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    {formData.title.length}/200 characters
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-600 bg-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 resize-none"
                    rows="4"
                    placeholder="Describe what this resource covers..."
                    maxLength={2000}
                    disabled={submitting}
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    {formData.description.length}/2000 characters
                  </div>
                </div>

                {/* Type and Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Custom Type Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                    <div className="relative">
                      <button
                        type="button"
                        className="relative w-full bg-gray-700 border border-gray-600 rounded-xl shadow-sm pl-3 pr-10 py-3 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                        disabled={submitting}
                      >
                        <span className="block truncate font-medium text-white">
                          {RESOURCE_TYPES.find(t => t.value === formData.type)?.label || 'Select Type'}
                        </span>
                        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                          <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${showTypeDropdown ? 'rotate-180' : ''}`} />
                        </span>
                      </button>

                      {showTypeDropdown && (
                        <>
                          <div 
                            className="fixed inset-0 z-10"
                            onClick={() => setShowTypeDropdown(false)}
                          />
                          <div className="absolute z-20 mt-1 w-full bg-gray-800 shadow-lg max-h-60 rounded-xl py-1 ring-1 ring-gray-600 ring-opacity-5 overflow-auto focus:outline-none">
                            {RESOURCE_TYPES.map((type) => {
                              const IconComponent = type.icon;
                              return (
                                <button
                                  key={type.value}
                                  type="button"
                                  className={`w-full text-left relative cursor-pointer select-none py-3 pl-3 pr-9 hover:bg-gray-700 transition-colors ${
                                    formData.type === type.value 
                                      ? 'bg-blue-900/50 text-blue-300 font-semibold' 
                                      : 'text-gray-300 font-medium hover:text-white'
                                  }`}
                                  onClick={() => {
                                    setFormData(prev => ({ ...prev, type: type.value }));
                                    setShowTypeDropdown(false);
                                  }}
                                >
                                  <div className="flex items-center space-x-3">
                                    <IconComponent className="w-4 h-4 text-gray-400" />
                                    <div>
                                      <div className="font-medium">{type.label}</div>
                                      <div className="text-xs text-gray-500 mt-1">{type.description}</div>
                                    </div>
                                  </div>
                                  {formData.type === type.value && (
                                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-blue-400">
                                      <CheckCircle className="h-4 w-4" />
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Custom Category Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                    <div className="relative">
                      <button
                        type="button"
                        className="relative w-full bg-gray-700 border border-gray-600 rounded-xl shadow-sm pl-3 pr-10 py-3 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                        disabled={submitting}
                      >
                        <span className="block truncate font-medium text-white">
                          {CATEGORIES.find(c => c.value === formData.category)?.label || 'Select Category'}
                        </span>
                        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                          <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${showCategoryDropdown ? 'rotate-180' : ''}`} />
                        </span>
                      </button>

                      {showCategoryDropdown && (
                        <>
                          <div 
                            className="fixed inset-0 z-10"
                            onClick={() => setShowCategoryDropdown(false)}
                          />
                          <div className="absolute z-20 mt-1 w-full bg-gray-800 shadow-lg max-h-60 rounded-xl py-1 ring-1 ring-gray-600 ring-opacity-5 overflow-auto focus:outline-none">
                            {CATEGORIES.map((category) => (
                              <button
                                key={category.value}
                                type="button"
                                className={`w-full text-left relative cursor-pointer select-none py-3 pl-3 pr-9 hover:bg-gray-700 transition-colors ${
                                  formData.category === category.value 
                                    ? 'bg-blue-900/50 text-blue-300 font-semibold' 
                                    : 'text-gray-300 font-medium hover:text-white'
                                }`}
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, category: category.value }));
                                  setShowCategoryDropdown(false);
                                }}
                              >
                                <div>
                                  <div className="font-medium">{category.label}</div>
                                  <div className="text-xs text-gray-500 mt-1">{category.description}</div>
                                </div>
                                {formData.category === category.value && (
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

                {/* Difficulty and Author */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Custom Difficulty Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty Level</label>
                    <div className="relative">
                      <button
                        type="button"
                        className="relative w-full bg-gray-700 border border-gray-600 rounded-xl shadow-sm pl-3 pr-10 py-3 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        onClick={() => setShowDifficultyDropdown(!showDifficultyDropdown)}
                        disabled={submitting}
                      >
                        <span className="block truncate font-medium text-white">
                          {DIFFICULTY_LEVELS.find(d => d.value === formData.difficulty)?.label || 'Select Difficulty'}
                        </span>
                        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                          <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${showDifficultyDropdown ? 'rotate-180' : ''}`} />
                        </span>
                      </button>

                      {showDifficultyDropdown && (
                        <>
                          <div 
                            className="fixed inset-0 z-10"
                            onClick={() => setShowDifficultyDropdown(false)}
                          />
                          <div className="absolute z-20 mt-1 w-full bg-gray-800 shadow-lg max-h-60 rounded-xl py-1 ring-1 ring-gray-600 ring-opacity-5 overflow-auto focus:outline-none">
                            {DIFFICULTY_LEVELS.map((level) => (
                              <button
                                key={level.value}
                                type="button"
                                className={`w-full text-left relative cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-gray-700 transition-colors ${
                                  formData.difficulty === level.value 
                                    ? 'bg-blue-900/50 text-blue-300 font-semibold' 
                                    : 'text-gray-300 font-medium hover:text-white'
                                }`}
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, difficulty: level.value }));
                                  setShowDifficultyDropdown(false);
                                }}
                              >
                                <span className={`block truncate ${level.color}`}>{level.label}</span>
                                {formData.difficulty === level.value && (
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

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Author</label>
                    <input
                      type="text"
                      value={formData.author}
                      onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-600 bg-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
                      placeholder="Author name"
                      disabled={submitting}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Content Tab */}
            {activeTab === 'content' && (
              <div className="space-y-6">
                {/* URL Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {formData.type === 'video' ? 'Video URL (YouTube, Vimeo, etc.)' : 'External URL'}
                  </label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-600 bg-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
                    placeholder={formData.type === 'video' ? 'https://youtube.com/watch?v=...' : 'https://example.com/resource'}
                    disabled={submitting}
                  />
                </div>

                {/* Duration for media types */}
                {(formData.type === 'video' || formData.type === 'podcast' || formData.type === 'webinar') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Duration</label>
                    <input
                      type="text"
                      value={formData.duration}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-600 bg-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
                      placeholder="e.g., 15:30 or 1h 30m"
                      disabled={submitting}
                    />
                  </div>
                )}

                {/* Content Text Area (for articles) */}
                {formData.type === 'article' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Article Content</label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-600 bg-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 resize-none"
                      rows="12"
                      placeholder="Write your article content here..."
                      disabled={submitting}
                    />
                  </div>
                )}

                {/* Current File Info */}
                {resource.fileName && (
                  <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                    <h4 className="font-medium text-blue-300 mb-2">Current File</h4>
                    <p className="text-blue-200 text-sm">
                      <strong>File:</strong> {resource.fileName}
                    </p>
                    {resource.fileSize && (
                      <p className="text-blue-200 text-sm mt-1">
                        <strong>Size:</strong> {(resource.fileSize / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    )}
                    <p className="text-blue-300 text-xs mt-2">
                      Note: To change the file, please create a new resource or contact support.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Settings & SEO Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                {/* Custom Access Level Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Access Level</label>
                  <div className="relative">
                    <button
                      type="button"
                      className="relative w-full bg-gray-700 border border-gray-600 rounded-xl shadow-sm pl-3 pr-10 py-3 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      onClick={() => setShowAccessLevelDropdown(!showAccessLevelDropdown)}
                      disabled={submitting}
                    >
                      <div className="flex items-center">
                        <span className="block truncate font-medium text-white">
                          {ACCESS_LEVELS.find(a => a.value === formData.accessLevel)?.label || 'Select Access Level'}
                        </span>
                      </div>
                      <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${showAccessLevelDropdown ? 'rotate-180' : ''}`} />
                      </span>
                    </button>

                    {showAccessLevelDropdown && (
                      <>
                        <div 
                          className="fixed inset-0 z-10"
                          onClick={() => setShowAccessLevelDropdown(false)}
                        />
                        <div className="absolute z-20 mt-1 w-full bg-gray-800 shadow-lg max-h-60 rounded-xl py-1 ring-1 ring-gray-600 ring-opacity-5 overflow-auto focus:outline-none">
                          {ACCESS_LEVELS.map((level) => (
                            <button
                              key={level.value}
                              type="button"
                              className={`w-full text-left relative cursor-pointer select-none py-3 pl-3 pr-9 hover:bg-gray-700 transition-colors ${
                                formData.accessLevel === level.value 
                                  ? 'bg-blue-900/50 text-blue-300 font-semibold' 
                                  : 'text-gray-300 font-medium hover:text-white'
                              }`}
                              onClick={() => {
                                setFormData(prev => ({ ...prev, accessLevel: level.value }));
                                setShowAccessLevelDropdown(false);
                              }}
                            >
                              <div>
                                <div className="font-medium">{level.label}</div>
                                <div className="text-sm text-gray-400 mt-1">{level.description}</div>
                              </div>
                              {formData.accessLevel === level.value && (
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

                {/* Premium and Publish Toggles */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-300">Premium Content</label>
                      <p className="text-xs text-gray-400 mt-1">Mark as premium/paid content</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, isPremium: !prev.isPremium }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        formData.isPremium ? 'bg-blue-600' : 'bg-gray-600'
                      }`}
                      disabled={submitting}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.isPremium ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-300">Published</label>
                      <p className="text-xs text-gray-400 mt-1">Make visible to users</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, isPublished: !prev.isPublished }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        formData.isPublished ? 'bg-green-600' : 'bg-gray-600'
                      }`}
                      disabled={submitting}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.isPublished ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-600 bg-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
                    placeholder="forex, trading, beginner, strategy (separated by commas)"
                    disabled={submitting}
                  />
                </div>

                {/* Meta Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">SEO Description</label>
                  <textarea
                    value={formData.metaDescription}
                    onChange={(e) => setFormData(prev => ({ ...prev, metaDescription: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-600 bg-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 resize-none"
                    rows="3"
                    placeholder="Brief description for search engines..."
                    maxLength={300}
                    disabled={submitting}
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    {formData.metaDescription.length}/300 characters
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex-shrink-0 flex space-x-3 p-6 border-t border-gray-600 bg-gray-700">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-6 py-3 border border-gray-600 text-gray-300 rounded-xl hover:bg-gray-600 transition-colors"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !formData.title.trim() || !formData.description.trim()}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Update Resource</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
