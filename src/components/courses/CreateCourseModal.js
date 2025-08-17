'use client';

import React, { useState } from 'react';
import { X, Upload, BookOpen, Award, Lock, Globe, Plus, ChevronDown, CheckCircle, DollarSign, Link, Copy } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function CreateCourseModal({ isOpen, onClose, onSuccess }) {
  const { secureApiFormCall } = useAuth();
  const { isDarkMode } = useTheme();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    shortDescription: '',
    category: 'general',
    section: 'general',
    level: 'beginner',
    instructor: 'KojoForex',
    courseType: 'free', // 'free' or 'paid'
    price: 0,
    productId: '', // Manual input for paid courses
    purchaseLink: '', // Auto-generated based on productId
    isPremium: false,
    accessLevel: 'public',
    isPublished: false,
    isFeatured: false,
    tags: '',
    prerequisites: '',
    learningOutcomes: ''
  });
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [introVideoFile, setIntroVideoFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showCopiedMessage, setShowCopiedMessage] = useState('');

  // Dropdown states
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showSectionDropdown, setShowSectionDropdown] = useState(false);
  const [showLevelDropdown, setShowLevelDropdown] = useState(false);
  const [showAccessLevelDropdown, setShowAccessLevelDropdown] = useState(false);
  const [showCourseTypeDropdown, setShowCourseTypeDropdown] = useState(false);

  const CATEGORIES = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
    { value: 'trading-basics', label: 'Trading Basics' },
    { value: 'technical-analysis', label: 'Technical Analysis' },
    { value: 'fundamental-analysis', label: 'Fundamental Analysis' },
    { value: 'risk-management', label: 'Risk Management' },
    { value: 'psychology', label: 'Psychology' },
    { value: 'strategies', label: 'Strategies' },
    { value: 'tools', label: 'Tools' },
    { value: 'market-analysis', label: 'Market Analysis' },
    { value: 'general', label: 'General' }
  ];

  const SECTIONS = [
    { value: 'forex-fundamentals', label: 'Forex Fundamentals' },
    { value: 'technical-analysis', label: 'Technical Analysis' },
    { value: 'trading-strategies', label: 'Trading Strategies' },
    { value: 'risk-management', label: 'Risk Management' },
    { value: 'market-psychology', label: 'Market Psychology' },
    { value: 'advanced-concepts', label: 'Advanced Concepts' },
    { value: 'tools-and-platforms', label: 'Tools & Platforms' },
    { value: 'live-trading', label: 'Live Trading' },
    { value: 'general', label: 'General' }
  ];

  const LEVELS = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
    { value: 'expert', label: 'Expert' }
  ];

  const ACCESS_LEVELS = [
    { value: 'public', label: 'Public', description: 'Available to everyone' },
    { value: 'members', label: 'Members Only', description: 'Registered users only' },
    { value: 'premium', label: 'Premium', description: 'Premium subscribers only' },
    { value: 'admin', label: 'Admin Only', description: 'Admin access required' }
  ];

  if (!isOpen) return null;

  // Handle course type change
  const handleCourseTypeChange = (type) => {
    setFormData(prev => {
      const newData = { ...prev, courseType: type };
      
      if (type === 'free') {
        newData.price = 0;
        newData.productId = '';
        newData.purchaseLink = '';
        newData.isPremium = false;
      } else if (type === 'paid') {
        newData.isPremium = true;
        // Set a default price if not set
        if (newData.price === 0) {
          newData.price = 29.99;
        }
        // Don't auto-generate product ID - let user input manually
      }
      
      return newData;
    });
  };

  // Handle product ID change for paid courses
  const handleProductIdChange = (productId) => {
    setFormData(prev => {
      const newData = { ...prev, productId };
      
      // Auto-generate purchase link when product ID is entered
      if (prev.courseType === 'paid' && productId.trim()) {
        newData.purchaseLink = `https://vipsubscribepro.com/product/${productId.trim()}/checkout`;
      } else {
        newData.purchaseLink = '';
      }
      
      return newData;
    });
  };

  // Copy to clipboard function
  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setShowCopiedMessage(type);
      setTimeout(() => setShowCopiedMessage(''), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Title and description are required');
      return;
    }

    // Validate paid course requirements
    if (formData.courseType === 'paid') {
      if (!formData.price || formData.price <= 0) {
        setError('Price is required for paid courses and must be greater than 0');
        return;
      }
      if (!formData.productId) {
        setError('Product ID is required for paid courses');
        return;
      }
    }

    try {
      setSubmitting(true);
      setError('');

      const submitData = new FormData();
      
      // Add form fields
      Object.entries(formData).forEach(([key, value]) => {
        submitData.append(key, value);
      });

      // Add files
      if (thumbnailFile) {
        submitData.append('thumbnail', thumbnailFile);
      }
      if (introVideoFile) {
        submitData.append('introVideo', introVideoFile);
      }

      const response = await secureApiFormCall('/api/admin/courses', {
        method: 'POST',
        body: submitData
      });

      if (response.ok) {
        onSuccess();
        handleClose();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create course');
      }
    } catch (err) {
      setError('Failed to create course');
      console.error('Error creating course:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      shortDescription: '',
      category: 'general',
      section: 'general',
      level: 'beginner',
      instructor: 'KojoForex',
      courseType: 'free',
      price: 0,
      productId: '',
      purchaseLink: '',
      isPremium: false,
      accessLevel: 'public',
      isPublished: false,
      isFeatured: false,
      tags: '',
      prerequisites: '',
      learningOutcomes: ''
    });
    setThumbnailFile(null);
    setIntroVideoFile(null);
    setError('');
    setShowCopiedMessage('');
    onClose();
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileChange = (type, file) => {
    if (type === 'thumbnail') {
      setThumbnailFile(file);
    } else if (type === 'introVideo') {
      setIntroVideoFile(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`rounded-2xl shadow-2xl border w-full max-w-4xl max-h-[90vh] overflow-y-auto transition-colors ${
        isDarkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isDarkMode ? 'bg-blue-900/30 border border-blue-700/50' : 'bg-blue-100'
              }`}>
                <BookOpen className={`w-5 h-5 ${
                  isDarkMode ? 'text-blue-300' : 'text-blue-600'
                }`} />
              </div>
              <div>
                <h2 className={`text-xl font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Create New Course</h2>
                <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Add a new educational course</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-gray-200' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className={`border rounded-lg p-3 mb-6 ${
              isDarkMode 
                ? 'bg-red-900/20 border-red-800' 
                : 'bg-red-50 border-red-200'
            }`}>
              <p className={`text-sm ${
                isDarkMode ? 'text-red-300' : 'text-red-700'
              }`}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="lg:col-span-2">
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Course Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium transition-colors ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                  placeholder="Enter course title..."
                  required
                />
              </div>

              {/* Category Dropdown */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Category *
                </label>
                <div className="relative">
                  <button
                    type="button"
                    className={`relative w-full border rounded-xl shadow-sm pl-3 pr-10 py-3 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
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
                      <div className="fixed inset-0 z-10" onClick={() => setShowCategoryDropdown(false)} />
                      <div className={`absolute z-20 mt-1 w-full shadow-lg max-h-60 rounded-xl py-1 ring-1 ring-opacity-5 overflow-auto focus:outline-none transition-colors ${
                        isDarkMode 
                          ? 'bg-gray-800 ring-gray-600' 
                          : 'bg-white ring-black'
                      }`}>
                        {CATEGORIES.map((category) => (
                          <button
                            key={category.value}
                            type="button"
                            className={`w-full text-left relative cursor-pointer select-none py-2 pl-3 pr-9 transition-colors ${
                              formData.category === category.value
                                ? isDarkMode
                                  ? 'bg-blue-900/50 text-blue-300 font-semibold'
                                  : 'bg-blue-50 text-blue-900 font-semibold'
                                : isDarkMode
                                  ? 'text-gray-300 font-medium hover:bg-gray-700 hover:text-white'
                                  : 'text-gray-900 font-medium hover:bg-blue-50 hover:text-blue-900'
                            }`}
                            onClick={() => {
                              handleInputChange('category', category.value);
                              setShowCategoryDropdown(false);
                            }}
                          >
                            <span className="block truncate">{category.label}</span>
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

              {/* Section Dropdown */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Section *
                </label>
                <div className="relative">
                  <button
                    type="button"
                    className={`relative w-full border rounded-xl shadow-sm pl-3 pr-10 py-3 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    onClick={() => setShowSectionDropdown(!showSectionDropdown)}
                  >
                    <span className={`block truncate font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {SECTIONS.find(s => s.value === formData.section)?.label || 'Select Section'}
                    </span>
                    <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${
                        showSectionDropdown ? 'rotate-180' : ''
                      } ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                    </span>
                  </button>

                  {showSectionDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowSectionDropdown(false)} />
                      <div className={`absolute z-20 mt-1 w-full shadow-lg max-h-60 rounded-xl py-1 ring-1 ring-opacity-5 overflow-auto focus:outline-none transition-colors ${
                        isDarkMode 
                          ? 'bg-gray-800 ring-gray-600' 
                          : 'bg-white ring-black'
                      }`}>
                        {SECTIONS.map((section) => (
                          <button
                            key={section.value}
                            type="button"
                            className={`w-full text-left relative cursor-pointer select-none py-2 pl-3 pr-9 transition-colors ${
                              formData.section === section.value
                                ? isDarkMode
                                  ? 'bg-blue-900/50 text-blue-300 font-semibold'
                                  : 'bg-blue-50 text-blue-900 font-semibold'
                                : isDarkMode
                                  ? 'text-gray-300 font-medium hover:bg-gray-700 hover:text-white'
                                  : 'text-gray-900 font-medium hover:bg-blue-50 hover:text-blue-900'
                            }`}
                            onClick={() => {
                              handleInputChange('section', section.value);
                              setShowSectionDropdown(false);
                            }}
                          >
                            <span className="block truncate">{section.label}</span>
                            {formData.section === section.value && (
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

              {/* Level Dropdown */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Level *
                </label>
                <div className="relative">
                  <button
                    type="button"
                    className={`relative w-full border rounded-xl shadow-sm pl-3 pr-10 py-3 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    onClick={() => setShowLevelDropdown(!showLevelDropdown)}
                  >
                    <span className={`block truncate font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {LEVELS.find(l => l.value === formData.level)?.label || 'Select Level'}
                    </span>
                    <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${
                        showLevelDropdown ? 'rotate-180' : ''
                      } ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                    </span>
                  </button>

                  {showLevelDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowLevelDropdown(false)} />
                      <div className={`absolute z-20 mt-1 w-full shadow-lg max-h-60 rounded-xl py-1 ring-1 ring-opacity-5 overflow-auto focus:outline-none transition-colors ${
                        isDarkMode 
                          ? 'bg-gray-800 ring-gray-600' 
                          : 'bg-white ring-black'
                      }`}>
                        {LEVELS.map((level) => (
                          <button
                            key={level.value}
                            type="button"
                            className={`w-full text-left relative cursor-pointer select-none py-2 pl-3 pr-9 transition-colors ${
                              formData.level === level.value
                                ? isDarkMode
                                  ? 'bg-blue-900/50 text-blue-300 font-semibold'
                                  : 'bg-blue-50 text-blue-900 font-semibold'
                                : isDarkMode
                                  ? 'text-gray-300 font-medium hover:bg-gray-700 hover:text-white'
                                  : 'text-gray-900 font-medium hover:bg-blue-50 hover:text-blue-900'
                            }`}
                            onClick={() => {
                              handleInputChange('level', level.value);
                              setShowLevelDropdown(false);
                            }}
                          >
                            <span className="block truncate">{level.label}</span>
                            {formData.level === level.value && (
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

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Instructor
                </label>
                <input
                  type="text"
                  value={formData.instructor}
                  onChange={(e) => handleInputChange('instructor', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium transition-colors ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                  placeholder="Instructor name..."
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Short Description
              </label>
              <textarea
                value={formData.shortDescription}
                onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-medium transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
                rows="2"
                placeholder="Brief course description for listings..."
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Full Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-medium transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
                rows="4"
                placeholder="Detailed course description..."
                required
              />
            </div>

            {/* Files */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Course Thumbnail
                </label>
                <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                  isDarkMode 
                    ? 'border-gray-600 hover:border-gray-500' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange('thumbnail', e.target.files[0])}
                    className="hidden"
                    id="thumbnail-upload"
                  />
                  <label htmlFor="thumbnail-upload" className="cursor-pointer">
                    <Upload className={`w-8 h-8 mx-auto mb-2 ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-400'
                    }`} />
                    <p className={`text-sm font-medium ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {thumbnailFile ? thumbnailFile.name : 'Click to upload thumbnail'}
                    </p>
                  </label>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Intro Video (Optional)
                </label>
                <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                  isDarkMode 
                    ? 'border-gray-600 hover:border-gray-500' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => handleFileChange('introVideo', e.target.files[0])}
                    className="hidden"
                    id="intro-video-upload"
                  />
                  <label htmlFor="intro-video-upload" className="cursor-pointer">
                    <Upload className={`w-8 h-8 mx-auto mb-2 ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-400'
                    }`} />
                    <p className={`text-sm font-medium ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {introVideoFile ? introVideoFile.name : 'Click to upload intro video'}
                    </p>
                  </label>
                </div>
              </div>
            </div>

            {/* Course Type and Pricing */}
            <div className={`rounded-xl p-6 border transition-colors ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600' 
                : 'bg-gray-50 border-gray-200'
            }`}>
              <h3 className={`text-lg font-semibold mb-4 flex items-center ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                <DollarSign className={`w-5 h-5 mr-2 ${
                  isDarkMode ? 'text-green-400' : 'text-green-600'
                }`} />
                Course Pricing
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Course Type Dropdown */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Course Type *
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      className={`relative w-full border rounded-xl shadow-sm pl-3 pr-10 py-3 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        isDarkMode 
                          ? 'bg-gray-600 border-gray-500 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      onClick={() => setShowCourseTypeDropdown(!showCourseTypeDropdown)}
                    >
                      <span className={`block truncate font-medium flex items-center ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {formData.courseType === 'free' ? (
                          <>
                            <Globe className={`w-4 h-4 mr-2 ${
                              isDarkMode ? 'text-green-400' : 'text-green-600'
                            }`} />
                            Free Course
                          </>
                        ) : (
                          <>
                            <Lock className={`w-4 h-4 mr-2 ${
                              isDarkMode ? 'text-purple-400' : 'text-purple-600'
                            }`} />
                            Paid Course
                          </>
                        )}
                      </span>
                      <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${
                          showCourseTypeDropdown ? 'rotate-180' : ''
                        } ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                      </span>
                    </button>

                    {showCourseTypeDropdown && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowCourseTypeDropdown(false)} />
                        <div className={`absolute z-20 mt-1 w-full shadow-lg max-h-60 rounded-xl py-1 ring-1 ring-opacity-5 overflow-auto focus:outline-none transition-colors ${
                          isDarkMode 
                            ? 'bg-gray-800 ring-gray-600' 
                            : 'bg-white ring-black'
                        }`}>
                          {[
                            { value: 'free', label: 'Free Course', icon: Globe, color: isDarkMode ? 'text-green-400' : 'text-green-600', description: 'Available to everyone at no cost' },
                            { value: 'paid', label: 'Paid Course', icon: Lock, color: isDarkMode ? 'text-purple-400' : 'text-purple-600', description: 'Requires payment to access' }
                          ].map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              className={`w-full text-left relative cursor-pointer select-none py-3 pl-3 pr-9 transition-colors ${
                                formData.courseType === option.value
                                  ? isDarkMode
                                    ? 'bg-blue-900/50 text-blue-300 font-semibold'
                                    : 'bg-blue-50 text-blue-900 font-semibold'
                                  : isDarkMode
                                    ? 'text-gray-300 font-medium hover:bg-gray-700 hover:text-white'
                                    : 'text-gray-900 font-medium hover:bg-blue-50 hover:text-blue-900'
                              }`}
                              onClick={() => {
                                handleCourseTypeChange(option.value);
                                setShowCourseTypeDropdown(false);
                              }}
                            >
                              <div className="flex items-center">
                                <option.icon className={`w-4 h-4 mr-2 ${option.color}`} />
                                <div>
                                  <div className="font-medium">{option.label}</div>
                                  <div className={`text-xs mt-1 ${
                                    isDarkMode ? 'text-gray-500' : 'text-gray-500'
                                  }`}>{option.description}</div>
                                </div>
                              </div>
                              {formData.courseType === option.value && (
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

                {/* Price Input - Only show for paid courses */}
                {formData.courseType === 'paid' && (
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Price (USD) *
                    </label>
                    <div className="relative">
                      <DollarSign className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-400'
                      }`} />
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                        className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium transition-colors ${
                          isDarkMode 
                            ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                        placeholder="29.99"
                        required
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Product ID and Purchase Link for paid courses */}
              {formData.courseType === 'paid' && (
                <div className="mt-6 space-y-4">
                  {/* Product ID Input */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Product ID *
                    </label>
                    <input
                      type="text"
                      value={formData.productId}
                      onChange={(e) => handleProductIdChange(e.target.value)}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium transition-colors ${
                        isDarkMode 
                          ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                      placeholder="Enter unique product ID (e.g., COURSE001)"
                      required
                    />
                    <p className={`text-xs mt-1 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Enter a unique identifier for this course that will be used in the payment system.
                    </p>
                  </div>

                  {/* Auto-generated Purchase Link Display */}
                  {formData.productId && (
                    <div className={`border rounded-lg p-4 ${
                      isDarkMode 
                        ? 'bg-blue-900/20 border-blue-800' 
                        : 'bg-blue-50 border-blue-200'
                    }`}>
                      <h4 className={`text-sm font-semibold mb-3 flex items-center ${
                        isDarkMode ? 'text-blue-300' : 'text-blue-900'
                      }`}>
                        <Link className="w-4 h-4 mr-2" />
                        Auto-Generated Purchase Link
                      </h4>
                      
                      <div>
                        <label className={`block text-xs font-medium mb-1 ${
                          isDarkMode ? 'text-blue-200' : 'text-blue-700'
                        }`}>Purchase URL</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={formData.purchaseLink}
                            readOnly
                            className={`flex-1 px-3 py-2 border rounded-lg text-sm font-mono transition-colors ${
                              isDarkMode 
                                ? 'bg-gray-600 border-gray-500 text-white' 
                                : 'bg-white border-blue-200 text-gray-900'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => copyToClipboard(formData.purchaseLink, 'purchaseLink')}
                            className={`px-3 py-2 rounded-lg transition-colors ${
                              isDarkMode 
                                ? 'bg-blue-800 text-blue-200 hover:bg-blue-700' 
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            }`}
                            title="Copy Purchase Link"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                        {showCopiedMessage === 'purchaseLink' && (
                          <p className={`text-xs mt-1 ${
                            isDarkMode ? 'text-green-400' : 'text-green-600'
                          }`}>✓ Purchase link copied to clipboard</p>
                        )}
                      </div>

                      <div className={`mt-3 p-3 rounded-lg border ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600' 
                          : 'bg-white border-blue-200'
                      }`}>
                        <p className={`text-xs ${
                          isDarkMode ? 'text-blue-200' : 'text-blue-800'
                        }`}>
                          <strong>Note:</strong> The purchase link is automatically generated based on your product ID. 
                          This link will be used for payment processing and should be shared with customers who want to purchase this course.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Course Settings */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Access Level Dropdown */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Access Level
                </label>
                <div className="relative">
                  <button
                    type="button"
                    className={`relative w-full border rounded-xl shadow-sm pl-3 pr-10 py-3 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    onClick={() => setShowAccessLevelDropdown(!showAccessLevelDropdown)}
                  >
                    <span className={`block truncate font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {ACCESS_LEVELS.find(a => a.value === formData.accessLevel)?.label || 'Select Access Level'}
                    </span>
                    <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${
                        showAccessLevelDropdown ? 'rotate-180' : ''
                      } ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                    </span>
                  </button>

                  {showAccessLevelDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowAccessLevelDropdown(false)} />
                      <div className={`absolute z-20 mt-1 w-full shadow-lg max-h-60 rounded-xl py-1 ring-1 ring-opacity-5 overflow-auto focus:outline-none transition-colors ${
                        isDarkMode 
                          ? 'bg-gray-800 ring-gray-600' 
                          : 'bg-white ring-black'
                      }`}>
                        {ACCESS_LEVELS.map((accessLevel) => (
                          <button
                            key={accessLevel.value}
                            type="button"
                            className={`w-full text-left relative cursor-pointer select-none py-3 pl-3 pr-9 transition-colors ${
                              formData.accessLevel === accessLevel.value
                                ? isDarkMode
                                  ? 'bg-blue-900/50 text-blue-300 font-semibold'
                                  : 'bg-blue-50 text-blue-900 font-semibold'
                                : isDarkMode
                                  ? 'text-gray-300 font-medium hover:bg-gray-700 hover:text-white'
                                  : 'text-gray-900 font-medium hover:bg-blue-50 hover:text-blue-900'
                            }`}
                            onClick={() => {
                              handleInputChange('accessLevel', accessLevel.value);
                              setShowAccessLevelDropdown(false);
                            }}
                          >
                            <div>
                              <div className="font-medium">{accessLevel.label}</div>
                              <div className={`text-xs mt-1 ${
                                isDarkMode ? 'text-gray-500' : 'text-gray-500'
                              }`}>{accessLevel.description}</div>
                            </div>
                            {formData.accessLevel === accessLevel.value && (
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

              <div className="space-y-4">
                {/* Auto-set Premium for paid courses */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPremium"
                    checked={formData.isPremium}
                    onChange={(e) => handleInputChange('isPremium', e.target.checked)}
                    disabled={formData.courseType === 'paid'} // Disabled for paid courses as it's auto-set
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <label htmlFor="isPremium" className={`ml-2 text-sm font-medium ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Premium Course
                    {formData.courseType === 'paid' && (
                      <span className={`text-xs ml-1 ${
                        isDarkMode ? 'text-blue-400' : 'text-blue-600'
                      }`}>(Auto-enabled for paid courses)</span>
                    )}
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPublished"
                    checked={formData.isPublished}
                    onChange={(e) => handleInputChange('isPublished', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isPublished" className={`ml-2 text-sm font-medium ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Publish Course
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    checked={formData.isFeatured}
                    onChange={(e) => handleInputChange('isFeatured', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isFeatured" className={`ml-2 text-sm font-medium ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Featured Course
                  </label>
                </div>
              </div>
            </div>

            {/* Additional Fields */}
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => handleInputChange('tags', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium transition-colors ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                  placeholder="forex, trading, analysis..."
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Prerequisites (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.prerequisites}
                  onChange={(e) => handleInputChange('prerequisites', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium transition-colors ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                  placeholder="Basic trading knowledge, Computer skills..."
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Learning Outcomes (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.learningOutcomes}
                  onChange={(e) => handleInputChange('learningOutcomes', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium transition-colors ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                  placeholder="Understand market analysis, Execute trades successfully..."
                />
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className={`flex-1 px-6 py-3 border rounded-xl transition-colors font-medium ${
                  isDarkMode 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || (formData.courseType === 'paid' && (!formData.price || formData.price <= 0 || !formData.productId.trim()))}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-medium"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Create {formData.courseType === 'paid' ? 'Paid' : 'Free'} Course</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
