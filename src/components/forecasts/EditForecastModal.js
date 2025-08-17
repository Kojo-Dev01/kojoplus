'use client';

import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

export default function EditForecastModal({ isOpen, onClose, onSuccess, forecast }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isActive: true,
    isPublished: true,
    tags: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Update form data when forecast prop changes
  useEffect(() => {
    if (forecast) {
      setFormData({
        title: forecast.title || '',
        description: forecast.description || '',
        isActive: forecast.isActive !== undefined ? forecast.isActive : true,
        isPublished: forecast.isPublished !== undefined ? forecast.isPublished : true,
        tags: forecast.tags ? forecast.tags.join(', ') : ''
      });
    }
  }, [forecast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Title and description are required');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const updateData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        isActive: formData.isActive,
        isPublished: formData.isPublished
      };

      // Process tags
      if (formData.tags.trim()) {
        const tags = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        updateData.tags = tags;
      }

      const response = await fetch(`/api/forecasts/${forecast._id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update forecast');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error updating forecast:', err);
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

  if (!isOpen || !forecast) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 max-w-2xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex-shrink-0 bg-gradient-to-r from-gray-700 to-gray-600 px-6 py-4 border-b border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-white">Edit Forecast</h3>
              <p className="text-gray-300 mt-1">Update forecast information</p>
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
          <div className="p-6 space-y-6">
            {/* Current Image */}
            {forecast.imageUrl && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Current Image</label>
                <img
                  src={forecast.imageUrl}
                  alt={forecast.title}
                  className="w-full h-48 object-cover rounded-lg"
                />
                <p className="text-xs text-gray-400 mt-2">
                  Note: Image updates require creating a new forecast
                </p>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-600 bg-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
                placeholder="Enter forecast title..."
                maxLength={200}
                disabled={submitting}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-600 bg-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 resize-none"
                rows="6"
                placeholder="Describe your forecast and analysis..."
                disabled={submitting}
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-600 bg-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
                placeholder="EURUSD, bullish, breakout (separated by commas)"
                disabled={submitting}
              />
            </div>

            {/* Status Toggles */}
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-300">Active Status</label>
                  <p className="text-xs text-gray-400 mt-1">Show/hide this forecast</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.isActive ? 'bg-green-600' : 'bg-gray-600'
                  }`}
                  disabled={submitting}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.isActive ? 'translate-x-6' : 'translate-x-1'
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
                    formData.isPublished ? 'bg-blue-600' : 'bg-gray-600'
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
                  <span>Update Forecast</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
