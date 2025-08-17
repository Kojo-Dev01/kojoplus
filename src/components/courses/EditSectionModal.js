'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Folder, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function EditSectionModal({ isOpen, onClose, courseId, moduleId, section, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isPublished: false
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { secureApiCall } = useAuth();

  // Update form data when section prop changes
  useEffect(() => {
    if (section) {
      setFormData({
        title: section.title || '',
        description: section.description || '',
        isPublished: section.isPublished || false
      });
    }
  }, [section]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Section title is required');
      return;
    }

    if (!courseId || !moduleId || !section?._id) {
      setError('Missing required course, module, or section information');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      console.log('Updating section:', { courseId, moduleId, sectionId: section._id });
      
      const response = await secureApiCall(`/api/admin/courses/${courseId}/modules/${moduleId}/sections/${section._id}`, {
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
        const data = await response.json();
        console.log('Section updated successfully:', data);
        onSuccess();
        onClose();
      } else {
        const errorData = await response.json();
        console.error('Failed to update section:', errorData);
        setError(errorData.error || 'Failed to update section');
      }
    } catch (err) {
      console.error('Error updating section:', err);
      setError('Network error. Please try again.');
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

  if (!isOpen || !section) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Folder className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Edit Section</h3>
                <p className="text-gray-600 mt-1">Update section information and settings</p>
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
            {/* Current Section Info */}
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
              <h4 className="text-sm font-semibold text-purple-900 mb-2">Current Section</h4>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Folder className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1">
                  <div className="text-base font-medium text-gray-900">
                    {section.title}
                  </div>
                  <div className="text-sm text-gray-600">
                    {section.description || 'No description'}
                  </div>
                  <div className="flex items-center space-x-3 mt-1">
                    <div className="text-xs text-gray-500">
                      Order: {section.order || 'unset'}
                    </div>
                    <div className="text-xs text-gray-500">
                      Lessons: {section.lessons?.length || 0}
                    </div>
                  </div>
                </div>
                <div className={`px-2 py-1 text-xs font-medium rounded-full ${
                  section.isPublished 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {section.isPublished ? 'Published' : 'Draft'}
                </div>
              </div>
            </div>

            {/* Section Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Section Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                placeholder="Enter section title..."
                maxLength={200}
                disabled={submitting}
              />
              <div className="text-xs text-gray-500 mt-1">
                {formData.title.length}/200 characters
              </div>
            </div>

            {/* Section Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 resize-none"
                rows="4"
                placeholder="Describe what this section covers..."
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
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                  disabled={submitting}
                >
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Publish Section</span>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {formData.isPublished 
                  ? 'Section will be visible to students' 
                  : 'Section will be hidden from students'
                }
              </p>
            </div>

            {/* Section Stats */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-start space-x-3">
                <Folder className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-blue-900">Section Information</h4>
                  <p className="text-xs text-blue-700 mt-1">
                    This section contains {section.lessons?.length || 0} lesson{section.lessons?.length !== 1 ? 's' : ''}.
                    {section.lessons?.length > 0 && ' Editing the section will not affect the lessons.'}
                  </p>
                </div>
              </div>
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
                className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Update Section</span>
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
