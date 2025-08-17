'use client';

import React, { useState } from 'react';
import { X, Play, Clock, Video, Eye, EyeOff, BookOpen, Calendar, User, Edit, FileText, ExternalLink } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export default function LessonDetailsModal({ isOpen, onClose, lesson, module, section, onEdit }) {
  const [showVideo, setShowVideo] = useState(false);
  const { isDarkMode } = useTheme();

  if (!isOpen || !lesson) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  };

  // Helper function to check if video URL is a .ts file
  const isTsFile = (url) => {
    if (!url) return false;
    const urlPath = url.split('?')[0]; // Remove query parameters
    return urlPath.toLowerCase().endsWith('.ts');
  };

  const getVideoEmbedUrl = (url) => {
    if (!url) return null;

    // YouTube URL handling
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      let videoId = '';
      if (url.includes('youtube.com/watch?v=')) {
        videoId = url.split('watch?v=')[1].split('&')[0];
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1].split('?')[0];
      }
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }

    // Vimeo URL handling
    if (url.includes('vimeo.com')) {
      const videoId = url.split('/').pop();
      return `https://player.vimeo.com/video/${videoId}`;
    }

    // Return original URL for direct video files or other embed URLs
    return url;
  };

  const embedUrl = getVideoEmbedUrl(lesson.videoUrl);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-60 flex items-center justify-center p-4">
      <div className={`rounded-2xl shadow-2xl border max-w-6xl w-full max-h-[95vh] overflow-y-auto transition-colors ${
        isDarkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className={`text-xl font-semibold mb-2 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>{lesson.title}</h3>
              <div className="flex items-center space-x-2 text-sm">
                {module && (
                  <span className={`px-2 py-1 rounded-full ${
                    isDarkMode 
                      ? 'bg-blue-900/50 text-blue-300' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {module.title}
                  </span>
                )}
                {section && (
                  <span className={`px-2 py-1 rounded-full ${
                    isDarkMode 
                      ? 'bg-green-900/50 text-green-300' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {section.title}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className={`transition-colors ${
                isDarkMode 
                  ? 'text-gray-400 hover:text-gray-200' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Video Player */}
            <div className="lg:col-span-2">
              <div className={`rounded-xl overflow-hidden ${
                isDarkMode ? 'bg-gray-900' : 'bg-gray-900'
              }`}>
                {lesson.videoUrl ? (
                  <div className="relative aspect-video">
                    {isTsFile(lesson.videoUrl) ? (
                      // Use video tag for .ts files
                      <video
                        controls
                        className="absolute top-0 left-0 w-full h-full"
                      >
                        <source src={lesson.videoUrl} type="video/mp2t" />
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      // Use iframe for other file types
                      <iframe
                        src={embedUrl}
                        className="absolute top-0 left-0 w-full h-full"
                        frameBorder="0"
                        allowFullScreen
                        title={lesson.title}
                      />
                    )}
                  </div>
                ) : (
                  <div className="aspect-video flex items-center justify-center">
                    <div className={`text-center ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      <Play className="w-16 h-16 mx-auto mb-4" />
                      <p>No video available</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Video Info */}
              <div className={`mt-4 p-4 rounded-xl transition-colors ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
              }`}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <Clock className={`w-5 h-5 mx-auto mb-1 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                    <div className={`text-sm font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>{formatDuration(lesson.duration)}</div>
                    <div className={`text-xs ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>Duration</div>
                  </div>
                  <div className="text-center">
                    <FileText className={`w-5 h-5 mx-auto mb-1 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                    <div className={`text-sm font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {lesson.isPublished ? 'Published' : 'Draft'}
                    </div>
                    <div className={`text-xs ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>Status</div>
                  </div>
                  <div className="text-center">
                    <Calendar className={`w-5 h-5 mx-auto mb-1 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                    <div className={`text-sm font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {formatDate(lesson.createdAt)}
                    </div>
                    <div className={`text-xs ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>Created</div>
                  </div>
                  <div className="text-center">
                    <User className={`w-5 h-5 mx-auto mb-1 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                    <div className={`text-sm font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>#{lesson.order}</div>
                    <div className={`text-xs ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>Order</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Lesson Details */}
            <div className="space-y-6">
              {/* Description */}
              <div>
                <h4 className={`text-lg font-semibold mb-3 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Description</h4>
                <div className={`rounded-xl p-4 transition-colors ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  {lesson.description ? (
                    <p className={`leading-relaxed whitespace-pre-wrap ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {lesson.description}
                    </p>
                  ) : (
                    <p className={`italic ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-500'
                    }`}>No description provided</p>
                  )}
                </div>
              </div>

              {/* Lesson Information */}
              <div>
                <h4 className={`text-lg font-semibold mb-3 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Lesson Information</h4>
                <div className={`rounded-xl p-4 space-y-3 transition-colors ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm font-medium ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>Lesson ID</span>
                    <span className={`text-sm font-mono ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>{lesson._id}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm font-medium ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>Order</span>
                    <span className={`text-sm ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>#{lesson.order}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm font-medium ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>Duration</span>
                    <span className={`text-sm ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>{formatDuration(lesson.duration)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm font-medium ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>Status</span>
                    <span className={`text-sm font-medium ${
                      lesson.isPublished 
                        ? isDarkMode ? 'text-green-400' : 'text-green-600'
                        : isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                    }`}>
                      {lesson.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm font-medium ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>Created</span>
                    <span className={`text-sm ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>{formatDate(lesson.createdAt)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm font-medium ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>Updated</span>
                    <span className={`text-sm ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>{formatDate(lesson.updatedAt)}</span>
                  </div>
                </div>
              </div>

              {/* Video Information */}
              {lesson.videoUrl && (
                <div>
                  <h4 className={`text-lg font-semibold mb-3 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>Video Information</h4>
                  <div className={`rounded-xl p-4 space-y-3 transition-colors ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <div className="flex justify-between items-center">
                      <span className={`text-sm font-medium ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>Video Type</span>
                      <span className={`text-sm ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {isTsFile(lesson.videoUrl) ? 'TS Stream' : 'Standard Video'}
                      </span>
                    </div>
                    {lesson.videoKey && (
                      <div className="flex justify-between items-center">
                        <span className={`text-sm font-medium ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>Video Key</span>
                        <span className={`text-sm font-mono ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>{lesson.videoKey}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className={`text-sm font-medium ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>Video URL</span>
                      <div className="flex items-center space-x-2">
                        <a
                          href={lesson.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center space-x-1 transition-colors ${
                            isDarkMode 
                              ? 'text-blue-400 hover:text-blue-300' 
                              : 'text-blue-600 hover:text-blue-700'
                          }`}
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span className="text-xs">View</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3">
                {lesson.videoUrl && (
                  <a
                    href={lesson.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open Video in New Tab</span>
                  </a>
                )}
                
                <button
                  onClick={onClose}
                  className={`w-full px-4 py-3 border rounded-xl transition-colors ${
                    isDarkMode 
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
