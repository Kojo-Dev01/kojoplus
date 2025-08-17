'use client';

import { useState, useEffect } from 'react';
import { X, Send, Users, Mail, AlertCircle, CheckCircle, XCircle, ChevronDown } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export default function BulkEmailModal({ 
  isOpen, 
  onClose, 
  emails = [], 
  title = "Bulk Email", 
  subtitle = "",
  // Enhanced props for target group functionality
  getEmailsByGroup,
  getGroupCounts,
  isDataLoaded = true,
  isLoadingData = false
}) {
  const { isDarkMode } = useTheme();

  const [bulkMessageForm, setBulkMessageForm] = useState({
    type: 'email',
    subject: '',
    message: '',
    priority: 'medium',
    targetGroup: 'all'
  });
  const [sendingBulkMessage, setSendingBulkMessage] = useState(false);
  const [showTargetGroupDropdown, setShowTargetGroupDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [bulkMessageResults, setBulkMessageResults] = useState(null);
  const [showResultsModal, setShowResultsModal] = useState(false);

  // Determine if this is for affiliates or users based on the title
  const isAffiliateMode = title.toLowerCase().includes('affiliate');

  // Get target group options based on mode
  const getTargetGroupOptions = () => {
    if (isAffiliateMode) {
      return [
        { value: 'all', label: `All Affiliates (${targetCounts.all})` },
        { value: 'active', label: `Active Affiliates (${targetCounts.active})` },
        { value: 'inactive', label: `Inactive Affiliates (${targetCounts.inactive})` },
        { value: 'verified', label: `Verified Affiliates (${targetCounts.verified})` },
        { value: 'unverified', label: `Unverified Affiliates (${targetCounts.unverified})` },
        { value: 'telegram-joined', label: `Telegram Members (${targetCounts['telegram-joined']})` },
        { value: 'high-performers', label: `High Performers (${targetCounts['high-performers']})` }
      ];
    } else {
      // Default user options
      return [
        { value: 'all', label: `All Users (${targetCounts.all})` },
        { value: 'active', label: `Active Users (${targetCounts.active})` },
        { value: 'inactive', label: `Inactive Users (${targetCounts.inactive})` },
        { value: 'verified', label: `Verified Users (${targetCounts.verified})` },
        { value: 'unverified', label: `Unverified Users (${targetCounts.unverified})` }
      ];
    }
  };

  // Get current target emails based on selected group
  const getCurrentTargetEmails = () => {
    if (getEmailsByGroup && typeof getEmailsByGroup === 'function') {
      return getEmailsByGroup(bulkMessageForm.targetGroup);
    }
    return emails;
  };

  // Get group counts for display
  const getTargetCounts = () => {
    if (getGroupCounts && typeof getGroupCounts === 'function') {
      return getGroupCounts();
    }
    return {
      all: emails.length,
      active: 0,
      inactive: 0,
      verified: 0,
      unverified: 0
    };
  };

  const targetCounts = getTargetCounts();
  const currentTargetEmails = getCurrentTargetEmails();

  const handleBulkMessageSubmit = async () => {
    if (!bulkMessageForm.subject.trim() || !bulkMessageForm.message.trim() || currentTargetEmails.length === 0) {
      return;
    }

    setSendingBulkMessage(true);
    
    try {
      const token = localStorage.getItem('authToken');

      const response = await fetch('/api/admin/bulk-email', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          emails: currentTargetEmails,
          type: bulkMessageForm.type,
          subject: bulkMessageForm.subject,
          message: bulkMessageForm.message,
          priority: bulkMessageForm.priority,
          targetGroup: bulkMessageForm.targetGroup
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        setBulkMessageResults({
          success: true,
          sentCount: data.sentCount || currentTargetEmails.length,
          emailsSent: data.emailsSent || 0,
          notificationsSent: data.notificationsSent || 0,
          totalUsers: currentTargetEmails.length,
          messageType: bulkMessageForm.type,
          subject: bulkMessageForm.subject,
          targetGroup: bulkMessageForm.targetGroup,
          errors: data.errors || [],
          serviceUsed: data.serviceUsed || 'unknown',
          usedFallback: data.usedFallback || false
        });

        // Reset form
        setBulkMessageForm({
          type: 'email',
          subject: '',
          message: '',
          priority: 'medium',
          targetGroup: 'all'
        });
        
        setShowResultsModal(true);

      } else {
        const errorData = await response.json();
        
        setBulkMessageResults({
          success: false,
          error: errorData.error || 'Failed to send bulk message',
          totalUsers: currentTargetEmails.length,
          messageType: bulkMessageForm.type,
          targetGroup: bulkMessageForm.targetGroup
        });
        
        setShowResultsModal(true);
      }

    } catch (error) {
      console.error('Error sending bulk message:', error);
      
      setBulkMessageResults({
        success: false,
        error: 'Network error. Please try again.',
        totalUsers: currentTargetEmails.length,
        messageType: bulkMessageForm.type,
        targetGroup: bulkMessageForm.targetGroup
      });
      
      setShowResultsModal(true);
      
    } finally {
      setSendingBulkMessage(false);
    }
  };

  const resetBulkMessageForm = () => {
    if (!sendingBulkMessage) {
      setBulkMessageForm({
        type: 'email',
        subject: '',
        message: '',
        priority: 'medium',
        targetGroup: 'all'
      });
      onClose();
    }
  };

  const handleCloseResults = () => {
    setShowResultsModal(false);
    setBulkMessageResults(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className={`rounded-2xl shadow-2xl border max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-colors ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className={`text-xl font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>{title}</h3>
                <div className="mt-1 space-y-1">
                  <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>{subtitle}</p>
                  
                  {/* Data Loading Status */}
                  {isLoadingData && (
                    <div className="flex items-center space-x-2 text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm">Loading user data...</span>
                    </div>
                  )}
                  
                  {isDataLoaded && !isLoadingData && (
                    <div className="flex items-center space-x-2 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">All user data loaded</span>
                    </div>
                  )}
                  
                  {/* Current Target Info */}
                  <div className={`flex items-center space-x-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    <Users className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {currentTargetEmails.length} recipients selected
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={resetBulkMessageForm}
                className={`transition-colors ${
                  isDarkMode 
                    ? 'text-gray-400 hover:text-gray-200' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                disabled={sendingBulkMessage}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-6">
              {/* Target Group Selection */}
              {getEmailsByGroup && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Target Group</label>
                  <div className="relative">
                    <button
                      type="button"
                      className={`relative w-full border rounded-xl shadow-sm pl-3 pr-10 py-3 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      onClick={() => setShowTargetGroupDropdown(!showTargetGroupDropdown)}
                      disabled={sendingBulkMessage || isLoadingData}
                    >
                      <span className={`block truncate font-medium ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {bulkMessageForm.targetGroup === 'all' && `All Users (${targetCounts.all})`}
                        {bulkMessageForm.targetGroup === 'active' && `Active Users (${targetCounts.active})`}
                        {bulkMessageForm.targetGroup === 'inactive' && `Inactive Users (${targetCounts.inactive})`}
                        {bulkMessageForm.targetGroup === 'verified' && `Verified Users (${targetCounts.verified})`}
                        {bulkMessageForm.targetGroup === 'unverified' && `Unverified Users (${targetCounts.unverified})`}
                      </span>
                      <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${
                          showTargetGroupDropdown ? 'rotate-180' : ''
                        } ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                      </span>
                    </button>

                    {showTargetGroupDropdown && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowTargetGroupDropdown(false)} />
                        <div className={`absolute z-20 mt-1 w-full shadow-lg max-h-60 rounded-xl py-1 ring-1 ring-opacity-5 overflow-auto focus:outline-none transition-colors ${
                          isDarkMode 
                            ? 'bg-gray-800 ring-gray-600' 
                            : 'bg-white ring-black'
                        }`}>
                          {getTargetGroupOptions().map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              className={`w-full text-left relative cursor-pointer select-none py-2 pl-3 pr-9 transition-colors ${
                                bulkMessageForm.targetGroup === option.value 
                                  ? isDarkMode
                                    ? 'bg-blue-900/50 text-blue-300 font-semibold'
                                    : 'bg-blue-50 text-blue-900 font-semibold'
                                  : isDarkMode
                                    ? 'text-gray-300 font-medium hover:bg-gray-700 hover:text-white'
                                    : 'text-gray-900 font-medium hover:bg-blue-50 hover:text-blue-900'
                              }`}
                              onClick={() => {
                                setBulkMessageForm(prev => ({ ...prev, targetGroup: option.value }));
                                setShowTargetGroupDropdown(false);
                              }}
                            >
                              <span className="block truncate">{option.label}</span>
                              {bulkMessageForm.targetGroup === option.value && (
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
              )}

              {/* Message Type Selection */}
              <div>
                <label className={`block text-sm font-medium mb-3 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>Message Type</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setBulkMessageForm(prev => ({ ...prev, type: 'email' }))}
                    className={`flex flex-col items-center p-4 border-2 rounded-xl transition-colors ${
                      bulkMessageForm.type === 'email'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : isDarkMode
                          ? 'border-gray-600 hover:border-gray-500 text-gray-300'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <Mail className="w-6 h-6 mb-2" />
                    <span className="text-sm font-medium">Email Only</span>
                    <span className={`text-xs mt-1 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>Send via email</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setBulkMessageForm(prev => ({ ...prev, type: 'notification' }))}
                    className={`flex flex-col items-center p-4 border-2 rounded-xl transition-colors ${
                      bulkMessageForm.type === 'notification'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : isDarkMode
                          ? 'border-gray-600 hover:border-gray-500 text-gray-300'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <Mail className="w-6 h-6 mb-2" />
                    <span className="text-sm font-medium">In-App Only</span>
                    <span className={`text-xs mt-1 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>Send as notification</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setBulkMessageForm(prev => ({ ...prev, type: 'both' }))}
                    className={`flex flex-col items-center p-4 border-2 rounded-xl transition-colors ${
                      bulkMessageForm.type === 'both'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : isDarkMode
                          ? 'border-gray-600 hover:border-gray-500 text-gray-300'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <div className="flex space-x-1 mb-2">
                      <Mail className="w-5 h-5" />
                      <Mail className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium">Both</span>
                    <span className={`text-xs mt-1 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>Email + notification</span>
                  </button>
                </div>
              </div>

              {/* Priority Selection */}
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
                      {bulkMessageForm.priority === 'low' && 'Low Priority'}
                      {bulkMessageForm.priority === 'medium' && 'Medium Priority'}
                      {bulkMessageForm.priority === 'high' && 'High Priority'}
                      {bulkMessageForm.priority === 'urgent' && 'Urgent'}
                    </span>
                    <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${
                        showPriorityDropdown ? 'rotate-180' : ''
                      } ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
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
                              bulkMessageForm.priority === option.value 
                                ? isDarkMode
                                  ? 'bg-blue-900/50 text-blue-300 font-semibold'
                                  : 'bg-blue-50 text-blue-900 font-semibold'
                                : isDarkMode
                                  ? 'text-gray-300 font-medium hover:bg-gray-700 hover:text-white'
                                  : 'text-gray-900 font-medium hover:bg-blue-50 hover:text-blue-900'
                            }`}
                            onClick={() => {
                              setBulkMessageForm(prev => ({ ...prev, priority: option.value }));
                              setShowPriorityDropdown(false);
                            }}
                          >
                            <span className="block truncate">{option.label}</span>
                            {bulkMessageForm.priority === option.value && (
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
                  value={bulkMessageForm.subject}
                  onChange={(e) => setBulkMessageForm(prev => ({ ...prev, subject: e.target.value }))}
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
                  {bulkMessageForm.subject.length}/100 characters
                </div>
              </div>

              {/* Message */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>Message</label>
                <textarea
                  value={bulkMessageForm.message}
                  onChange={(e) => setBulkMessageForm(prev => ({ ...prev, message: e.target.value }))}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  rows="6"
                  placeholder="Type your bulk message here..."
                  maxLength={1000}
                />
                <div className={`text-xs mt-1 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {bulkMessageForm.message.length}/1000 characters
                </div>
              </div>

              {/* Enhanced Preview */}
              <div className={`rounded-xl p-4 border transition-colors ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <h4 className={`text-sm font-semibold mb-3 ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-800'
                }`}>Message Preview</h4>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className={`font-semibold ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-800'
                    }`}>Recipients:</span> 
                    <span className={`ml-2 font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {emails.length} email{emails.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className={`font-semibold ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-800'
                    }`}>Delivery Method:</span> 
                    <span className={`ml-2 font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {bulkMessageForm.type === 'email' && 'Email'}
                      {bulkMessageForm.type === 'notification' && 'In-App Notification'}
                      {bulkMessageForm.type === 'both' && 'Email + In-App Notification'}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className={`font-semibold ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-800'
                    }`}>Priority:</span> 
                    <span className={`ml-2 font-semibold capitalize ${
                      bulkMessageForm.priority === 'urgent' ? 'text-red-400' :
                      bulkMessageForm.priority === 'high' ? 'text-orange-400' :
                      bulkMessageForm.priority === 'medium' ? 'text-blue-400' :
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {bulkMessageForm.priority}
                    </span>
                  </div>
                  {bulkMessageForm.subject && (
                    <div className="text-sm">
                      <span className={`font-semibold ${
                        isDarkMode ? 'text-gray-200' : 'text-gray-800'
                      }`}>Subject:</span> 
                      <span className={`ml-2 font-medium ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>{bulkMessageForm.subject}</span>
                    </div>
                  )}
                  {bulkMessageForm.message && (
                    <div className="text-sm">
                      <span className={`font-semibold ${
                        isDarkMode ? 'text-gray-200' : 'text-gray-800'
                      }`}>Message Preview:</span>
                      <div className={`mt-2 p-3 rounded-lg border transition-colors ${
                        isDarkMode 
                          ? 'bg-gray-600 border-gray-500' 
                          : 'bg-white border-gray-200'
                      }`}>
                        <p className={`whitespace-pre-wrap text-sm leading-relaxed ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {bulkMessageForm.message.length > 200 
                            ? `${bulkMessageForm.message.substring(0, 200)}...` 
                            : bulkMessageForm.message}
                        </p>
                        {bulkMessageForm.message.length > 200 && (
                          <p className={`text-xs mt-2 italic ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>Message truncated for preview</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Helper text for affiliate mode */}
              {isAffiliateMode && (
                <div className="mt-2 text-xs text-gray-500">
                  {bulkMessageForm.targetGroup === 'high-performers' && (
                    <p>High performers: Affiliates with 5+ referrals or $100+ in commissions</p>
                  )}
                  {bulkMessageForm.targetGroup === 'telegram-joined' && (
                    <p>Telegram members: Affiliates who have joined the Telegram group</p>
                  )}
                  {bulkMessageForm.targetGroup === 'verified' && (
                    <p>Verified affiliates: Those with verified Exness accounts</p>
                  )}
                </div>
              )}

              {/* Enhanced Warning Notice for affiliates */}
              <div className={`border rounded-xl p-4 ${
                isAffiliateMode 
                  ? isDarkMode
                    ? 'bg-blue-900/20 border-blue-800'
                    : 'bg-blue-50 border-blue-200' 
                  : isDarkMode
                    ? 'bg-amber-900/20 border-amber-800'
                    : 'bg-amber-50 border-amber-200'
              }`}>
                <div className="flex items-start space-x-3">
                  <svg className={`w-5 h-5 mt-0.5 ${
                    isAffiliateMode 
                      ? isDarkMode ? 'text-blue-400' : 'text-blue-600'
                      : isDarkMode ? 'text-amber-400' : 'text-amber-600'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className={`text-sm font-semibold ${
                      isAffiliateMode 
                        ? isDarkMode ? 'text-blue-300' : 'text-blue-800'
                        : isDarkMode ? 'text-amber-300' : 'text-amber-800'
                    }`}>
                      {isAffiliateMode ? 'Affiliate Partnership Communication' : 'Important Notice'}
                    </h4>
                    <p className={`text-sm mt-1 ${
                      isAffiliateMode 
                        ? isDarkMode ? 'text-blue-200' : 'text-blue-700'
                        : isDarkMode ? 'text-amber-200' : 'text-amber-700'
                    }`}>
                      {isAffiliateMode ? (
                        <>
                          This will send a professional message to <strong>{currentTargetEmails.length} affiliate partner{currentTargetEmails.length !== 1 ? 's' : ''}</strong>. 
                          Ensure your message maintains a professional tone suitable for business partnerships and includes relevant affiliate program information.
                        </>
                      ) : (
                        <>
                          This will send a message to <strong>{currentTargetEmails.length} recipient{currentTargetEmails.length !== 1 ? 's' : ''}</strong>. 
                          Please review your message carefully before sending.
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Warning for large recipient count */}
              {currentTargetEmails.length > 1000 && (
                <div className={`border rounded-lg p-3 ${
                  isDarkMode 
                    ? 'bg-yellow-900/20 border-yellow-800' 
                    : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-center">
                    <AlertCircle className={`w-5 h-5 mr-2 ${
                      isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                    }`} />
                    <p className={`text-sm ${
                      isDarkMode ? 'text-yellow-200' : 'text-yellow-800'
                    }`}>
                      You&apos;re about to send to {currentTargetEmails.length} recipients. This may take several minutes to complete.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex space-x-3 mt-8">
              <button
                onClick={resetBulkMessageForm}
                className={`flex-1 px-6 py-3 border rounded-xl transition-colors ${
                  isDarkMode 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
                disabled={sendingBulkMessage}
              >
                Cancel
              </button>
              <button
                onClick={handleBulkMessageSubmit}
                disabled={
                  sendingBulkMessage || 
                  !bulkMessageForm.subject.trim() || 
                  !bulkMessageForm.message.trim() || 
                  currentTargetEmails.length === 0 ||
                  isLoadingData
                }
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {sendingBulkMessage ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Sending to {currentTargetEmails.length} recipients...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Send to {currentTargetEmails.length} Recipients</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Modal */}
      {showResultsModal && bulkMessageResults && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-70 flex items-center justify-center p-4">
          <div className={`rounded-2xl shadow-2xl border max-w-2xl w-full transition-colors ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    bulkMessageResults.success 
                      ? isDarkMode
                        ? 'bg-green-900/30'
                        : 'bg-green-100' 
                      : isDarkMode
                        ? 'bg-red-900/30'
                        : 'bg-red-100'
                  }`}>
                    {bulkMessageResults.success ? (
                      <CheckCircle className={`w-6 h-6 ${
                        isDarkMode ? 'text-green-400' : 'text-green-600'
                      }`} />
                    ) : (
                      <X className={`w-6 h-6 ${
                        isDarkMode ? 'text-red-400' : 'text-red-600'
                      }`} />
                    )}
                  </div>
                  <div>
                    <h3 className={`text-xl font-semibold ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {bulkMessageResults.success ? 'Messages Sent Successfully!' : 'Message Sending Failed'}
                    </h3>
                    <p className={`mt-1 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      Bulk messaging results for &quot;{bulkMessageResults.subject}&quot;
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseResults}
                  className={`transition-colors ${
                    isDarkMode 
                      ? 'text-gray-400 hover:text-gray-200' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {bulkMessageResults.success ? (
                <div className="space-y-6">
                  {/* Success Summary */}
                  <div className={`border rounded-xl p-4 ${
                    isDarkMode 
                      ? 'bg-green-900/20 border-green-800' 
                      : 'bg-green-50 border-green-200'
                  }`}>
                    <h4 className={`font-semibold mb-3 ${
                      isDarkMode ? 'text-green-300' : 'text-green-900'
                    }`}>Delivery Summary</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className={`text-sm font-medium ${
                          isDarkMode ? 'text-green-200' : 'text-green-700'
                        }`}>Total Recipients:</span>
                        <div className={`font-semibold ${
                          isDarkMode ? 'text-green-100' : 'text-green-900'
                        }`}>{bulkMessageResults.sentCount}</div>
                      </div>
                      <div>
                        <span className={`text-sm font-medium ${
                          isDarkMode ? 'text-green-200' : 'text-green-700'
                        }`}>Message Type:</span>
                        <div className={`font-semibold capitalize ${
                          isDarkMode ? 'text-green-100' : 'text-green-900'
                        }`}>{bulkMessageResults.messageType}</div>
                      </div>
                      {bulkMessageResults.messageType !== 'notification' && (
                        <div>
                          <span className={`text-sm font-medium ${
                            isDarkMode ? 'text-green-200' : 'text-green-700'
                          }`}>Emails Sent:</span>
                          <div className={`font-semibold ${
                            isDarkMode ? 'text-green-100' : 'text-green-900'
                          }`}>{bulkMessageResults.emailsSent}</div>
                        </div>
                      )}
                      {bulkMessageResults.messageType !== 'email' && (
                        <div>
                          <span className={`text-sm font-medium ${
                            isDarkMode ? 'text-green-200' : 'text-green-700'
                          }`}>Notifications Sent:</span>
                          <div className={`font-semibold ${
                            isDarkMode ? 'text-green-100' : 'text-green-900'
                          }`}>{bulkMessageResults.notificationsSent}</div>
                        </div>
                      )}
                      <div>
                        <span className={`text-sm font-medium ${
                          isDarkMode ? 'text-green-200' : 'text-green-700'
                        }`}>Service Used:</span>
                        <div className={`font-semibold ${
                          isDarkMode ? 'text-green-100' : 'text-green-900'
                        }`}>
                          {bulkMessageResults.serviceUsed}
                          {bulkMessageResults.usedFallback && (
                            <span className="text-xs text-orange-600 ml-1">(fallback)</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Success Rate */}
                  <div className={`rounded-xl p-4 ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-medium ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>Success Rate</span>
                      <span className={`text-2xl font-bold ${
                        isDarkMode ? 'text-green-400' : 'text-green-600'
                      }`}>
                        {Math.round((bulkMessageResults.sentCount / bulkMessageResults.totalUsers) * 100)}%
                      </span>
                    </div>
                    <div className={`w-full rounded-full h-2 ${
                      isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
                    }`}>
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${(bulkMessageResults.sentCount / bulkMessageResults.totalUsers) * 100}%` }}
                      ></div>
                    </div>
                    <div className={`text-sm mt-1 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {bulkMessageResults.sentCount} of {bulkMessageResults.totalUsers} recipients reached
                    </div>
                  </div>

                  {/* Errors if any */}
                  {bulkMessageResults.errors && bulkMessageResults.errors.length > 0 && (
                    <div className={`border rounded-xl p-4 ${
                      isDarkMode 
                        ? 'bg-amber-900/20 border-amber-800' 
                        : 'bg-amber-50 border-amber-200'
                    }`}>
                      <h4 className={`font-semibold mb-3 ${
                        isDarkMode ? 'text-amber-300' : 'text-amber-900'
                      }`}>
                        Partial Issues ({bulkMessageResults.errors.length})
                      </h4>
                      <div className={`text-sm space-y-1 max-h-32 overflow-y-auto ${
                        isDarkMode ? 'text-amber-200' : 'text-amber-800'
                      }`}>
                        {bulkMessageResults.errors.slice(0, 5).map((error, index) => (
                          <div key={index} className="break-words">• {error}</div>
                        ))}
                        {bulkMessageResults.errors.length > 5 && (
                          <div className="italic">... and {bulkMessageResults.errors.length - 5} more issues</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Error Details */}
                  <div className={`border rounded-xl p-4 ${
                    isDarkMode 
                      ? 'bg-red-900/20 border-red-800' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <h4 className={`font-semibold mb-3 ${
                      isDarkMode ? 'text-red-300' : 'text-red-900'
                    }`}>Error Details</h4>
                    <div className={isDarkMode ? 'text-red-200' : 'text-red-800'}>
                      <p className="mb-2">{bulkMessageResults.error}</p>
                      <div className="text-sm">
                        <span className="font-medium">Recipients:</span> {bulkMessageResults.totalUsers}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Message Type:</span> {bulkMessageResults.messageType}
                      </div>
                    </div>
                  </div>

                  {/* Help Section */}
                  <div className={`border rounded-xl p-4 ${
                    isDarkMode 
                      ? 'bg-blue-900/20 border-blue-800' 
                      : 'bg-blue-50 border-blue-200'
                  }`}>
                    <h4 className={`font-semibold mb-2 ${
                      isDarkMode ? 'text-blue-300' : 'text-blue-900'
                    }`}>What to do next?</h4>
                    <div className={`text-sm space-y-1 ${
                      isDarkMode ? 'text-blue-200' : 'text-blue-800'
                    }`}>
                      <p>• Check your internet connection and try again</p>
                      <p>• Verify that your email configuration is working</p>
                      <p>• Consider reducing the number of recipients</p>
                      <p>• Contact support if the issue persists</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Results Actions */}
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleCloseResults}
                  className={`flex-1 px-6 py-3 border rounded-xl transition-colors ${
                    isDarkMode 
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Close
                </button>
                {!bulkMessageResults.success && (
                  <button
                    onClick={() => {
                      handleCloseResults();
                      // Reopen the main modal to try again
                    }}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    Try Again
                  </button>
                )}
                {bulkMessageResults.success && (
                  <button
                    onClick={() => {
                      handleCloseResults();
                      resetBulkMessageForm();
                    }}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    Send Another Message
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
