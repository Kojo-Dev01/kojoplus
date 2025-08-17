'use client';

import { useState } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';

export default function CreateForecastModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: '',
    isPublished: true
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }

      setSelectedFile(file);
      setError('');

      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim() || !selectedFile) {
      setError('Please fill in all required fields and select an image');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const submitFormData = new FormData();
      submitFormData.append('title', formData.title.trim());
      submitFormData.append('description', formData.description.trim());
      submitFormData.append('image', selectedFile);
      submitFormData.append('isPublished', formData.isPublished);

      // Process tags
      if (formData.tags.trim()) {
        const tags = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        submitFormData.append('tags', JSON.stringify(tags));
      }

      const response = await fetch('/api/forecasts', {
        method: 'POST',
        credentials: 'include',
        body: submitFormData
      });

      if (response.ok) {
        // Reset form
        setFormData({
          title: '',
          description: '',
          tags: '',
          isPublished: true
        });
        setSelectedFile(null);
        setPreviewUrl(null);
        onSuccess();
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create forecast');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error creating forecast:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setFormData({
        title: '',
        description: '',
        tags: '',
        isPublished: true
      });
      setSelectedFile(null);
      setPreviewUrl(null);
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 max-w-2xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex-shrink-0 bg-gradient-to-r from-gray-700 to-gray-600 px-6 py-4 border-b border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-white">Create New Forecast</h3>
              <p className="text-gray-300 mt-1">Share your trading insights</p>
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
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Forecast Image *</label>
              <div className="border-2 border-dashed border-gray-600 rounded-xl p-6 text-center hover:border-gray-500 transition-colors">
                {previewUrl ? (
                  <div>
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                      }}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Remove image
                    </button>
                  </div>
                ) : (
                  <div>
                    <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <div className="text-gray-400 mb-2">
                      <label htmlFor="image-upload" className="cursor-pointer text-blue-400 hover:text-blue-300 font-medium">
                        Upload forecast image
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                  </div>
                )}
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
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
              <label className="block text-sm font-medium text-gray-300 mb-2">Tags (optional)</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-600 bg-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
                placeholder="EURUSD, bullish, breakout (separated by commas)"
                disabled={submitting}
              />
            </div>

            {/* Publish Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-300">Publish immediately</label>
                <p className="text-xs text-gray-400 mt-1">Make this forecast visible to users right away</p>
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
              disabled={submitting || !formData.title.trim() || !formData.description.trim() || !selectedFile}
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
                  <span>Create Forecast</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
