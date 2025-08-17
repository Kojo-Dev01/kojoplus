'use client';

import { useState } from 'react';
import { X, Heart, MessageSquare, Eye, Calendar, User, Tag, Trash2 } from 'lucide-react';

export default function ForecastDetailModal({ isOpen, onClose, forecast }) {
  const [deletingComment, setDeletingComment] = useState(null);
  const [deletingReply, setDeletingReply] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteReplyConfirm, setShowDeleteReplyConfirm] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [replyToDelete, setReplyToDelete] = useState(null);
  const [parentCommentId, setParentCommentId] = useState(null);

  if (!isOpen || !forecast) return null;

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (isActive) => {
    return isActive 
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };

  const handleDeleteComment = async (commentId) => {
    setDeletingComment(commentId);
    try {
      const response = await fetch(`/api/forecasts/${forecast._id}/comments/${commentId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setShowDeleteConfirm(false);
        setCommentToDelete(null);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to delete comment');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment');
    } finally {
      setDeletingComment(null);
    }
  };

  const confirmDeleteComment = (comment) => {
    setCommentToDelete(comment);
    setShowDeleteConfirm(true);
  };

  const handleDeleteReply = async (commentId, replyId) => {
    setDeletingReply(replyId);
    try {
      const response = await fetch(`/api/forecasts/${forecast._id}/comments/${commentId}/replies/${replyId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setShowDeleteReplyConfirm(false);
        setReplyToDelete(null);
        setParentCommentId(null);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to delete reply');
      }
    } catch (error) {
      console.error('Error deleting reply:', error);
      alert('Failed to delete reply');
    } finally {
      setDeletingReply(null);
    }
  };

  const confirmDeleteReply = (comment, reply) => {
    setParentCommentId(comment._id);
    setReplyToDelete(reply);
    setShowDeleteReplyConfirm(true);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 max-w-4xl w-full max-h-[95vh] overflow-y-auto">
          {/* Header */}
          <div className="flex-shrink-0 bg-gradient-to-r from-gray-700 to-gray-600 px-6 py-4 border-b border-gray-600">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white">Forecast Details</h3>
                <p className="text-gray-300 mt-1">View forecast information and engagement</p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Forecast Image */}
            <div className="relative">
              <img
                src={forecast.imageUrl}
                alt={forecast.title}
                className="w-full h-64 object-cover rounded-xl"
              />
              <div className="absolute top-4 right-4">
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(forecast.isActive)}`}>
                  {forecast.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* Forecast Info */}
            <div>
              <h1 className="text-2xl font-bold text-white mb-4">{forecast.title}</h1>
              <p className="text-gray-300 text-lg leading-relaxed mb-6">
                {forecast.description}
              </p>

              {/* Meta Information */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="flex items-center space-x-2 text-gray-400">
                  <Eye className="w-4 h-4" />
                  <span className="text-sm">{forecast.views || 0} views</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-400">
                  <Heart className="w-4 h-4" />
                  <span className="text-sm">{forecast.likeCount || forecast.likes?.length || 0} likes</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-400">
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-sm">{forecast.commentCount || forecast.comments?.length || 0} comments</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">{formatDate(forecast.createdAt)}</span>
                </div>
              </div>

              {/* Creator Info */}
              <div className="flex items-center space-x-2 text-gray-400 mb-6">
                <User className="w-4 h-4" />
                <span className="text-sm">
                  Created by {
                    forecast.creatorType === 'admin' 
                      ? forecast.createdBy 
                      : forecast.createdBy?.firstName + ' ' + forecast.createdBy?.lastName || 'Unknown User'
                  }
                </span>
              </div>

              {/* Tags */}
              {forecast.tags && forecast.tags.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-white mb-3">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {forecast.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm"
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Comments Section */}
            {forecast.comments && forecast.comments.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-white mb-4">
                  Comments ({forecast.comments.length})
                </h4>
                <div className="space-y-4">
                  {forecast.comments.map((comment) => (
                    <div key={comment._id} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-white">
                            {comment.user?.firstName} {comment.user?.lastName}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                        <button
                          onClick={() => confirmDeleteComment(comment)}
                          className="text-gray-400 hover:text-red-400 transition-colors"
                          title="Delete comment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-gray-300 mb-2">{comment.content}</p>
                      
                      {/* Comment likes */}
                      {comment.likes && comment.likes.length > 0 && (
                        <div className="flex items-center space-x-1 text-gray-400 text-sm">
                          <Heart className="w-3 h-3" />
                          <span>{comment.likes.length} likes</span>
                        </div>
                      )}

                      {/* Replies */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-4 pl-4 border-l border-gray-600 space-y-3">
                          {comment.replies.map((reply) => (
                            <div key={reply._id} className="bg-gray-600 rounded-lg p-3">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium text-white text-sm">
                                    {reply.user?.firstName} {reply.user?.lastName}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    {formatDate(reply.createdAt)}
                                  </span>
                                </div>
                                <button
                                  onClick={() => confirmDeleteReply(comment, reply)}
                                  className="text-gray-400 hover:text-red-400 transition-colors"
                                  title="Delete reply"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                              <p className="text-gray-300 text-sm">{reply.content}</p>
                              
                              {/* Reply likes */}
                              {reply.likes && reply.likes.length > 0 && (
                                <div className="flex items-center space-x-1 text-gray-400 text-xs mt-2">
                                  <Heart className="w-3 h-3" />
                                  <span>{reply.likes.length} likes</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Comment Confirmation Modal */}
      {showDeleteConfirm && commentToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-60 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 max-w-md w-full">
            <div className="p-6">
              <div className="flex items-start space-x-4 mb-6">
                <div className="w-10 h-10 bg-red-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-white">Delete Comment</h3>
                  <p className="text-gray-300 mt-1">This action cannot be undone</p>
                </div>
              </div>

              <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 mb-6">
                <p className="text-red-300 text-sm">
                  Are you sure you want to delete this comment by <strong>{commentToDelete.user?.firstName} {commentToDelete.user?.lastName}</strong>?
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setCommentToDelete(null);
                  }}
                  className="flex-1 px-4 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                  disabled={deletingComment}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteComment(commentToDelete._id)}
                  disabled={deletingComment}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm font-medium"
                >
                  {deletingComment ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Comment</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Reply Confirmation Modal */}
      {showDeleteReplyConfirm && replyToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-60 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 max-w-md w-full">
            <div className="p-6">
              <div className="flex items-start space-x-4 mb-6">
                <div className="w-10 h-10 bg-red-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-white">Delete Reply</h3>
                  <p className="text-gray-300 mt-1">This action cannot be undone</p>
                </div>
              </div>

              <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 mb-6">
                <p className="text-red-300 text-sm">
                  Are you sure you want to delete this reply by <strong>{replyToDelete.user?.firstName} {replyToDelete.user?.lastName}</strong>?
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteReplyConfirm(false);
                    setReplyToDelete(null);
                    setParentCommentId(null);
                  }}
                  className="flex-1 px-4 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                  disabled={deletingReply}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteReply(parentCommentId, replyToDelete._id)}
                  disabled={deletingReply}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm font-medium"
                >
                  {deletingReply ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Reply</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
