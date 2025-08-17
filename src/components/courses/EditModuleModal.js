'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, BookOpen, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function EditModuleModal({ isOpen, onClose, courseId, module, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isPublished: false
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { secureApiCall } = useAuth();

  // Update form data when module prop changes
  useEffect(() => {
    if (module) {
      setFormData({
        title: module.title || '',
        description: module.description || '',
        isPublished: module.isPublished || false
      });
    }
  }, [module]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Module title is required');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await secureApiCall(`/api/admin/courses/${courseId}/modules/${module._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          isPublished: formData.isPublished
        })
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update module');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error updating module:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setError('');
      onClose();
    }
  };

  if (!isOpen || !module) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Edit Module</h3>
                <p className="text-gray-600 mt-1">Update module details and settings</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={submitting}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Module Preview */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <h4 className="text-sm font-semibold text-blue-900 mb-3">Module Preview</h4>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-sm">M</span>
                </div>
                <div className="flex-1">
                  <div className="text-base font-medium text-gray-900">
                    {formData.title || 'Module Title'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {formData.description || 'Module description will appear here'}
                  </div>
                </div>
                <div className={`px-2 py-1 text-xs font-medium rounded-full ${
                  formData.isPublished 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {formData.isPublished ? 'Published' : 'Draft'}
                </div>
              </div>
            </div>

            {/* Module Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Module Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                placeholder="Enter module title..."
                maxLength={200}
                disabled={submitting}
              />
              <div className="text-xs text-gray-500 mt-1">
                {formData.title.length}/200 characters
              </div>
            </div>

            {/* Module Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 resize-none"
                rows="4"
                placeholder="Describe what students will learn in this module..."
                maxLength={1000}
                disabled={submitting}
              />
              <div className="text-xs text-gray-500 mt-1">
                {formData.description.length}/1000 characters
              </div>
            </div>

            {/* Publication Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Publication Status
              </label>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, isPublished: false }))}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                    !formData.isPublished
                      ? 'border-gray-500 bg-gray-50 text-gray-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                  disabled={submitting}
                >
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <span>Save as Draft</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, isPublished: true }))}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                    formData.isPublished
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                  disabled={submitting}
                >
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Publish Module</span>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {formData.isPublished 
                  ? 'Module will be visible to students' 
                  : 'Module will be hidden from students (draft)'
                }
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !formData.title.trim()}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Update Module</span>
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
