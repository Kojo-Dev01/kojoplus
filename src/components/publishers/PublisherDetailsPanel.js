'use client';

import { useState } from 'react';
import { X, User, Mail, Phone, Calendar, Shield, CheckCircle, XCircle, Edit, Save, Send, Bell, Users, TrendingUp, Heart, MessageSquare, BarChart3, Star, Eye } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export default function PublisherDetailsPanel({ isOpen, onClose, publisher }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedPublisher, setEditedPublisher] = useState({});
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({
    type: 'email',
    subject: '',
    message: '',
    priority: 'medium'
  });
  const [sendingContact, setSendingContact] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const { isDarkMode } = useTheme();

  if (!isOpen || !publisher) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleEdit = () => {
    setEditedPublisher({ 
      ...publisher,
      displayName: publisher.displayName,
      bio: publisher.bio,
      isActive: publisher.isActive,
      isVerified: publisher.isVerified
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/admin/publishers', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          publisherId: publisher._id,
          displayName: editedPublisher.displayName,
          bio: editedPublisher.bio,
          isActive: editedPublisher.isActive,
          isVerified: editedPublisher.isVerified
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Update the publisher object
        Object.assign(publisher, data.publisher);
        setIsEditing(false);
        alert('Publisher updated successfully');
      } else {
        const errorData = await response.json();
        alert('Failed to update publisher: ' + (errorData.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating publisher:', error);
      alert('Failed to update publisher: Network error');
    }
  };

  const handleCancel = () => {
    setEditedPublisher({});
    setIsEditing(false);
  };

  const handleInputChange = (field, value) => {
    setEditedPublisher(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleContactSubmit = async () => {
    if (!contactForm.subject.trim() || !contactForm.message.trim()) return;

    setSendingContact(true);
    try {
      const token = localStorage.getItem('authToken');
      
      // Send based on contact type
      if (contactForm.type === 'email' || contactForm.type === 'both') {
        // Send email
        const emailResponse = await fetch('/api/admin/send-email', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            to: publisher.userId.email,
            subject: contactForm.subject,
            message: contactForm.message,
            userId: publisher.userId._id
          })
        });

        if (!emailResponse.ok) {
          throw new Error('Failed to send email');
        }
      }

      if (contactForm.type === 'notification' || contactForm.type === 'both') {
        // Send in-app notification
        const notificationResponse = await fetch('/api/admin/send-notification', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: publisher.userId._id,
            title: contactForm.subject,
            message: contactForm.message,
            priority: contactForm.priority,
            type: 'message'
          })
        });

        if (!notificationResponse.ok) {
          throw new Error('Failed to send notification');
        }
      }

      // Reset form and close modal
      setContactForm({
        type: 'email',
        subject: '',
        message: '',
        priority: 'medium'
      });
      setShowContactModal(false);

      alert('Publisher contacted successfully');

    } catch (error) {
      alert('Failed to contact publisher - ' + error.message);
      console.error('Error sending contact:', error);
    } finally {
      setSendingContact(false);
    }
  };

  const resetContactForm = () => {
    setContactForm({
      type: 'email',
      subject: '',
      message: '',
      priority: 'medium'
    });
    setShowContactModal(false);
  };

  // Calculate engagement rate
  const engagementRate = publisher.stats.totalViews > 0 
    ? ((publisher.stats.totalLikes + publisher.stats.totalComments) / publisher.stats.totalViews * 100).toFixed(1)
    : 0;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed h-full inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onClose} />
      
      {/* Panel */}
      <div className={`fixed inset-y-0 right-0 w-full max-w-4xl shadow-2xl z-50 border-l flex flex-col transition-colors ${
        isDarkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        {/* Fixed Header */}
        <div className={`px-6 py-4 border-b flex-shrink-0 transition-colors ${
          isDarkMode 
            ? 'bg-gradient-to-r from-gray-700 to-gray-600 border-gray-600' 
            : 'bg-gradient-to-r from-purple-50 to-blue-50 border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                {publisher.avatar ? (
                  <img
                    src={publisher.avatar}
                    alt={publisher.displayName}
                    className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-white" />
                  </div>
                )}
                {publisher.isVerified && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
              <div>
                <h2 className={`text-xl font-semibold flex items-center space-x-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  <span>{publisher.displayName}</span>
                  {publisher.isVerified && <Shield className="w-5 h-5 text-blue-500" />}
                </h2>
                <p className={`font-medium ${
                  isDarkMode ? 'text-purple-300' : 'text-purple-600'
                }`}>@{publisher.nickname}</p>
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>Publisher Profile</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`rounded-xl p-4 border transition-colors ${
              isDarkMode 
                ? 'bg-gradient-to-br from-purple-900/30 to-purple-800/30 border-purple-700/50' 
                : 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200'
            }`}>
              <div className="flex items-center space-x-2">
                <Users className={`w-5 h-5 ${
                  isDarkMode ? 'text-purple-300' : 'text-purple-600'
                }`} />
                <div>
                  <div className={`text-sm font-medium ${
                    isDarkMode ? 'text-purple-200' : 'text-purple-700'
                  }`}>Followers</div>
                  <div className={`text-xl font-bold ${
                    isDarkMode ? 'text-purple-100' : 'text-purple-900'
                  }`}>{publisher.followerCount || 0}</div>
                </div>
              </div>
            </div>

            <div className={`rounded-xl p-4 border transition-colors ${
              isDarkMode 
                ? 'bg-gradient-to-br from-blue-900/30 to-blue-800/30 border-blue-700/50' 
                : 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'
            }`}>
              <div className="flex items-center space-x-2">
                <TrendingUp className={`w-5 h-5 ${
                  isDarkMode ? 'text-blue-300' : 'text-blue-600'
                }`} />
                <div>
                  <div className={`text-sm font-medium ${
                    isDarkMode ? 'text-blue-200' : 'text-blue-700'
                  }`}>Forecasts</div>
                  <div className={`text-xl font-bold ${
                    isDarkMode ? 'text-blue-100' : 'text-blue-900'
                  }`}>{publisher.stats.totalForecasts || 0}</div>
                </div>
              </div>
            </div>

            <div className={`rounded-xl p-4 border transition-colors ${
              isDarkMode 
                ? 'bg-gradient-to-br from-green-900/30 to-green-800/30 border-green-700/50' 
                : 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'
            }`}>
              <div className="flex items-center space-x-2">
                <Eye className={`w-5 h-5 ${
                  isDarkMode ? 'text-green-300' : 'text-green-600'
                }`} />
                <div>
                  <div className={`text-sm font-medium ${
                    isDarkMode ? 'text-green-200' : 'text-green-700'
                  }`}>Views</div>
                  <div className={`text-xl font-bold ${
                    isDarkMode ? 'text-green-100' : 'text-green-900'
                  }`}>{publisher.stats.totalViews || 0}</div>
                </div>
              </div>
            </div>

            <div className={`rounded-xl p-4 border transition-colors ${
              isDarkMode 
                ? 'bg-gradient-to-br from-pink-900/30 to-pink-800/30 border-pink-700/50' 
                : 'bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200'
            }`}>
              <div className="flex items-center space-x-2">
                <Heart className={`w-5 h-5 ${
                  isDarkMode ? 'text-pink-300' : 'text-pink-600'
                }`} />
                <div>
                  <div className={`text-sm font-medium ${
                    isDarkMode ? 'text-pink-200' : 'text-pink-700'
                  }`}>Likes</div>
                  <div className={`text-xl font-bold ${
                    isDarkMode ? 'text-pink-100' : 'text-pink-900'
                  }`}>{publisher.stats.totalLikes || 0}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Publisher Information */}
          <div className={`rounded-2xl p-6 border transition-colors ${
            isDarkMode 
              ? 'bg-gray-700 border-gray-600' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-lg font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Publisher Information</h3>
              {!isEditing ? (
                <button
                  onClick={handleEdit}
                  className="flex items-center space-x-1 px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleCancel}
                    className={`px-3 py-1 border rounded-lg transition-colors ${
                      isDarkMode 
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-600' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex items-center space-x-1 px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save</span>
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>Display Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedPublisher.displayName || ''}
                    onChange={(e) => handleInputChange('displayName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    maxLength={50}
                  />
                ) : (
                  <p className={`font-medium ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>{publisher.displayName}</p>
                )}
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>Nickname</label>
                <p className={`font-medium ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>@{publisher.nickname}</p>
                <p className={`text-xs mt-1 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>Nickname cannot be changed</p>
              </div>

              <div className="md:col-span-2">
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>Bio</label>
                {isEditing ? (
                  <textarea
                    value={editedPublisher.bio || ''}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    rows="3"
                    maxLength={500}
                  />
                ) : (
                  <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                    {publisher.bio || 'No bio provided'}
                  </p>
                )}
              </div>

              {/* Status Toggles when editing */}
              {isEditing && (
                <>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>Account Status</label>
                    <div className="flex items-center space-x-3">
                      <button
                        type="button"
                        onClick={() => handleInputChange('isActive', true)}
                        className={`px-3 py-2 rounded-lg border-2 transition-colors ${
                          editedPublisher.isActive
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : isDarkMode
                              ? 'border-gray-600 text-gray-300 hover:border-gray-500'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        Active
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInputChange('isActive', false)}
                        className={`px-3 py-2 rounded-lg border-2 transition-colors ${
                          !editedPublisher.isActive
                            ? 'border-red-500 bg-red-50 text-red-700'
                            : isDarkMode
                              ? 'border-gray-600 text-gray-300 hover:border-gray-500'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        Inactive
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>Verification Status</label>
                    <div className="flex items-center space-x-3">
                      <button
                        type="button"
                        onClick={() => handleInputChange('isVerified', true)}
                        className={`px-3 py-2 rounded-lg border-2 transition-colors ${
                          editedPublisher.isVerified
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : isDarkMode
                              ? 'border-gray-600 text-gray-300 hover:border-gray-500'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        Verified
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInputChange('isVerified', false)}
                        className={`px-3 py-2 rounded-lg border-2 transition-colors ${
                          !editedPublisher.isVerified
                            ? 'border-gray-500 bg-gray-50 text-gray-700'
                            : isDarkMode
                              ? 'border-gray-600 text-gray-300 hover:border-gray-500'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        Unverified
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* User Account Information */}
          {publisher.userId && (
            <div className={`rounded-2xl p-6 border transition-colors ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600' 
                : 'bg-gray-50 border-gray-200'
            }`}>
              <h3 className={`text-lg font-semibold mb-4 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Associated User Account</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Full Name</label>
                  <p className={`font-medium ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {publisher.userId.firstName} {publisher.userId.lastName}
                  </p>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Email</label>
                  <div className="flex items-center space-x-2">
                    <Mail className={`w-4 h-4 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-400'
                    }`} />
                    <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                      {publisher.userId.email}
                    </p>
                    {publisher.userId.emailVerified && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Phone</label>
                  <div className="flex items-center space-x-2">
                    <Phone className={`w-4 h-4 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-400'
                    }`} />
                    <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                      {publisher.userId.phone || 'Not provided'}
                    </p>
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>WhatsApp</label>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-green-500" />
                    <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                      {publisher.userId.whatsapp || 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Performance Analytics */}
          <div className={`rounded-2xl p-6 border transition-colors ${
            isDarkMode 
              ? 'bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border-indigo-700/50' 
              : 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200'
          }`}>
            <div className="flex items-center space-x-2 mb-4">
              <BarChart3 className={`w-5 h-5 ${
                isDarkMode ? 'text-indigo-300' : 'text-indigo-600'
              }`} />
              <h3 className={`text-lg font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Performance Analytics</h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className={`text-2xl font-bold ${
                  isDarkMode ? 'text-indigo-100' : 'text-indigo-900'
                }`}>{publisher.stats.totalForecasts || 0}</div>
                <div className={`text-sm ${
                  isDarkMode ? 'text-indigo-200' : 'text-indigo-700'
                }`}>Total Forecasts</div>
              </div>
              
              <div className="text-center">
                <div className={`text-2xl font-bold ${
                  isDarkMode ? 'text-indigo-100' : 'text-indigo-900'
                }`}>{publisher.stats.totalViews || 0}</div>
                <div className={`text-sm ${
                  isDarkMode ? 'text-indigo-200' : 'text-indigo-700'
                }`}>Total Views</div>
              </div>
              
              <div className="text-center">
                <div className={`text-2xl font-bold ${
                  isDarkMode ? 'text-indigo-100' : 'text-indigo-900'
                }`}>{publisher.stats.totalComments || 0}</div>
                <div className={`text-sm ${
                  isDarkMode ? 'text-indigo-200' : 'text-indigo-700'
                }`}>Total Comments</div>
              </div>
              
              <div className="text-center">
                <div className={`text-2xl font-bold ${
                  isDarkMode ? 'text-indigo-100' : 'text-indigo-900'
                }`}>{engagementRate}%</div>
                <div className={`text-sm ${
                  isDarkMode ? 'text-indigo-200' : 'text-indigo-700'
                }`}>Engagement Rate</div>
              </div>
            </div>
          </div>

          {/* Account Status and Dates */}
          <div className={`rounded-2xl p-6 border transition-colors ${
            isDarkMode 
              ? 'bg-gray-700 border-gray-600' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Account Status</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>Status</label>
                <div className="flex items-center space-x-2">
                  {publisher.isActive ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className={`font-medium ${
                        isDarkMode ? 'text-green-400' : 'text-green-700'
                      }`}>Active</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-500" />
                      <span className={`font-medium ${
                        isDarkMode ? 'text-red-400' : 'text-red-700'
                      }`}>Inactive</span>
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>Verification</label>
                <div className="flex items-center space-x-2">
                  {publisher.isVerified ? (
                    <>
                      <Shield className="w-5 h-5 text-blue-500" />
                      <span className={`font-medium ${
                        isDarkMode ? 'text-blue-400' : 'text-blue-700'
                      }`}>Verified Publisher</span>
                    </>
                  ) : (
                    <>
                      <XCircle className={`w-5 h-5 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`} />
                      <span className={`font-medium ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>Unverified</span>
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>Joined Date</label>
                <div className="flex items-center space-x-2">
                  <Calendar className={`w-4 h-4 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-400'
                  }`} />
                  <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                    {formatDate(publisher.createdAt)}
                  </p>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>Last Updated</label>
                <div className="flex items-center space-x-2">
                  <Calendar className={`w-4 h-4 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-400'
                  }`} />
                  <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                    {formatDate(publisher.updatedAt)}
                  </p>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>Terms Accepted</label>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                    {formatDate(publisher.termsAcceptedAt)} (v{publisher.termsVersion})
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Actions */}
          <div className={`rounded-2xl p-6 border transition-colors ${
            isDarkMode 
              ? 'bg-gradient-to-br from-blue-900/30 to-indigo-900/30 border-blue-700/50' 
              : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Publisher Actions</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={() => setShowContactModal(true)}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>Contact Publisher</span>
              </button>

              <button 
                className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-colors ${
                  publisher.isActive 
                    ? 'bg-red-500 text-white hover:bg-red-600' 
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                {publisher.isActive ? (
                  <>
                    <XCircle className="w-4 h-4" />
                    <span>Deactivate Publisher</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Activate Publisher</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Contact Modal */}
        {showContactModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-60 flex items-center justify-center p-4">
            <div className={`rounded-2xl shadow-2xl border max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-colors ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className={`text-xl font-semibold ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>Contact Publisher</h3>
                    <p className={`mt-1 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>Send a message to {publisher.displayName} (@{publisher.nickname})</p>
                  </div>
                  <button
                    onClick={resetContactForm}
                    className={`transition-colors ${
                      isDarkMode 
                        ? 'text-gray-400 hover:text-gray-200' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                    disabled={sendingContact}
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-6">
                  {/* Contact Type Selection */}
                  <div>
                    <label className={`block text-sm font-medium mb-3 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>Contact Method</label>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setContactForm(prev => ({ ...prev, type: 'email' }))}
                        className={`flex flex-col items-center p-4 border-2 rounded-xl transition-colors ${
                          contactForm.type === 'email'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : isDarkMode
                              ? 'border-gray-600 hover:border-gray-500 text-gray-300'
                              : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        }`}
                      >
                        <Mail className="w-6 h-6 mb-2" />
                        <span className="text-sm font-medium">Email Only</span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setContactForm(prev => ({ ...prev, type: 'notification' }))}
                        className={`flex flex-col items-center p-4 border-2 rounded-xl transition-colors ${
                          contactForm.type === 'notification'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : isDarkMode
                              ? 'border-gray-600 hover:border-gray-500 text-gray-300'
                              : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        }`}
                      >
                        <Bell className="w-6 h-6 mb-2" />
                        <span className="text-sm font-medium">In-App Only</span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setContactForm(prev => ({ ...prev, type: 'both' }))}
                        className={`flex flex-col items-center p-4 border-2 rounded-xl transition-colors ${
                          contactForm.type === 'both'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : isDarkMode
                              ? 'border-gray-600 hover:border-gray-500 text-gray-300'
                              : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        }`}
                      >
                        <div className="flex space-x-1 mb-2">
                          <Mail className="w-5 h-5" />
                          <Bell className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-medium">Both</span>
                      </button>
                    </div>
                  </div>

                  {/* Priority Dropdown */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>Priority</label>
                    <div className="relative">
                      <button
                        type="button"
                        className={`relative w-full border rounded-xl shadow-sm pl-3 pr-10 py-3 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
                      >
                        <span className={`block truncate font-medium ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {contactForm.priority === 'low' && 'Low Priority'}
                          {contactForm.priority === 'medium' && 'Medium Priority'}
                          {contactForm.priority === 'high' && 'High Priority'}
                          {contactForm.priority === 'urgent' && 'Urgent'}
                        </span>
                        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                          <svg className={`h-5 w-5 transition-transform duration-200 ${
                            showPriorityDropdown ? 'rotate-180' : ''
                          } ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </span>
                      </button>

                      {showPriorityDropdown && (
                        <>
                          <div 
                            className="fixed inset-0 z-10"
                            onClick={() => setShowPriorityDropdown(false)}
                          />
                          <div className={`absolute z-20 mt-1 w-full shadow-lg max-h-60 rounded-xl py-1 ring-1 ring-opacity-5 overflow-auto focus:outline-none transition-colors ${
                            isDarkMode 
                              ? 'bg-gray-800 ring-gray-600' 
                              : 'bg-white ring-black'
                          }`}>
                            {[
                              { value: 'low', label: 'Low Priority' },
                              { value: 'medium', label: 'Medium Priority' },
                              { value: 'high', label: 'High Priority' },
                              { value: 'urgent', label: 'Urgent' }
                            ].map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                className={`w-full text-left relative cursor-pointer select-none py-2 pl-3 pr-9 transition-colors ${
                                  contactForm.priority === option.value 
                                    ? isDarkMode
                                      ? 'bg-blue-900/50 text-blue-300 font-semibold'
                                      : 'bg-blue-50 text-blue-900 font-semibold'
                                    : isDarkMode
                                      ? 'text-gray-300 font-medium hover:bg-gray-700 hover:text-white'
                                      : 'text-gray-900 font-medium hover:bg-blue-50 hover:text-blue-900'
                                }`}
                                onClick={() => {
                                  setContactForm(prev => ({ ...prev, priority: option.value }));
                                  setShowPriorityDropdown(false);
                                }}
                              >
                                <span className="block truncate">{option.label}</span>
                                {contactForm.priority === option.value && (
                                  <span className={`absolute inset-y-0 right-0 flex items-center pr-3 ${
                                    isDarkMode ? 'text-blue-400' : 'text-blue-600'
                                  }`}>
                                    <CheckCircle className="h-4 w-4" />
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>Subject</label>
                    <input
                      type="text"
                      value={contactForm.subject}
                      onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="Enter message subject..."
                      maxLength={100}
                    />
                    <div className={`text-xs mt-1 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {contactForm.subject.length}/100 characters
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>Message</label>
                    <textarea
                      value={contactForm.message}
                      onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      rows="6"
                      placeholder="Type your message here..."
                      maxLength={1000}
                    />
                    <div className={`text-xs mt-1 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {contactForm.message.length}/1000 characters
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-3 mt-8">
                  <button
                    onClick={resetContactForm}
                    className={`flex-1 px-6 py-3 border rounded-xl transition-colors ${
                      isDarkMode 
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                    disabled={sendingContact}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleContactSubmit}
                    disabled={sendingContact || !contactForm.subject.trim() || !contactForm.message.trim()}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {sendingContact ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
