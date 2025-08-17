"use client";

import React, { useState } from "react";
import {
  X,
  Play,
  Save,
  AlertCircle,
  Video,
  Clock,
  FileText,
  Upload,
  Film,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";

export default function CreateLessonModal({
  isOpen,
  onClose,
  courseId,
  moduleId,
  sectionId,
  onSuccess,
}) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    videoUrl: "",
    duration: "",
    isPublished: false,
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadMethod, setUploadMethod] = useState("url"); // 'url' or 'upload'
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  const { secureApiCall, secureApiFormCall } = useAuth();
  const { isDarkMode } = useTheme();

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedVideoTypes = ["video/", ".ts"];

      const fileType = file.type;
      const fileName = file.name.toLowerCase();
      // Validate file type
      if (!fileType.startsWith("video/") && !fileName.endsWith(".ts")) {
        console.log("❌ Invalid file type:", fileType);
        setError('Only video files are allowed');
        return NextResponse.json(
          { error: "Only video files are allowed" },
          { status: 400 }
        );
      }

      // Validate file type
      // if (!file.type.startsWith('video/')) {
      //   setError('Only video files are allowed');
      //   return;
      // }

      // Validate file size (max 500MB)
      if (file.size > 500 * 1024 * 1024) {
        setError("Video size must be less than 500MB");
        return;
      }

      setSelectedFile(file);
      setError("");
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, videoFile: file }));

      // Get video duration if possible
      const video = document.createElement("video");
      video.preload = "metadata";

      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        const duration = Math.round(video.duration);
        setFormData((prev) => ({ ...prev, duration }));
      };

      video.src = URL.createObjectURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setError("Lesson title is required");
      return;
    }

    if (uploadMethod === "url" && !formData.videoUrl.trim()) {
      setError("Video URL is required when using URL method");
      return;
    }

    if (uploadMethod === "upload" && !selectedFile) {
      setError("Please select a video file to upload");
      return;
    }

    if (!moduleId) {
      setError("Module ID is required");
      return;
    }

    setSubmitting(true);
    setError("");
    setUploadProgress(0);

    try {
      const endpoint = sectionId
        ? `/api/admin/courses/${courseId}/modules/${moduleId}/sections/${sectionId}/lessons`
        : `/api/admin/courses/${courseId}/modules/${moduleId}/lessons`;

      console.log("Submitting lesson with method:", uploadMethod);

      let response;

      if (uploadMethod === "upload" && selectedFile) {
        // Use FormData for file upload with secureApiFormCall
        const submitFormData = new FormData();
        submitFormData.append("title", formData.title.trim());
        submitFormData.append("description", formData.description.trim() || "");
        submitFormData.append("video", selectedFile);
        if (formData.duration)
          submitFormData.append("duration", formData.duration);
        submitFormData.append("isPublished", formData.isPublished.toString());

        console.log("Using secureApiFormCall for file upload");
        response = await secureApiFormCall(endpoint, {
          method: "POST",
          body: submitFormData,
          onUploadProgress: (progress) => {
            setUploadProgress(progress);
          },
        });
      } else {
        // Use JSON for URL method with secureApiCall
        console.log("Using secureApiCall for JSON data");
        response = await secureApiCall(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: formData.title.trim(),
            description: formData.description.trim() || undefined,
            videoUrl: formData.videoUrl.trim() || undefined,
            duration: formData.duration
              ? parseInt(formData.duration)
              : undefined,
            isPublished: formData.isPublished,
          }),
        });
      }

      if (response.ok) {
        const data = await response.json();
        // Reset form
        setFormData({
          title: "",
          description: "",
          videoUrl: "",
          duration: "",
          isPublished: false,
        });
        setSelectedFile(null);
        setUploadMethod("url");
        onSuccess(data.lesson);
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to create lesson");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      console.error("Error creating lesson:", err);
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setFormData({
        title: "",
        description: "",
        videoUrl: "",
        duration: "",
        isPublished: false,
      });
      setSelectedFile(null);
      setUploadMethod("url");
      setError("");
      onClose();
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDuration = (seconds) => {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className={`rounded-2xl shadow-2xl border max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-colors ${
          isDarkMode
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        }`}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3
                className={`text-xl font-semibold ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Create New Lesson
              </h3>
              <p
                className={`mt-1 ${
                  isDarkMode ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Add a new lesson to your course
              </p>
            </div>
            <button
              onClick={handleClose}
              className={`transition-colors ${
                isDarkMode
                  ? "text-gray-400 hover:text-gray-200"
                  : "text-gray-400 hover:text-gray-600"
              }`}
              disabled={submitting}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div
              className={`mb-6 border rounded-xl p-4 ${
                isDarkMode
                  ? "bg-red-900/20 border-red-800"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <p className={isDarkMode ? "text-red-300" : "text-red-700"}>
                {error}
              </p>
            </div>
          )}

          {/* Upload Progress */}
          {submitting && uploadProgress > 0 && (
            <div
              className={`mb-6 rounded-xl p-4 border transition-colors ${
                isDarkMode
                  ? "bg-blue-900/20 border-blue-800"
                  : "bg-blue-50 border-blue-200"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-blue-300" : "text-blue-700"
                  }`}
                >
                  Uploading video...
                </span>
                <span
                  className={`text-sm ${
                    isDarkMode ? "text-blue-300" : "text-blue-700"
                  }`}
                >
                  {uploadProgress}%
                </span>
              </div>
              <div
                className={`w-full rounded-full h-2 ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-200"
                }`}
              >
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Lesson Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
                placeholder="Enter lesson title..."
                required
              />
            </div>

            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
                rows="4"
                placeholder="Describe what students will learn in this lesson..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Lesson Order
                </label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) =>
                    handleInputChange("order", parseInt(e.target.value) || 1)
                  }
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                  min="1"
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Duration (seconds)
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) =>
                    handleInputChange("duration", parseInt(e.target.value) || 0)
                  }
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                  min="0"
                />
                {formData.duration > 0 && (
                  <p
                    className={`text-xs mt-1 ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Duration: {formatDuration(formData.duration)}
                  </p>
                )}
              </div>
            </div>

            {/* Video Upload */}
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Lesson Video
              </label>
              <div
                className={`border-2 border-dashed rounded-xl p-6 transition-colors ${
                  isDarkMode
                    ? "border-gray-600 hover:border-gray-500"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                {selectedFile ? (
                  <div className="text-center">
                    <Video
                      className={`w-12 h-12 mx-auto mb-3 ${
                        isDarkMode ? "text-green-400" : "text-green-600"
                      }`}
                    />
                    <div
                      className={`text-sm ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      <p className="font-medium">{selectedFile.name}</p>
                      <p
                        className={`mt-1 ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className={`mt-3 text-sm ${
                        isDarkMode
                          ? "text-red-400 hover:text-red-300"
                          : "text-red-600 hover:text-red-700"
                      }`}
                    >
                      Remove video
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload
                      className={`w-12 h-12 mx-auto mb-3 ${
                        isDarkMode ? "text-gray-500" : "text-gray-400"
                      }`}
                    />
                    <div
                      className={`text-sm ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      <label className="cursor-pointer">
                        <span className="text-blue-600 hover:text-blue-700">
                          Upload video file
                        </span>
                        <input
                          type="file"
                          accept="video/*"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </label>
                      <p className="mt-1">MP4, MOV, AVI up to 500MB</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Publishing Options */}
            <div
              className={`rounded-xl p-4 border transition-colors ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.isPublished}
                  onChange={(e) =>
                    handleInputChange("isPublished", e.target.checked)
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <span
                    className={`text-sm font-medium ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Publish lesson immediately
                  </span>
                  <p
                    className={`text-xs ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Students will be able to access this lesson right away
                  </p>
                </div>
              </label>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-6">
              <button
                type="button"
                onClick={handleClose}
                className={`flex-1 px-6 py-3 border rounded-xl transition-colors ${
                  isDarkMode
                    ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !formData.title}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    <span>Create Lesson</span>
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
