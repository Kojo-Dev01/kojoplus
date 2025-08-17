'use client';

import React, { useState, useEffect } from 'react';
import { X, Upload, BookOpen, Save, DollarSign, Globe, Lock, Copy, Link, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function EditCourseModal({ isOpen, onClose, course, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    shortDescription: '',
    category: 'general',
    section: 'general',
    level: 'beginner',
    instructor: 'Kojo Team',
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
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [introVideoFile, setIntroVideoFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showCopiedMessage, setShowCopiedMessage] = useState('');

  const { secureApiCall } = useAuth();

  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title || '',
        description: course.description || '',
        shortDescription: course.shortDescription || '',
        category: course.category || 'general',
        section: course.section || 'general',
        level: course.level || 'beginner',
        instructor: course.instructor || 'Kojo Team',
        courseType: course.courseType || 'free',
        price: course.price || 0,
        productId: course.productId || '',
        purchaseLink: course.purchaseLink || '',
        isPremium: course.isPremium || false,
        accessLevel: course.accessLevel || 'public',
        isPublished: course.isPublished || false,
        isFeatured: course.isFeatured || false,
        tags: course.tags ? course.tags.join(', ') : '',
        prerequisites: course.prerequisites ? course.prerequisites.join(', ') : '',
        learningOutcomes: course.learningOutcomes ? course.learningOutcomes.join(', ') : ''
      });
    }
  }, [course]);

  const handleProductIdChange = (productId) => {
    setFormData(prev => {
      const newData = { ...prev, productId };
      
      if (prev.courseType === 'paid' && productId.trim()) {
        newData.purchaseLink = `https://vipsubscribepro.com/product/${productId.trim()}/checkout`;
      } else {
        newData.purchaseLink = '';
      }
      
      return newData;
    });
  };

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
      
      Object.entries(formData).forEach(([key, value]) => {
        submitData.append(key, value);
      });

      if (thumbnailFile) {
        submitData.append('thumbnail', thumbnailFile);
      }
      if (introVideoFile) {
        submitData.append('introVideo', introVideoFile);
      }

      // Use fetch directly for FormData uploads since secureApiCall handles JSON
      const response = await fetch(`/api/admin/courses/${course._id}`, {
        method: 'PATCH',
        credentials: 'include',
        body: submitData
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update course');
      }
    } catch (err) {
      if (err.message !== 'Authentication expired') {
        setError('Failed to update course');
        console.error('Error updating course:', err);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
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

  if (!isOpen || !course) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Edit Course</h2>
                <p className="text-gray-600">Update course information</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Course Status Banner */}
            <div className={`rounded-xl p-4 border-2 ${
              formData.isPublished 
                ? 'bg-green-50 border-green-200' 
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {formData.isPublished ? (
                    <Eye className="w-5 h-5 text-green-600" />
                  ) : (
                    <EyeOff className="w-5 h-5 text-yellow-600" />
                  )}
                  <div>
                    <h3 className={`font-semibold ${
                      formData.isPublished ? 'text-green-900' : 'text-yellow-900'
                    }`}>
                      {formData.isPublished ? 'Published Course' : 'Draft Course'}
                    </h3>
                    <p className={`text-sm ${
                      formData.isPublished ? 'text-green-700' : 'text-yellow-700'
                    }`}>
                      {formData.isPublished 
                        ? 'This course is live and visible to users' 
                        : 'This course is in draft mode and not visible to users'
                      }
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleInputChange('isPublished', !formData.isPublished)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    formData.isPublished ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.isPublished ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Basic Information */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium placeholder-gray-500"
                    placeholder="Enter course title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium"
                  >
                    <option value="general">General</option>
                    <option value="trading">Trading</option>
                    <option value="investing">Investing</option>
                    <option value="cryptocurrency">Cryptocurrency</option>
                    <option value="forex">Forex</option>
                    <option value="stocks">Stocks</option>
                    <option value="mindset">Mindset</option>
                    <option value="risk-management">Risk Management</option>
                    <option value="technical-analysis">Technical Analysis</option>
                    <option value="fundamental-analysis">Fundamental Analysis</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Level
                  </label>
                  <select
                    value={formData.level}
                    onChange={(e) => handleInputChange('level', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Course Type and Pricing */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <DollarSign className="w-5 h-5 text-green-600 mr-2" />
                Course Pricing
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Course Type Display (Read-only for edit) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course Type
                  </label>
                  <div className="flex items-center space-x-2 p-3 bg-gray-100 rounded-xl">
                    {formData.courseType === 'free' ? (
                      <>
                        <Globe className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-gray-900">Free Course</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 text-purple-600" />
                        <span className="font-medium text-gray-900">Paid Course</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Course type cannot be changed after creation
                  </p>
                </div>

                {/* Price Input for Paid Courses */}
                {formData.courseType === 'paid' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price (USD) *
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium placeholder-gray-500"
                        placeholder="29.99"
                        required
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Product ID and Purchase Link for Paid Courses */}
              {formData.courseType === 'paid' && (
                <div className="mt-6 space-y-4">
                  {/* Product ID Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product ID *
                    </label>
                    <input
                      type="text"
                      value={formData.productId}
                      onChange={(e) => handleProductIdChange(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium placeholder-gray-500"
                      placeholder="Enter unique product ID"
                      required
                    />
                  </div>

                  {/* Auto-generated Purchase Link Display */}
                  {formData.productId && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center">
                        <Link className="w-4 h-4 mr-2" />
                        Purchase Link
                      </h4>
                      
                      <div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={formData.purchaseLink}
                            readOnly
                            className="flex-1 px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm font-mono text-gray-900"
                          />
                          <button
                            type="button"
                            onClick={() => copyToClipboard(formData.purchaseLink, 'purchaseLink')}
                            className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                            title="Copy Purchase Link"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                        {showCopiedMessage === 'purchaseLink' && (
                          <p className="text-xs text-green-600 mt-1">✓ Purchase link copied to clipboard</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Course Settings */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Featured Toggle */}
                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                  <div>
                    <h4 className="font-medium text-gray-900">Featured Course</h4>
                    <p className="text-sm text-gray-500">Show in featured section</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleInputChange('isFeatured', !formData.isFeatured)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      formData.isFeatured ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.isFeatured ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Premium Toggle */}
                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                  <div>
                    <h4 className="font-medium text-gray-900">Premium Content</h4>
                    <p className="text-sm text-gray-500">Requires premium access</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleInputChange('isPremium', !formData.isPremium)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                      formData.isPremium ? 'bg-purple-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.isPremium ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* ...existing form fields for description, files, etc... */}

            {/* Submit Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || (formData.courseType === 'paid' && (!formData.price || formData.price <= 0 || !formData.productId.trim()))}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-medium"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>
                      {formData.isPublished ? 'Update & Keep Published' : 'Update Course'}
                    </span>
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
