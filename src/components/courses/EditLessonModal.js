'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Play, AlertCircle, Clock, Video } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function EditLessonModal({ isOpen, onClose, courseId, moduleId, sectionId, lesson, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoUrl: '',
    duration: '',
    isPublished: false
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { secureApiCall } = useAuth();

  // Update form data when lesson prop changes
  useEffect(() => {
    if (lesson) {
      setFormData({
        title: lesson.title || '',
        description: lesson.description || '',
        videoUrl: lesson.videoUrl || '',
        duration: lesson.duration ? lesson.duration.toString() : '',
        isPublished: lesson.isPublished || false
      });
    }
  }, [lesson]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Lesson title is required');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // Determine the correct endpoint based on whether it's a section lesson or direct module lesson
      const endpoint = sectionId 
        ? `/api/admin/courses/${courseId}/modules/${moduleId}/sections/${sectionId}/lessons/${lesson._id}`
        : `/api/admin/courses/${courseId}/modules/${moduleId}/lessons/${lesson._id}`;

      const response = await secureApiCall(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          videoUrl: formData.videoUrl.trim() || undefined,
          duration: formData.duration ? parseInt(formData.duration) : undefined,
          isPublished: formData.isPublished
        })
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update lesson');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error updating lesson:', err);
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

  if (!isOpen || !lesson) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Play className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Edit Lesson</h3>
                <p className="text-gray-600 mt-1">
                  Update lesson details and settings
                  {sectionId ? ' (Section Lesson)' : ' (Direct Module Lesson)'}
                </p>
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
            {/* Lesson Preview */}
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <h4 className="text-sm font-semibold text-green-900 mb-3">Lesson Preview</h4>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Play className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="text-base font-medium text-gray-900">
                    {formData.title || 'Lesson Title'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {formData.description || 'Lesson description will appear here'}
                  </div>
                  {(formData.duration || formData.videoUrl) && (
                    <div className="flex items-center space-x-3 mt-2">
                      {formData.duration && (
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="w-3 h-3 mr-1" />
                          <span>{formData.duration} min</span>
                        </div>
                      )}
                      {formData.videoUrl && (
                        <div className="flex items-center text-xs text-blue-500">
                          <Video className="w-3 h-3 mr-1" />
                          <span>Video URL</span>
                        </div>
                      )}
                    </div>
                  )}
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

            {/* Lesson Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lesson Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                placeholder="Enter lesson title..."
                maxLength={200}
                disabled={submitting}
              />
              <div className="text-xs text-gray-500 mt-1">
                {formData.title.length}/200 characters
              </div>
            </div>

            {/* Lesson Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 resize-none"
                rows="4"
                placeholder="Describe what students will learn in this lesson..."
                maxLength={1000}
                disabled={submitting}
              />
              <div className="text-xs text-gray-500 mt-1">
                {formData.description.length}/1000 characters
              </div>
            </div>

            {/* Video URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Video className="w-4 h-4 inline mr-1" />
                Video URL
              </label>
              <input
                type="url"
                value={formData.videoUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                disabled={submitting}
              />
              <p className="text-xs text-gray-500 mt-1">
                Video URL for this lesson (YouTube, Vimeo, or direct video file)
              </p>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Duration (minutes)
              </label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                placeholder="15"
                min="1"
                max="600"
                disabled={submitting}
              />
              <p className="text-xs text-gray-500 mt-1">
                Estimated lesson duration in minutes
              </p>
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
                  <span>Publish Lesson</span>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {formData.isPublished 
                  ? 'Lesson will be visible to students' 
                  : 'Lesson will be hidden from students (draft)'
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
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Update Lesson</span>
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
