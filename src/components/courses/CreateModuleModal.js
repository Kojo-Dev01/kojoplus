'use client';

import React, { useState } from 'react';
import { X, Plus, BookOpen } from 'lucide-react';

export default function CreateModuleModal({ isOpen, onClose, courseId, moduleCount, onSuccess }) {
  const [moduleForm, setModuleForm] = useState({
    title: '',
    description: '',
    order: 1
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleCreateModule = async () => {
    if (!moduleForm.title.trim()) {
      setError('Module title is required');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`/api/admin/courses/${courseId}/modules`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...moduleForm,
          order: moduleCount + 1
        })
      });

      if (response.ok) {
        const data = await response.json();
        onSuccess(data.course.modules);
        handleClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create module');
      }
    } catch (err) {
      setError('Failed to create module');
      console.error('Error creating module:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setModuleForm({ title: '', description: '', order: 1 });
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-2xl w-full">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Create New Module</h3>
                <p className="text-gray-600">Add a new module to organize course content</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
              disabled={submitting}
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); handleCreateModule(); }} className="space-y-6">
            {/* Module Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Module Title *
              </label>
              <input
                type="text"
                value={moduleForm.title}
                onChange={(e) => setModuleForm(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium placeholder-gray-500"
                placeholder="e.g., Introduction to Forex Trading"
                required
                disabled={submitting}
              />
            </div>

            {/* Module Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={moduleForm.description}
                onChange={(e) => setModuleForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium placeholder-gray-500 resize-none"
                rows="3"
                placeholder="Brief description of what this module covers..."
                disabled={submitting}
              />
            </div>

            {/* Module Preview */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Module Preview</h4>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-sm font-semibold text-blue-600">{(moduleCount || 0) + 1}</span>
                </div>
                <div className="flex-1">
                  <div className="text-base font-medium text-gray-900">
                    {moduleForm.title || 'Module Title'}
                  </div>
                  {moduleForm.description && (
                    <div className="text-sm text-gray-600 mt-1">
                      {moduleForm.description}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
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
                disabled={submitting || !moduleForm.title.trim()}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-medium"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Creating Module...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Create Module</span>
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
