'use client';

import React, { useState } from 'react';
import { X, Folder, Plus, Save, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function CreateSectionModal({ isOpen, onClose, courseId, moduleId, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isPublished: false
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { secureApiCall } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Section title is required');
      return;
    }

    if (!moduleId) {
      setError('Module ID is required');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await secureApiCall(`/api/admin/courses/${courseId}/modules/${moduleId}/sections`, {
        method: 'POST',
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          isPublished: formData.isPublished
        })
      });

      if (response.ok) {
        // Reset form
        setFormData({
          title: '',
          description: '',
          isPublished: false
        });
        onSuccess();
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create section');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error creating section:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setFormData({
        title: '',
        description: '',
        isPublished: false
      });
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

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
                <h3 className="text-xl font-semibold text-gray-900">Create New Section</h3>
                <p className="text-gray-600 mt-1">Add a new section to organize your lessons</p>
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
            {/* Section Preview */}
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
              <h4 className="text-sm font-semibold text-purple-900 mb-3">Section Preview</h4>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Folder className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1">
                  <div className="text-base font-medium text-gray-900">
                    {formData.title || 'Section Title'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {formData.description || 'Section description will appear here'}
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
                rows="3"
                placeholder="Brief description of what this section covers..."
                maxLength={500}
                disabled={submitting}
              />
              <div className="text-xs text-gray-500 mt-1">
                {formData.description.length}/500 characters
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
                  <span>Publish Immediately</span>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {formData.isPublished 
                  ? 'Section will be visible to students immediately' 
                  : 'Section will be saved as draft and not visible to students'
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
                className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Create Section</span>
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
