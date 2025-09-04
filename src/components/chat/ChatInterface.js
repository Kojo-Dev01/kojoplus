'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  Phone, 
  Video, 
  MoreVertical, 
  Paperclip, 
  Smile, 
  ArrowLeft,
  Clock,
  CheckCircle,
  Check,
  User,
  Mail,
  XCircle,
  PlayCircle,
  Archive,
  RotateCcw,
  File,
  Download,
  Upload,
  ExternalLink
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export default function ChatInterface({ isOpen, onClose, enquiry, onStatusUpdate, mode = 'modal' }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const lastMessageCountRef = useRef(0);
  const autoReloadIntervalRef = useRef(null);
  
  const { isDarkMode } = useTheme();

  // Initial load effect
  useEffect(() => {
    if (isOpen && enquiry) {
      fetchMessages();
    }
  }, [isOpen, enquiry]);

  // Auto-reload effect for background updates
  useEffect(() => {
    if (isOpen && enquiry) {
      // Clear any existing interval
      if (autoReloadIntervalRef.current) {
        clearInterval(autoReloadIntervalRef.current);
      }

      // Set up new interval for background reloads every 3 seconds
      autoReloadIntervalRef.current = setInterval(() => {
        fetchMessagesInBackground();
      }, 3000);

      // Cleanup interval on unmount or when modal closes
      return () => {
        if (autoReloadIntervalRef.current) {
          clearInterval(autoReloadIntervalRef.current);
        }
      };
    }
  }, [isOpen, enquiry]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async (isBackground = false) => {
    try {
      if (!isBackground) {
        setLoading(true);
      }
      
      const response = await fetch(`/api/enquiries/${enquiry._id}/responses`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        const newMessages = data.responses || [];
        
        // Only update state if messages have actually changed
        setMessages(prevMessages => {
          // Compare message counts and IDs to detect changes
          if (prevMessages.length !== newMessages.length) {
            lastMessageCountRef.current = newMessages.length;
            return newMessages;
          }
          
          // Check if any message IDs are different
          const hasChanges = newMessages.some((msg, index) => 
            !prevMessages[index] || prevMessages[index]._id !== msg._id
          );
          
          if (hasChanges) {
            lastMessageCountRef.current = newMessages.length;
            return newMessages;
          }
          
          return prevMessages;
        });
      }
    } catch (error) {
      // Only log errors for non-background requests to avoid console spam
      if (!isBackground) {
        console.error('Error fetching messages:', error);
      }
    } finally {
      if (!isBackground) {
        setLoading(false);
      }
    }
  };

  const fetchMessagesInBackground = async () => {
    // Only fetch if the component is still mounted and modal is open
    if (isOpen && enquiry) {
      await fetchMessages(true);
    }
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const sendMessage = async () => {
    if (!newMessage.trim() && attachments.length === 0) return;

    try {
      setUploadingFiles(true);
      
      const formData = new FormData();
      formData.append('message', newMessage.trim());
      
      // Add attachments
      attachments.forEach((file, index) => {
        formData.append('attachments', file);
      });

      const response = await fetch(`/api/enquiries/${enquiry._id}/respond`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        
        // Add the new message to the list
        setMessages(prev => [...prev, data.response]);

        updateEnquiryStatus('in-progress')
        
        // Clear form
        setNewMessage('');
        setAttachments([]);
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        // Force a background refresh shortly after sending to get any server-side updates
        setTimeout(() => {
          fetchMessagesInBackground();
        }, 1000);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setUploadingFiles(false);
    }
  };

  const updateEnquiryStatus = async (status) => {
    try {
      setUpdating(true);
      const response = await fetch(`/api/enquiries/${enquiry._id}`, {
        method: 'PATCH',
        credentials: 'include',
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        const data = await response.json();
        // Update local enquiry object
        enquiry.status = status;
        onStatusUpdate?.(enquiry._id, status);
        
        // Refresh messages after status update
        setTimeout(() => {
          fetchMessagesInBackground();
        }, 500);
      }
    } catch (error) {
      console.error('Error updating enquiry status:', error);
    } finally {
      setUpdating(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Check if it's today
    if (date.toDateString() === today.toDateString()) {
      return `Today ${formatTime(dateString)}`;
    }
    
    // Check if it's yesterday
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday ${formatTime(dateString)}`;
    }
    
    // Check if it's within this week
    const daysDiff = Math.floor((today - date) / (1000 * 60 * 60 * 24));
    if (daysDiff < 7) {
      return `${date.toLocaleDateString('en-US', { weekday: 'short' })} ${formatTime(dateString)}`;
    }
    
    // For older messages, show full date
    return `${formatDate(dateString)} ${formatTime(dateString)}`;
  };

  const shouldShowDateSeparator = (currentMessage, previousMessage) => {
    if (!previousMessage) return true;
    
    const currentDate = new Date(currentMessage.createdAt).toDateString();
    const previousDate = new Date(previousMessage.createdAt).toDateString();
    
    return currentDate !== previousDate;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sending':
        return <Clock className="w-3 h-3 text-gray-400" />;
      case 'sent':
        return <Check className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return <CheckCircle className="w-3 h-3 text-blue-500" />;
      default:
        return <CheckCircle className="w-3 h-3 text-blue-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return isDarkMode 
          ? 'bg-orange-900/30 text-orange-200 border-orange-600' 
          : 'bg-orange-100 text-orange-800 border-orange-300';
      case 'in_progress':
        return isDarkMode 
          ? 'bg-blue-900/30 text-blue-200 border-blue-600' 
          : 'bg-blue-100 text-blue-800 border-blue-300';
      case 'resolved':
        return isDarkMode 
          ? 'bg-green-900/30 text-green-200 border-green-600' 
          : 'bg-green-100 text-green-800 border-green-300';
      case 'closed':
        return isDarkMode 
          ? 'bg-gray-900/30 text-gray-200 border-gray-600' 
          : 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return isDarkMode 
          ? 'bg-gray-900/30 text-gray-200 border-gray-600' 
          : 'bg-gray-100 text-gray-600 border-gray-300';
    }
  };

  const getStatusActions = () => {
    const actions = [];
    
    switch (enquiry?.status) {
      case 'pending':
        actions.push({
          label: 'Start Progress',
          status: 'in-progress',
          icon: PlayCircle,
          color: 'bg-blue-600 hover:bg-blue-700',
          description: 'Mark as in progress'
        });
        actions.push({
          label: 'Close',
          status: 'closed',
          icon: XCircle,
          color: 'bg-gray-500 hover:bg-gray-600',
          description: 'Close without resolution'
        });
        break;
        
      case 'in-progress':
        actions.push({
          label: 'Resolve',
          status: 'resolved',
          icon: CheckCircle,
          color: 'bg-green-600 hover:bg-green-700',
          description: 'Mark as resolved'
        });
        actions.push({
          label: 'Close',
          status: 'closed',
          icon: XCircle,
          color: 'bg-gray-500 hover:bg-gray-600',
          description: 'Close without resolution'
        });
        break;
        
      case 'resolved':
        actions.push({
          label: 'Reopen',
          status: 'in-progress',
          icon: RotateCcw,
          color: 'bg-amber-600 hover:bg-amber-700',
          description: 'Reopen enquiry'
        });
        actions.push({
          label: 'Archive',
          status: 'closed',
          icon: Archive,
          color: 'bg-gray-500 hover:bg-gray-600',
          description: 'Archive enquiry'
        });
        break;
        
      case 'closed':
        actions.push({
          label: 'Reopen',
          status: 'in-progress',
          icon: RotateCcw,
          color: 'bg-amber-600 hover:bg-amber-700',
          description: 'Reopen enquiry'
        });
        break;
        
      default:
        break;
    }
    
    return actions;
  };

  // Enhanced link detection and rendering utility
  const detectAndRenderLinks = (text) => {
    // Add null/undefined check at the beginning
    if (!text || typeof text !== 'string') {
      return text || '';
    }

    // Enhanced regex patterns for different link types
    const patterns = {
      // Standard URLs (http/https)
      url: /(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/gi,
      // Email addresses
      email: /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,
      // Phone numbers (various formats)
      phone: /(\+?[\d\s\-\(\)]{10,})/gi,
      // Domain names without protocol
      domain: /(?<!https?:\/\/)(?<!mailto:)(?<!\w)([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(?!\w)/gi,
      // IP addresses
      ip: /(?<![\d.])\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b(?![\d.])/gi
    };

    // Split text into segments and identify link types
    const segments = [];
    let lastIndex = 0;
    const allMatches = [];

    // Find all matches for all patterns
    Object.entries(patterns).forEach(([type, pattern]) => {
      let match;
      pattern.lastIndex = 0; // Reset regex state
      while ((match = pattern.exec(text)) !== null) {
        allMatches.push({
          type,
          match: match[0],
          start: match.index,
          end: match.index + match[0].length
        });
      }
    });

    // Sort matches by position
    allMatches.sort((a, b) => a.start - b.start);

    // Remove overlapping matches (prefer longer/more specific matches)
    const filteredMatches = [];
    allMatches.forEach((match, index) => {
      const hasOverlap = filteredMatches.some(existing => 
        (match.start >= existing.start && match.start < existing.end) ||
        (match.end > existing.start && match.end <= existing.end) ||
        (match.start <= existing.start && match.end >= existing.end)
      );
      
      if (!hasOverlap) {
        filteredMatches.push(match);
      }
    });

    // Build segments with text and links
    filteredMatches.forEach((match, index) => {
      // Add text before this match
      if (match.start > lastIndex) {
        segments.push({
          type: 'text',
          content: text.slice(lastIndex, match.start)
        });
      }

      // Add the link
      segments.push({
        type: 'link',
        linkType: match.type,
        content: match.match,
        href: generateHref(match.type, match.match)
      });

      lastIndex = match.end;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      segments.push({
        type: 'text',
        content: text.slice(lastIndex)
      });
    }

    // If no links found, return original text
    if (segments.length === 0) {
      return text;
    }

    return segments;
  };

  // Generate appropriate href for different link types
  const generateHref = (type, content) => {
    switch (type) {
      case 'url':
        return content;
      case 'email':
        return `mailto:${content}`;
      case 'phone':
        // Clean phone number for tel: link
        const cleanPhone = content.replace(/[^\d+]/g, '');
        return `tel:${cleanPhone}`;
      case 'domain':
        return `https://${content}`;
      case 'ip':
        return `https://${content}`;
      default:
        return content;
    }
  };

  // Get link icon based on type
  const getLinkIcon = (linkType) => {
    switch (linkType) {
      case 'email':
        return <Mail className="w-3 h-3" />;
      case 'phone':
        return <Phone className="w-3 h-3" />;
      case 'url':
      case 'domain':
      case 'ip':
      default:
        return <ExternalLink className="w-3 h-3" />;
    }
  };

  // Get link color based on type and theme
  const getLinkColor = (linkType) => {
    const colors = {
      email: isDarkMode ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-700',
      phone: isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700',
      url: isDarkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700',
      domain: isDarkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700',
      ip: isDarkMode ? 'text-orange-400 hover:text-orange-300' : 'text-orange-600 hover:text-orange-700'
    };
    return colors[linkType] || colors.url;
  };

  // Render message content with enhanced link detection
  const renderMessageContent = (content) => {
    // Add robust null/undefined checks
    if (!content || typeof content !== 'string') {
      return <span className="whitespace-pre-wrap break-words">{content || ''}</span>;
    }

    const segments = detectAndRenderLinks(content);
    
    // Check if segments is still a string (no links found)
    if (typeof segments === 'string') {
      return (
        <span className="whitespace-pre-wrap break-words">
          {segments}
        </span>
      );
    }

    // Check if segments is an array before mapping
    if (!Array.isArray(segments)) {
      return (
        <span className="whitespace-pre-wrap break-words">
          {content}
        </span>
      );
    }

    // Render segments with enhanced link styling
    return (
      <span className="whitespace-pre-wrap break-words">
        {segments.map((segment, index) => {
          if (segment.type === 'text') {
            return segment.content;
          } else if (segment.type === 'link') {
            return (
              <a
                key={index}
                href={segment.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1 underline underline-offset-2 decoration-2 transition-colors ${getLinkColor(segment.linkType)}`}
                title={`${segment.linkType}: ${segment.content}`}
              >
                {getLinkIcon(segment.linkType)}
                <span>{segment.content}</span>
              </a>
            );
          }
          return null;
        })}
      </span>
    );
  };

  if (!isOpen) return null;

  const customerName = enquiry?.customerName || enquiry?.firstName 
    ? `${enquiry.firstName || ''} ${enquiry.lastName || ''}`.trim() 
    : 'Unknown Customer';
  const customerEmail = enquiry?.email || 'No email provided';
  const containerHeight = mode === 'embedded' ? 'calc(100vh - 80px)' : '80vh';

  const content = (
    <div 
      className={`flex flex-col overflow-hidden transition-colors ${
        mode === 'embedded' 
          ? isDarkMode ? 'bg-gray-800' : 'bg-white' 
          : `rounded-2xl shadow-2xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`
      }`}
      style={{ height: containerHeight }}
    >
      <div className={`flex-shrink-0 p-4 border-b transition-colors ${
        isDarkMode 
          ? 'bg-gray-700 border-gray-600' 
          : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            
            <div className="flex-1">
              <h3 className={`font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {customerName}
              </h3>
              <div className="flex items-center space-x-2">
                <Mail className={`w-3 h-3 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {customerEmail}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
              getStatusColor(enquiry?.status)
            }`}>
              {enquiry?.status === 'in-progress' ? 'In Progress' : 
               enquiry?.status === 'pending' ? 'Pending' :
               enquiry?.status === 'resolved' ? 'Resolved' :
               enquiry?.status === 'closed' ? 'Closed' : 'Unknown'}
            </span>

            {enquiry?.phone && (
              <button 
                className={`p-2 rounded transition-colors ${
                  isDarkMode 
                    ? 'hover:bg-gray-600 text-gray-400' 
                    : 'hover:bg-gray-200 text-gray-500'
                }`}
                title={`Phone: ${enquiry.phone}`}
              >
                <Phone className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusActions().map((action) => {
              const IconComponent = action.icon;
              
              return (
                <button
                  key={action.status}
                  onClick={() => updateEnquiryStatus(action.status)}
                  disabled={updating}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-white transition-colors ${
                    updating
                      ? 'opacity-50 cursor-not-allowed'
                      : action.color
                  }`}
                  title={action.description}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{action.label}</span>
                </button>
              );
            })}

            {updating && (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Updating...
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 text-sm">
            {enquiry?.priority && (
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                enquiry.priority === 'high' 
                  ? isDarkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800'
                  : enquiry.priority === 'medium'
                    ? isDarkMode ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
                    : isDarkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800'
              }`}>
                {enquiry.priority.toUpperCase()} PRIORITY
              </span>
            )}
            
            {enquiry?.enquiryType && (
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                isDarkMode 
                  ? 'bg-purple-900/30 text-purple-300' 
                  : 'bg-purple-100 text-purple-800'
              }`}>
                {enquiry.enquiryType}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className={`flex-shrink-0 p-3 border-b transition-colors ${
        isDarkMode 
          ? 'bg-blue-900/20 border-gray-600' 
          : 'bg-blue-50 border-gray-200'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className={`text-sm font-medium ${
              isDarkMode ? 'text-blue-300' : 'text-blue-800'
            }`}>
              Subject: {enquiry?.subject || 'No subject provided'}
            </p>
            {enquiry?.createdAt && (
              <p className={`text-xs mt-1 ${
                isDarkMode ? 'text-blue-400' : 'text-blue-600'
              }`}>
                Created: {formatDate(enquiry.createdAt)}
              </p>
            )}
          </div>
          
          <div className="ml-4">
            <p className={`text-xs ${
              isDarkMode ? 'text-blue-400' : 'text-blue-600'
            }`}>
              ID: {enquiry?.enquiryId || enquiry?._id?.slice(-8)}
            </p>
          </div>
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${
        isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
      }`} style={{ minHeight: 0 }}>
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Initial enquiry message */}
            {enquiry?.message && (
              <>
                {/* Date separator for initial message */}
                <div className="flex justify-center my-4">
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    isDarkMode 
                      ? 'bg-gray-700 text-gray-300' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {formatDate(enquiry.createdAt)}
                  </div>
                </div>

                <div className="flex justify-start">
                  <div className="max-w-xs lg:max-w-md">
                    <div className={`text-xs mb-1 px-2 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {customerName}
                    </div>
                    
                    <div className={`px-4 py-2 rounded-2xl relative ${
                      isDarkMode
                        ? 'bg-gray-700 text-white'
                        : 'bg-white text-gray-900 border border-gray-200'
                    } ring-2 ring-orange-400`}>
                      <div className={`text-xs font-semibold mb-1 ${
                        isDarkMode ? 'text-orange-300' : 'text-orange-600'
                      }`}>
                        Initial Enquiry
                      </div>
                      
                      <div className="text-sm">
                        {renderMessageContent(enquiry.message)}
                      </div>
                      
                      <div className={`flex items-center justify-end space-x-1 mt-1 text-xs ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        <span>{formatDateTime(enquiry.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Response messages */}
            {messages.map((message, index) => {
              const previousMessage = index > 0 ? messages[index - 1] : (enquiry?.message ? enquiry : null);
              const showDateSeparator = shouldShowDateSeparator(message, previousMessage);

              return (
                <div key={`${message._id}-${index}`}> {/* FIXED: Added index to ensure unique keys */}
                  {/* Date separator */}
                  {showDateSeparator && (
                    <div className="flex justify-center my-4">
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        isDarkMode 
                          ? 'bg-gray-700 text-gray-300' 
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {formatDate(message.createdAt)}
                      </div>
                    </div>
                  )}

                  <div className={`flex ${
                    message.isAdminResponse ? 'justify-end' : 'justify-start'
                  }`}>
                    <div className="max-w-xs lg:max-w-md">
                      {/* Show sender name */}
                      <div className={`text-xs mb-1 px-2 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {message.authorDisplay}
                      </div>
                      
                      <div
                        className={`px-4 py-2 rounded-2xl relative ${
                          message.isAdminResponse
                            ? isDarkMode
                              ? 'bg-blue-600 text-white'
                              : 'bg-blue-500 text-white'
                            : isDarkMode
                              ? 'bg-gray-700 text-white'
                              : 'bg-white text-gray-900 border border-gray-200'
                        }`}
                      >
                        <div className="text-sm">
                          {renderMessageContent(message.message)}
                        </div>
                        
                        {/* Attachments */}
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {message.attachments.map((attachment, index) => (
                              <div key={index} className={`flex items-center space-x-2 p-2 rounded border ${
                                message.isAdminResponse
                                  ? 'border-blue-300 bg-blue-50'
                                  : isDarkMode
                                    ? 'border-gray-600 bg-gray-600'
                                    : 'border-gray-200 bg-gray-50'
                              }`}>
                                <File className="w-4 h-4" />
                                <div className="flex-1 min-w-0">
                                  <p className={`text-xs font-medium truncate ${
                                    message.isAdminResponse ? 'text-blue-800' : isDarkMode ? 'text-gray-200' : 'text-gray-700'
                                  }`}>
                                    {attachment.originalName}
                                  </p>
                                  <p className={`text-xs ${
                                    message.isAdminResponse ? 'text-blue-600' : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                  }`}>
                                    {formatFileSize(attachment.fileSize)}
                                  </p>
                                </div>
                                <a
                                  href={attachment.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`p-1 rounded transition-colors ${
                                    message.isAdminResponse
                                      ? 'hover:bg-blue-200 text-blue-700'
                                      : isDarkMode
                                        ? 'hover:bg-gray-500 text-gray-300'
                                        : 'hover:bg-gray-200 text-gray-600'
                                  }`}
                                >
                                  <Download className="w-3 h-3" />
                                </a>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div className={`flex items-center justify-end space-x-1 mt-1 text-xs ${
                          message.isAdminResponse
                            ? 'text-blue-100'
                            : isDarkMode
                              ? 'text-gray-400'
                              : 'text-gray-500'
                        }`}>
                          <span>{formatDateTime(message.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className={`flex-shrink-0 p-4 border-t transition-colors ${
        isDarkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        {enquiry?.status === 'closed' ? (
          <div className={`text-center py-4 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <p className="text-sm font-medium">This enquiry has been closed.</p>
            <p className="text-xs mt-1">Reopen the enquiry to continue the conversation.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* File attachments preview */}
            {attachments.length > 0 && (
              <div className="space-y-2">
                {attachments.map((file, index) => (
                  <div key={index} className={`flex items-center justify-between p-2 rounded border ${
                    isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
                  }`}>
                    <div className="flex items-center space-x-2">
                      <File className="w-4 h-4" />
                      <div>
                        <p className={`text-sm font-medium ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>{file.name}</p>
                        <p className={`text-xs ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeAttachment(index)}
                      className={`p-1 rounded transition-colors ${
                        isDarkMode 
                          ? 'hover:bg-gray-600 text-red-400' 
                          : 'hover:bg-gray-200 text-red-600'
                      }`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-end space-x-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                multiple
                className="hidden"
                accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt,.csv,.xls,.xlsx"
              />
              
              {/* <button 
                onClick={() => fileInputRef.current?.click()}
                className={`p-2 rounded-full transition-colors ${
                  isDarkMode 
                    ? 'hover:bg-gray-700 text-gray-400' 
                    : 'hover:bg-gray-100 text-gray-500'
                }`}
              >
                <Paperclip className="w-5 h-5" />
              </button> */}
              
              <div className="flex-1 relative">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder={`Reply to ${customerName}...`}
                  className={`w-full px-4 py-3 pr-12 border rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                  rows="1"
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                />
              </div>
              
              <button
                onClick={sendMessage}
                disabled={(!newMessage.trim() && attachments.length === 0) || uploadingFiles}
                className={`p-3 rounded-full transition-colors ${
                  (newMessage.trim() || attachments.length > 0) && !uploadingFiles
                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                    : isDarkMode
                      ? 'bg-gray-700 text-gray-500'
                      : 'bg-gray-100 text-gray-400'
                } disabled:cursor-not-allowed`}
              >
                {uploadingFiles ? (
                  <Upload className="w-5 h-5 animate-pulse" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (mode === 'embedded') {
    return content;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl" style={{ height: containerHeight }}>
        {content}
      </div>
    </div>
  );
}
