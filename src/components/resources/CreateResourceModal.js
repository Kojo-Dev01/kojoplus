'use client';

import { useState } from 'react';
import { X, Upload, Image as ImageIcon, FileText, Video, Headphones, BookOpen, Wrench, FileImage, Presentation, ChevronDown, CheckCircle } from 'lucide-react';

const RESOURCE_TYPES = [
  { value: 'video', label: 'Video', icon: Video, description: 'YouTube, Vimeo, or uploaded video content' },
//   { value: 'article', label: 'Article', icon: FileText, description: 'Written content, blog posts, guides' },
  { value: 'ebook', label: 'E-book', icon: BookOpen, description: 'PDF books, guides, manuals' },
  { value: 'webinar', label: 'Webinar', icon: Presentation, description: 'Live or recorded webinar sessions' },
  { value: 'podcast', label: 'Podcast', icon: Headphones, description: 'Audio content and episodes' },
//   { value: 'infographic', label: 'Infographic', icon: FileImage, description: 'Visual data presentations' },
//   { value: 'tool', label: 'Tool', icon: Wrench, description: 'Calculators, converters, utilities' },
//   { value: 'template', label: 'Template', icon: FileText, description: 'Trading templates, spreadsheets' },
//   { value: 'course', label: 'Course', icon: BookOpen, description: 'Multi-part educational content' }
];

const CATEGORIES = [
  { value: 'trading', label: 'Trading', description: 'Live trading, strategies, signals' },
  { value: 'analysis', label: 'Analysis', description: 'Technical and fundamental analysis' },
//   { value: 'education', label: 'Education', description: 'Learning materials, tutorials' },
  { value: 'strategy', label: 'Strategy', description: 'Trading strategies and methodologies' },
//   { value: 'market-news', label: 'Market News', description: 'Market updates and news' },
  { value: 'tutorial', label: 'Tutorial', description: 'Step-by-step guides' },
//   { value: 'beginner', label: 'Beginner', description: 'Entry-level content' },
//   { value: 'advanced', label: 'Advanced', description: 'Expert-level content' },
//   { value: 'tools', label: 'Tools', description: 'Trading tools and utilities' },
//   { value: 'general', label: 'General', description: 'General forex content' }
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

export default function CreateResourceModal({ isOpen, onClose, onSuccess }) {
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
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedThumbnail, setSelectedThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('basic');

  // Custom dropdown states
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showDifficultyDropdown, setShowDifficultyDropdown] = useState(false);
  const [showAccessLevelDropdown, setShowAccessLevelDropdown] = useState(false);

  // Remove the useTheme hook and replace with simple dark mode state
  const isDarkMode = true; // Changed to true for dark mode

  const selectedResourceType = RESOURCE_TYPES.find(t => t.value === formData.type);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        setError('File size must be less than 100MB');
        return;
      }

      setSelectedFile(file);
      setError('');
    }
  };

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

  const validateContent = () => {
    const { type, url, content } = formData;

    switch (type) {
      case 'video':
        if (!url.trim() && !selectedFile) {
          return 'Please provide either a video URL or upload a video file';
        }
        break;
      case 'article':
        if (!content.trim()) {
          return 'Article content is required for article resources';
        }
        if (content.trim().length < 50) {
          return 'Article content must be at least 50 characters long';
        }
        break;
      case 'podcast':
        if (!url.trim() && !selectedFile) {
          return 'Please provide either an audio URL or upload an audio file';
        }
        break;
      case 'ebook':
      case 'template':
      case 'infographic':
        if (!selectedFile) {
          return `Please upload a file for ${type} resources`;
        }
        break;
      case 'tool':
        if (!url.trim()) {
          return 'Please provide a URL for tool resources';
        }
        break;
      case 'webinar':
        if (!url.trim() && !selectedFile && !content.trim()) {
          return 'Please provide either a webinar URL, upload a file, or add webinar content';
        }
        break;
      case 'course':
        if (!content.trim() && !selectedFile) {
          return 'Please provide course content or upload course materials';
        }
        break;
      default:
        break;
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Title and description are required');
      return;
    }

    // Validate content based on resource type
    const contentValidationError = validateContent();
    if (contentValidationError) {
      setError(contentValidationError);
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

      // File uploads
      if (selectedFile) {
        submitFormData.append('file', selectedFile);
      }
      if (selectedThumbnail) {
        submitFormData.append('thumbnail', selectedThumbnail);
      }

      const response = await fetch('/api/resources', {
        method: 'POST',
        credentials: 'include', // Use cookies for authentication
        body: submitFormData
      });

      if (response.ok) {
        // Reset form
        setFormData({
          title: '',
          description: '',
          type: 'video',
          category: 'trading',
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
        setSelectedFile(null);
        setSelectedThumbnail(null);
        setThumbnailPreview(null);
        setActiveTab('basic');
        onSuccess();
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || errorData.message || 'Failed to create resource');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error creating resource:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setFormData({
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
      setSelectedFile(null);
      setSelectedThumbnail(null);
      setThumbnailPreview(null);
      setError('');
      setActiveTab('basic');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`rounded-2xl shadow-2xl border max-w-4xl w-full max-h-[95vh] overflow-y-auto transition-colors ${
        isDarkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        {/* Header */}
        <div className={`flex-shrink-0 px-6 py-4 border-b transition-colors ${
          isDarkMode 
            ? 'bg-gradient-to-r from-gray-700 to-gray-600 border-gray-600' 
            : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-xl font-semibold ${
                isDarkMode ? 'text-white' : 'text-black'
              }`}>Create New Resource</h3>
              <p className={`mt-1 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>Add educational content to your resource library</p>
            </div>
            <button
              onClick={handleClose}
              className={`transition-colors ${
                isDarkMode 
                  ? 'text-gray-400 hover:text-gray-200' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              disabled={submitting}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className={`mx-6 mt-4 border rounded-lg p-3 ${
            isDarkMode 
              ? 'bg-red-900/20 border-red-800' 
              : 'bg-red-50 border-red-200'
          }`}>
            <p className={`text-sm ${
              isDarkMode ? 'text-red-300' : 'text-red-700'
            }`}>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1">
          {/* Tab Navigation */}
          <div className="px-6 pt-4">
            <div className={`flex space-x-1 rounded-lg p-1 ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <button
                type="button"
                onClick={() => setActiveTab('basic')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'basic'
                    ? isDarkMode
                      ? 'bg-gray-600 text-blue-300 shadow-sm'
                      : 'bg-white text-blue-600 shadow-sm'
                    : isDarkMode
                      ? 'text-gray-300 hover:text-gray-100'
                      : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Basic Info
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('content')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'content'
                    ? isDarkMode
                      ? 'bg-gray-600 text-blue-300 shadow-sm'
                      : 'bg-white text-blue-600 shadow-sm'
                    : isDarkMode
                      ? 'text-gray-300 hover:text-gray-100'
                      : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Content & Files
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'settings'
                    ? isDarkMode
                      ? 'bg-gray-600 text-blue-300 shadow-sm'
                      : 'bg-white text-blue-600 shadow-sm'
                    : isDarkMode
                      ? 'text-gray-300 hover:text-gray-100'
                      : 'text-gray-500 hover:text-gray-700'
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
                {/* Resource Type Selection */}
                <div>
                  <label className={`block text-sm font-medium mb-3 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Resource Type *</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {RESOURCE_TYPES.map((type) => {
                      const IconComponent = type.icon;
                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                          className={`p-4 border-2 rounded-xl transition-colors text-left ${
                            formData.type === type.value
                              ? isDarkMode
                                ? 'border-blue-500 bg-blue-900/20 text-blue-300'
                                : 'border-blue-500 bg-blue-50 text-blue-700'
                              : isDarkMode
                                ? 'border-gray-600 hover:border-gray-500 text-gray-300'
                                : 'border-gray-200 hover:border-gray-300 text-gray-600'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${
                              formData.type === type.value 
                                ? isDarkMode
                                  ? 'bg-blue-800/50'
                                  : 'bg-blue-100'
                                : isDarkMode ? 'bg-gray-600' : 'bg-gray-100'
                            }`}>
                              <IconComponent className={`w-5 h-5 ${
                                formData.type === type.value 
                                  ? isDarkMode
                                    ? 'text-blue-300'
                                    : 'text-blue-600'
                                  : isDarkMode ? 'text-gray-300' : 'text-gray-600'
                              }`} />
                            </div>
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className={`text-xs mt-1 ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-500'
                              }`}>{type.description}</div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Enter resource title..."
                    maxLength={200}
                    disabled={submitting}
                  />
                  <div className={`text-xs mt-1 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {formData.title.length}/200 characters
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    rows="4"
                    placeholder="Describe what this resource covers..."
                    maxLength={2000}
                    disabled={submitting}
                  />
                  <div className={`text-xs mt-1 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {formData.description.length}/2000 characters
                  </div>
                </div>

                {/* Category and Difficulty */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Custom Category Dropdown */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>Category *</label>
                    <div className="relative">
                      <button
                        type="button"
                        className={`relative w-full border rounded-xl shadow-sm pl-3 pr-10 py-3 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                        disabled={submitting}
                      >
                        <span className={`block truncate font-medium ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {CATEGORIES.find(c => c.value === formData.category)?.label || 'Select Category'}
                        </span>
                        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                          <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${
                            showCategoryDropdown ? 'rotate-180' : ''
                          } ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                        </span>
                      </button>

                      {showCategoryDropdown && (
                        <>
                          <div 
                            className="fixed inset-0 z-10"
                            onClick={() => setShowCategoryDropdown(false)}
                          />
                          <div className={`absolute z-20 mt-1 w-full shadow-lg max-h-60 rounded-xl py-1 ring-1 ring-opacity-5 overflow-auto focus:outline-none transition-colors ${
                            isDarkMode 
                              ? 'bg-gray-800 ring-gray-600' 
                              : 'bg-white ring-black'
                          }`}>
                            {CATEGORIES.map((category) => (
                              <button
                                key={category.value}
                                type="button"
                                className={`w-full text-left relative cursor-pointer select-none py-3 pl-3 pr-9 transition-colors ${
                                  formData.category === category.value 
                                    ? isDarkMode
                                      ? 'bg-blue-900/50 text-blue-300 font-semibold'
                                      : 'bg-blue-50 text-blue-900 font-semibold'
                                    : isDarkMode
                                      ? 'text-gray-300 font-medium hover:bg-gray-700 hover:text-white'
                                      : 'text-gray-900 font-medium hover:bg-blue-50 hover:text-blue-900'
                                }`}
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, category: category.value }));
                                  setShowCategoryDropdown(false);
                                }}
                              >
                                <div>
                                  <div className="font-medium">{category.label}</div>
                                  <div className={`text-xs mt-1 ${
                                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                  }`}>{category.description}</div>
                                </div>
                                {formData.category === category.value && (
                                  <span className={`absolute inset-y-0 right-0 flex items-center pr-3 ${
                                    isDarkMode ? 'text-blue-400' : 'text-blue-600'
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

                  {/* Custom Difficulty Dropdown */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>Difficulty Level</label>
                    <div className="relative">
                      <button
                        type="button"
                        className={`relative w-full border rounded-xl shadow-sm pl-3 pr-10 py-3 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        onClick={() => setShowDifficultyDropdown(!showDifficultyDropdown)}
                        disabled={submitting}
                      >
                        <span className={`block truncate font-medium ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {DIFFICULTY_LEVELS.find(d => d.value === formData.difficulty)?.label || 'Select Difficulty'}
                        </span>
                        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                          <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${
                            showDifficultyDropdown ? 'rotate-180' : ''
                          } ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                        </span>
                      </button>

                      {showDifficultyDropdown && (
                        <>
                          <div 
                            className="fixed inset-0 z-10"
                            onClick={() => setShowDifficultyDropdown(false)}
                          />
                          <div className={`absolute z-20 mt-1 w-full shadow-lg max-h-60 rounded-xl py-1 ring-1 ring-opacity-5 overflow-auto focus:outline-none transition-colors ${
                            isDarkMode 
                              ? 'bg-gray-800 ring-gray-600' 
                              : 'bg-white ring-black'
                          }`}>
                            {DIFFICULTY_LEVELS.map((level) => (
                              <button
                                key={level.value}
                                type="button"
                                className={`w-full text-left relative cursor-pointer select-none py-2 pl-3 pr-9 transition-colors ${
                                  formData.difficulty === level.value 
                                    ? isDarkMode
                                      ? 'bg-blue-900/50 text-blue-300 font-semibold'
                                      : 'bg-blue-50 text-blue-900 font-semibold'
                                    : isDarkMode
                                      ? 'text-gray-300 font-medium hover:bg-gray-700 hover:text-white'
                                      : 'text-gray-900 font-medium hover:bg-blue-50 hover:text-blue-900'
                                }`}
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, difficulty: level.value }));
                                  setShowDifficultyDropdown(false);
                                }}
                              >
                                <span className={`block truncate ${level.color}`}>{level.label}</span>
                                {formData.difficulty === level.value && (
                                  <span className={`absolute inset-y-0 right-0 flex items-center pr-3 ${
                                    isDarkMode ? 'text-blue-400' : 'text-blue-600'
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

                {/* Author and Duration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>Author</label>
                    <input
                      type="text"
                      value={formData.author}
                      onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="Author name (defaults to Kojo Team)"
                      disabled={submitting}
                    />
                  </div>

                  {(formData.type === 'video' || formData.type === 'podcast' || formData.type === 'webinar') && (
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>Duration</label>
                      <input
                        type="text"
                        value={formData.duration}
                        onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        placeholder="e.g., 15:30 or 1h 30m"
                        disabled={submitting}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Content & Files Tab */}
            {activeTab === 'content' && (
              <div className="space-y-6">
                {/* URL Field (for videos, external links) */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {formData.type === 'video' ? 'Video URL (YouTube, Vimeo, etc.)' : 'External URL'}
                  </label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder={formData.type === 'video' ? 'https://youtube.com/watch?v=...' : 'https://example.com/resource'}
                    disabled={submitting}
                  />
                  <p className={`text-xs mt-1 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {formData.type === 'video' 
                      ? 'For YouTube videos, we\'ll automatically extract the thumbnail and embed info'
                      : 'Optional external link to the resource'
                    }
                  </p>
                </div>

                {/* File Upload */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>File Upload</label>
                  <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                    isDarkMode 
                      ? 'border-gray-600 hover:border-gray-500' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}>
                    {selectedFile ? (
                      <div>
                        <div className="flex items-center justify-center mb-4">
                          <div className={`p-3 rounded-lg ${
                            isDarkMode ? 'bg-blue-900/50' : 'bg-blue-100'
                          }`}>
                            <FileText className={`w-8 h-8 ${
                              isDarkMode ? 'text-blue-300' : 'text-blue-600'
                            }`} />
                          </div>
                        </div>
                        <p className={`font-medium ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>{selectedFile.name}</p>
                        <p className={`text-sm mt-1 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                        <button
                          type="button"
                          onClick={() => setSelectedFile(null)}
                          className="mt-2 text-red-600 hover:text-red-700 text-sm"
                        >
                          Remove file
                        </button>
                      </div>
                    ) : (
                      <div>
                        <Upload className={`w-12 h-12 mx-auto mb-4 ${
                          isDarkMode ? 'text-gray-500' : 'text-gray-400'
                        }`} />
                        <div className={`mb-2 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          <label htmlFor="file-upload" className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium">
                            Click to upload
                          </label>
                          <span> or drag and drop</span>
                        </div>
                        <p className={`text-sm ${
                          isDarkMode ? 'text-gray-500' : 'text-gray-500'
                        }`}>
                          Supports PDFs, videos, audio files, documents (max 100MB)
                        </p>
                      </div>
                    )}
                    <input
                      id="file-upload"
                      type="file"
                      onChange={handleFileSelect}
                      className="hidden"
                      disabled={submitting}
                      accept=".pdf,.doc,.docx,.mp4,.mp3,.wav,.xlsx,.pptx"
                    />
                  </div>
                </div>

                {/* Thumbnail Upload */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Thumbnail Image</label>
                  <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                    isDarkMode 
                      ? 'border-gray-600 hover:border-gray-500' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}>
                    {thumbnailPreview ? (
                      <div>
                        <img
                          src={thumbnailPreview}
                          alt="Thumbnail preview"
                          className="w-32 h-32 object-cover rounded-lg mx-auto mb-4"
                        />
                        <p className={`font-medium ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>{selectedThumbnail.name}</p>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedThumbnail(null);
                            setThumbnailPreview(null);
                          }}
                          className="mt-2 text-red-600 hover:text-red-700 text-sm"
                        >
                          Remove thumbnail
                        </button>
                      </div>
                    ) : (
                      <div>
                        <ImageIcon className={`w-12 h-12 mx-auto mb-4 ${
                          isDarkMode ? 'text-gray-500' : 'text-gray-400'
                        }`} />
                        <div className={`mb-2 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          <label htmlFor="thumbnail-upload" className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium">
                            Upload thumbnail
                          </label>
                        </div>
                        <p className={`text-sm ${
                          isDarkMode ? 'text-gray-500' : 'text-gray-500'
                        }`}>PNG, JPG, GIF up to 5MB</p>
                      </div>
                    )}
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

                {/* Content Text Area (for articles) */}
                {formData.type === 'article' && (
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>Article Content</label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      rows="12"
                      placeholder="Write your article content here..."
                      disabled={submitting}
                    />
                    <p className={`text-xs mt-1 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      You can use plain text or basic HTML formatting
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
                  <label className={`block text-sm font-medium mb-3 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Access Level</label>
                  <div className="relative">
                    <button
                      type="button"
                      className={`relative w-full border rounded-xl shadow-sm pl-3 pr-10 py-3 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      onClick={() => setShowAccessLevelDropdown(!showAccessLevelDropdown)}
                      disabled={submitting}
                    >
                      <div className="flex items-center">
                        <span className={`block truncate font-medium ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {ACCESS_LEVELS.find(a => a.value === formData.accessLevel)?.label || 'Select Access Level'}
                        </span>
                      </div>
                      <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${
                          showAccessLevelDropdown ? 'rotate-180' : ''
                        } ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                      </span>
                    </button>

                    {showAccessLevelDropdown && (
                      <>
                        <div 
                          className="fixed inset-0 z-10"
                          onClick={() => setShowAccessLevelDropdown(false)}
                        />
                        <div className={`absolute z-20 mt-1 w-full shadow-lg max-h-60 rounded-xl py-1 ring-1 ring-opacity-5 overflow-auto focus:outline-none transition-colors ${
                          isDarkMode 
                            ? 'bg-gray-800 ring-gray-600' 
                            : 'bg-white ring-black'
                        }`}>
                          {ACCESS_LEVELS.map((level) => (
                            <button
                              key={level.value}
                              type="button"
                              className={`w-full text-left relative cursor-pointer select-none py-3 pl-3 pr-9 transition-colors ${
                                formData.accessLevel === level.value 
                                  ? isDarkMode
                                    ? 'bg-blue-900/50 text-blue-300 font-semibold'
                                    : 'bg-blue-50 text-blue-900 font-semibold'
                                  : isDarkMode
                                    ? 'text-gray-300 font-medium hover:bg-gray-700 hover:text-white'
                                    : 'text-gray-900 font-medium hover:bg-blue-50 hover:text-blue-900'
                              }`}
                              onClick={() => {
                                setFormData(prev => ({ ...prev, accessLevel: level.value }));
                                setShowAccessLevelDropdown(false);
                              }}
                            >
                              <div>
                                <div className="font-medium">{level.label}</div>
                                <div className={`text-sm mt-1 ${
                                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>{level.description}</div>
                              </div>
                              {formData.accessLevel === level.value && (
                                <span className={`absolute inset-y-0 right-0 flex items-center pr-3 ${
                                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
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

                {/* Content Requirements Notice */}
                <div className={`border rounded-xl p-4 ${
                  isDarkMode 
                    ? 'bg-amber-900/20 border-amber-800' 
                    : 'bg-amber-50 border-amber-200'
                }`}>
                  <h4 className={`font-medium mb-2 ${
                    isDarkMode ? 'text-amber-300' : 'text-amber-900'
                  }`}>Content Requirements</h4>
                  <div className={`text-sm ${
                    isDarkMode ? 'text-amber-200' : 'text-amber-800'
                  }`}>
                    {(() => {
                      switch (formData.type) {
                        case 'video':
                          return 'Videos require either a YouTube/Vimeo URL or an uploaded video file.';
                        case 'article':
                          return 'Articles require written content (minimum 50 characters).';
                        case 'podcast':
                          return 'Podcasts require either an audio URL or an uploaded audio file.';
                        case 'ebook':
                        case 'template':
                        case 'infographic':
                          return `${formData.type.charAt(0).toUpperCase() + formData.type.slice(1)}s require an uploaded file.`;
                        case 'tool':
                          return 'Tools require a URL to the external tool or calculator.';
                        case 'webinar':
                          return 'Webinars require either a URL, uploaded file, or written content.';
                        case 'course':
                          return 'Courses require either written content or uploaded materials.';
                        default:
                          return 'Please ensure proper content is provided for this resource type.';
                      }
                    })()}
                  </div>
                </div>

                {/* Premium Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className={`text-sm font-medium ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>Premium Content</label>
                    <p className={`text-xs mt-1 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>Mark this as premium/paid content</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, isPremium: !prev.isPremium }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.isPremium ? 'bg-blue-600' : isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
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

                {/* Publish Status */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className={`text-sm font-medium ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>Publish Immediately</label>
                    <p className={`text-xs mt-1 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>Make this resource visible to users right away</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, isPublished: !prev.isPublished }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.isPublished ? 'bg-green-600' : isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
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

                {/* Tags */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Tags</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="forex, trading, beginner, strategy (separated by commas)"
                    disabled={submitting}
                  />
                  <p className={`text-xs mt-1 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Tags help users discover your content through search and filtering
                  </p>
                </div>

                {/* Meta Description */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>SEO Description</label>
                  <textarea
                    value={formData.metaDescription}
                    onChange={(e) => setFormData(prev => ({ ...prev, metaDescription: e.target.value }))}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    rows="3"
                    placeholder="Brief description for search engines and social media..."
                    maxLength={300}
                    disabled={submitting}
                  />
                  <div className={`text-xs mt-1 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {formData.metaDescription.length}/300 characters
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Footer Actions */}
          <div className={`flex-shrink-0 flex space-x-3 p-6 border-t transition-colors ${
            isDarkMode 
              ? 'border-gray-600 bg-gray-700' 
              : 'border-gray-200 bg-gray-50'
          }`}>
            <button
              type="button"
              onClick={handleClose}
              className={`flex-1 px-6 py-3 border rounded-xl transition-colors ${
                isDarkMode 
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-600' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
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
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Create Resource</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
