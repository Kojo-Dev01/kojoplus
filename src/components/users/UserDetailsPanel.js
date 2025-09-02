'use client';

import { useState } from 'react';
import { X, User, Mail, Phone, Calendar, MapPin, Shield, CheckCircle, XCircle, Clock, Edit, Save, Ban, Send, Bell } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const COUNTRY_CODES = [
  { code: '+1', country: 'United States', flag: '🇺🇸' },
  { code: '+1', country: 'Canada', flag: '🇨🇦' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+233', country: 'Ghana', flag: '🇬🇭' },
  { code: '+234', country: 'Nigeria', flag: '🇳🇬' },
  { code: '+254', country: 'Kenya', flag: '🇰🇪' },
  { code: '+27', country: 'South Africa', flag: '🇿🇦' },
  { code: '+20', country: 'Egypt', flag: '🇪🇬' },
  { code: '+212', country: 'Morocco', flag: '🇲🇦' },
  { code: '+216', country: 'Tunisia', flag: '🇹🇳' },
  { code: '+225', country: 'Ivory Coast', flag: '🇨🇮' },
  { code: '+226', country: 'Burkina Faso', flag: '🇧🇫' },
  { code: '+227', country: 'Niger', flag: '🇳🇪' },
  { code: '+228', country: 'Togo', flag: '🇹🇬' },
  { code: '+229', country: 'Benin', flag: '🇧🇯' },
  { code: '+230', country: 'Mauritius', flag: '🇲🇺' },
  { code: '+231', country: 'Liberia', flag: '🇱🇷' },
  { code: '+232', country: 'Sierra Leone', flag: '🇸🇱' },
  { code: '+235', country: 'Chad', flag: '🇹🇩' },
  { code: '+236', country: 'Central African Republic', flag: '🇨🇫' },
  { code: '+237', country: 'Cameroon', flag: '🇨🇲' },
  { code: '+238', country: 'Cape Verde', flag: '🇨🇻' },
  { code: '+239', country: 'São Tomé and Príncipe', flag: '🇸🇹' },
  { code: '+240', country: 'Equatorial Guinea', flag: '🇬🇶' },
  { code: '+241', country: 'Gabon', flag: '🇬🇦' },
  { code: '+242', country: 'Republic of the Congo', flag: '🇨🇬' },
  { code: '+243', country: 'Democratic Republic of the Congo', flag: '🇨🇩' },
  { code: '+244', country: 'Angola', flag: '🇦🇴' },
  { code: '+245', country: 'Guinea-Bissau', flag: '🇬🇼' },
  { code: '+246', country: 'British Indian Ocean Territory', flag: '🇮🇴' },
  { code: '+248', country: 'Seychelles', flag: '🇸🇨' },
  { code: '+249', country: 'Sudan', flag: '🇸🇩' },
  { code: '+250', country: 'Rwanda', flag: '🇷🇼' },
  { code: '+251', country: 'Ethiopia', flag: '🇪🇹' },
  { code: '+252', country: 'Somalia', flag: '🇸🇴' },
  { code: '+253', country: 'Djibouti', flag: '🇩🇯' },
  { code: '+255', country: 'Tanzania', flag: '🇹🇿' },
  { code: '+256', country: 'Uganda', flag: '🇺🇬' },
  { code: '+257', country: 'Burundi', flag: '🇧🇮' },
  { code: '+258', country: 'Mozambique', flag: '🇲🇿' },
  { code: '+260', country: 'Zambia', flag: '🇿🇲' },
  { code: '+261', country: 'Madagascar', flag: '🇲🇬' },
  { code: '+262', country: 'Réunion', flag: '🇷🇪' },
  { code: '+263', country: 'Zimbabwe', flag: '🇿🇼' },
  { code: '+264', country: 'Namibia', flag: '🇳🇦' },
  { code: '+265', country: 'Malawi', flag: '🇲🇼' },
  { code: '+266', country: 'Lesotho', flag: '🇱🇸' },
  { code: '+267', country: 'Botswana', flag: '🇧🇼' },
  { code: '+268', country: 'Eswatini', flag: '🇸🇿' },
  { code: '+269', country: 'Comoros', flag: '🇰🇲' },
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+86', country: 'China', flag: '🇨🇳' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+82', country: 'South Korea', flag: '🇰🇷' },
  { code: '+84', country: 'Vietnam', flag: '🇻🇳' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
  { code: '+62', country: 'Indonesia', flag: '🇮🇩' },
  { code: '+63', country: 'Philippines', flag: '🇵🇭' },
  { code: '+66', country: 'Thailand', flag: '🇹🇭' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+39', country: 'Italy', flag: '🇮🇹' },
  { code: '+34', country: 'Spain', flag: '🇪🇸' },
  { code: '+31', country: 'Netherlands', flag: '🇳🇱' },
  { code: '+32', country: 'Belgium', flag: '🇧🇪' },
  { code: '+41', country: 'Switzerland', flag: '🇨🇭' },
  { code: '+43', country: 'Austria', flag: '🇦🇹' },
  { code: '+45', country: 'Denmark', flag: '🇩🇰' },
  { code: '+46', country: 'Sweden', flag: '🇸🇪' },
  { code: '+47', country: 'Norway', flag: '🇳🇴' },
  { code: '+48', country: 'Poland', flag: '🇵🇱' },
  { code: '+351', country: 'Portugal', flag: '🇵🇹' },
  { code: '+7', country: 'Russia', flag: '🇷🇺' },
  { code: '+52', country: 'Mexico', flag: '🇲🇽' },
  { code: '+55', country: 'Brazil', flag: '🇧🇷' },
  { code: '+54', country: 'Argentina', flag: '🇦🇷' },
  { code: '+56', country: 'Chile', flag: '🇨🇱' },
  { code: '+57', country: 'Colombia', flag: '🇨🇴' },
  { code: '+58', country: 'Venezuela', flag: '🇻🇪' },
  { code: '+51', country: 'Peru', flag: '🇵🇪' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+64', country: 'New Zealand', flag: '🇳🇿' },
  { code: '+971', country: 'United Arab Emirates', flag: '🇦🇪' },
  { code: '+211', country: 'South Sudan', flag: '🇸🇸' },
  { code: '+213', country: 'Algeria', flag: '🇩🇿' },
  { code: '+218', country: 'Libya', flag: '🇱🇾' },
  { code: '+220', country: 'Gambia', flag: '🇬🇲' },
  { code: '+221', country: 'Senegal', flag: '🇸🇳' },
  { code: '+222', country: 'Mauritania', flag: '🇲🇷' },
  { code: '+223', country: 'Mali', flag: '🇲🇱' },
  { code: '+224', country: 'Guinea', flag: '🇬🇳' },
  { code: '+290', country: 'Saint Helena', flag: '🇸🇭' },
  { code: '+291', country: 'Eritrea', flag: '🇪🇷' },
  { code: '+297', country: 'Aruba', flag: '🇦🇼' },
  { code: '+298', country: 'Faroe Islands', flag: '🇫🇴' },
  { code: '+299', country: 'Greenland', flag: '🇬🇱' },
  { code: '+30', country: 'Greece', flag: '🇬🇷' },
  { code: '+36', country: 'Hungary', flag: '🇭🇺' },
  { code: '+40', country: 'Romania', flag: '🇷🇴' },
  { code: '+53', country: 'Cuba', flag: '🇨🇺' },
  { code: '+92', country: 'Pakistan', flag: '🇵🇰' },
  { code: '+93', country: 'Afghanistan', flag: '🇦🇫' },
  { code: '+94', country: 'Sri Lanka', flag: '🇱🇰' },
  { code: '+95', country: 'Myanmar', flag: '🇲🇲' },
  { code: '+98', country: 'Iran', flag: '🇮🇷' },
];

export default function UserDetailsPanel({ isOpen, onClose, user }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({});
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({
    type: 'email', // 'email', 'notification', 'both'
    subject: '',
    message: '',
    priority: 'medium' // 'low', 'medium', 'high', 'urgent'
  });
  const [sendingContact, setSendingContact] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);

  const { isDarkMode } = useTheme();

  if (!isOpen || !user) return null;

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
    setEditedUser({ ...user });
    setIsEditing(true);
  };

  const handleSave = () => {
    // TODO: Implement save functionality
    console.log('Saving user:', editedUser);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedUser({});
    setIsEditing(false);
  };

  const handleInputChange = (field, value) => {
    setEditedUser(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleContactSubmit = async () => {
    if (!contactForm.subject.trim() || !contactForm.message.trim()) return;

    setSendingContact(true);
    try {
      // Send based on contact type
      if (contactForm.type === 'email' || contactForm.type === 'both') {
        // Send email
        const emailResponse = await fetch('/api/admin/send-email', {
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify({
            to: user.email,
            subject: contactForm.subject,
            message: contactForm.message,
            userId: user._id
          })
        });

        if (!emailResponse.ok) {
          throw new Error('Failed to send email');
        }
      }

      if (contactForm.type === 'notification' || contactForm.type === 'both') {
        // Send in-app notification using the correct type
        const notificationResponse = await fetch('/api/admin/send-notification', {
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify({
            userId: user._id,
            title: contactForm.subject,
            message: contactForm.message,
            priority: contactForm.priority,
            type: 'message' // Use 'message' type from your enum
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

      alert('User Contacted successfully');

      // Show success message (you can implement toast notifications here)
      console.log('Contact sent successfully');

    } catch (error) {
      alert('Failed to contact user - ' + error.message);
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

  // Helper function to extract country from WhatsApp number
  const getCountryFromWhatsApp = (whatsappNumber) => {
    if (!whatsappNumber) return null;
    
    // Clean the number (remove spaces, dashes, etc.)
    const cleanNumber = whatsappNumber.replace(/[\s\-\(\)]/g, '');
    
    // Sort country codes by length (longest first) to match longer codes first
    const sortedCodes = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
    
    for (const countryData of sortedCodes) {
      if (cleanNumber.startsWith(countryData.code)) {
        return countryData;
      }
    }
    
    return null;
  };

  const whatsappCountry = getCountryFromWhatsApp(user?.whatsapp);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed h-full inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onClose} />
      
      {/* Panel */}
      <div className={`fixed inset-y-0 right-0 w-full max-w-2xl shadow-2xl z-50 border-l flex flex-col transition-colors ${
        isDarkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        {/* Fixed Header */}
        <div className={`px-6 py-4 border-b flex-shrink-0 transition-colors ${
          isDarkMode 
            ? 'bg-gradient-to-r from-gray-700 to-gray-800 border-gray-600' 
            : 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
              }`}>
                <User className={`w-6 h-6 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`} />
              </div>
              <div>
                <h2 className={`text-xl font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>User Details</h2>
                <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Complete user information</p>
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
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Basic Information */}
          <div className={`rounded-2xl p-6 border transition-colors ${
            isDarkMode 
              ? 'bg-gray-700 border-gray-600' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-lg font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Basic Information</h3>
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
                }`}>First Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedUser.firstName || ''}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                ) : (
                  <p className={`font-medium ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>{user.firstName}</p>
                )}
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>Last Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedUser.lastName || ''}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                ) : (
                  <p className={`font-medium ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>{user.lastName}</p>
                )}
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>Email</label>
                <div className="flex items-center space-x-2">
                  <Mail className={`w-4 h-4 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-400'
                  }`} />
                  {isEditing ? (
                    <input
                      type="email"
                      value={editedUser.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        isDarkMode 
                          ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  ) : (
                    <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>{user.email}</p>
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
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editedUser.phone || ''}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        isDarkMode 
                          ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  ) : (
                    <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>{user.phone}</p>
                  )}
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>WhatsApp</label>
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-green-500" />
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editedUser.whatsapp || ''}
                      onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                      className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        isDarkMode 
                          ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>{user.whatsapp || 'Not provided'}</p>
                      {whatsappCountry && (
                        <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg ${
                          isDarkMode ? 'bg-gray-600' : 'bg-gray-100'
                        }`}>
                          <span className="text-lg">{whatsappCountry.flag}</span>
                          <span className={`text-xs font-medium ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>{whatsappCountry.country}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>Country</label>
                <div className="flex items-center space-x-2">
                  <MapPin className={`w-4 h-4 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-400'
                  }`} />
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedUser.country || ''}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        isDarkMode 
                          ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                        {user.country || (whatsappCountry ? whatsappCountry.country : 'Not provided')}
                      </p>
                      {!user.country && whatsappCountry && (
                        <span className={`text-xs italic ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>(detected from WhatsApp)</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Account Status */}
          <div className={`rounded-2xl p-6 border transition-colors ${
            isDarkMode 
              ? 'bg-gray-700 border-gray-600' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <h3 className={`text-lg font-semibold mb-6 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Account Status</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>Account Status</label>
                <div className="flex items-center space-x-2">
                  {user.isActive ? (
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
                }`}>Email Verification</label>
                <div className="flex items-center space-x-2">
                  {user.emailVerified ? (
                    <>
                      <Shield className="w-5 h-5 text-blue-500" />
                      <span className={`font-medium ${
                        isDarkMode ? 'text-blue-400' : 'text-blue-700'
                      }`}>Verified</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-5 h-5 text-amber-500" />
                      <span className={`font-medium ${
                        isDarkMode ? 'text-amber-400' : 'text-amber-700'
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
                  <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>{formatDate(user.createdAt)}</p>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>Last Updated</label>
                <div className="flex items-center space-x-2">
                  <Clock className={`w-4 h-4 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-400'
                  }`} />
                  <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>{formatDate(user.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Account Actions */}
          <div className={`rounded-2xl p-6 border transition-colors ${
            isDarkMode 
              ? 'bg-gray-700 border-gray-600' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <h3 className={`text-lg font-semibold mb-6 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Account Actions</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={() => setShowContactModal(true)}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>Contact User</span>
              </button>

              <button className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-colors ${
                user.isActive 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}>
                {user.isActive ? (
                  <>
                    <Ban className="w-4 h-4" />
                    <span>Deactivate Account</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Activate Account</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Additional Information */}
          {(user.bio || user.interests || user.notes) && (
            <div className={`rounded-2xl p-6 border transition-colors ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600' 
                : 'bg-gray-50 border-gray-200'
            }`}>
              <h3 className={`text-lg font-semibold mb-6 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Additional Information</h3>
              
              <div className="space-y-4">
                {user.bio && (
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>Bio</label>
                    <p className={`text-sm leading-relaxed ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>{user.bio}</p>
                  </div>
                )}

                {user.interests && (
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>Interests</label>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>{user.interests}</p>
                  </div>
                )}

                {user.notes && (
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>Admin Notes</label>
                    <p className={`text-sm leading-relaxed ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>{user.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
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
                  }`}>Contact User</h3>
                  <p className={`mt-1 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>Send a message to {user.firstName} {user.lastName}</p>
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
                          ? isDarkMode
                            ? 'border-blue-500 bg-blue-900/20 text-blue-400'
                            : 'border-blue-500 bg-blue-50 text-blue-700'
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
                          ? isDarkMode
                            ? 'border-blue-500 bg-blue-900/20 text-blue-400'
                            : 'border-blue-500 bg-blue-50 text-blue-700'
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
                          ? isDarkMode
                            ? 'border-blue-500 bg-blue-900/20 text-blue-400'
                            : 'border-blue-500 bg-blue-50 text-blue-700'
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

                {/* Custom Priority Dropdown */}
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
                        {/* Backdrop */}
                        <div 
                          className="fixed inset-0 z-10"
                          onClick={() => setShowPriorityDropdown(false)}
                        />
                        
                        {/* Dropdown Menu */}
                        <div className={`absolute z-20 mt-1 w-full shadow-lg max-h-60 rounded-xl py-1 ring-1 ring-opacity-5 overflow-auto focus:outline-none transition-colors ${
                          isDarkMode 
                            ? 'bg-gray-700 ring-gray-600' 
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
                                    ? 'text-gray-300 font-medium hover:bg-gray-600 hover:text-white'
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
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
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
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
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

                {/* Enhanced Preview */}
                <div className={`rounded-xl p-4 border transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <h4 className={`text-sm font-semibold mb-3 ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}>Preview</h4>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className={`font-semibold ${
                        isDarkMode ? 'text-gray-200' : 'text-gray-800'
                      }`}>To:</span> 
                      <span className={`ml-2 font-medium ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>{user.email}</span>
                    </div>
                    <div className="text-sm">
                      <span className={`font-semibold ${
                        isDarkMode ? 'text-gray-200' : 'text-gray-800'
                      }`}>Method:</span> 
                      <span className={`ml-2 font-medium ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {contactForm.type === 'email' && 'Email'}
                        {contactForm.type === 'notification' && 'In-App Notification'}
                        {contactForm.type === 'both' && 'Email + In-App Notification'}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className={`font-semibold ${
                        isDarkMode ? 'text-gray-200' : 'text-gray-800'
                      }`}>Priority:</span> 
                      <span className={`ml-2 font-semibold capitalize ${
                        contactForm.priority === 'urgent' ? 'text-red-400' :
                        contactForm.priority === 'high' ? 'text-orange-400' :
                        contactForm.priority === 'medium' ? 'text-blue-400' :
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {contactForm.priority}
                      </span>
                    </div>
                    {contactForm.subject && (
                      <div className="text-sm">
                        <span className={`font-semibold ${
                          isDarkMode ? 'text-gray-200' : 'text-gray-800'
                        }`}>Subject:</span> 
                        <span className={`ml-2 font-medium ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>{contactForm.subject}</span>
                      </div>
                    )}
                    {contactForm.message && (
                      <div className="text-sm">
                        <span className={`font-semibold ${
                          isDarkMode ? 'text-gray-200' : 'text-gray-800'
                        }`}>Message:</span>
                        <div className={`mt-1 p-3 rounded-lg border transition-colors ${
                          isDarkMode 
                            ? 'bg-gray-600 border-gray-500' 
                            : 'bg-white border-gray-200'
                        }`}>
                          <p className={`whitespace-pre-wrap text-sm leading-relaxed ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {contactForm.message}
                          </p>
                        </div>
                      </div>
                    )}
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
    </>
  );
}
