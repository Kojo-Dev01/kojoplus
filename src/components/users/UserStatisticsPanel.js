'use client';

import { useState, useEffect } from 'react';
import { X, Users, Globe, TrendingUp, BarChart3, Search, ChevronDown, CheckCircle, Mail, Shield, UserCheck } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const COUNTRY_CODES = [
  { code: '+93', country: 'Afghanistan', flag: '🇦🇫' },
  { code: '+355', country: 'Albania', flag: '🇦🇱' },
  { code: '+213', country: 'Algeria', flag: '🇩🇿' },
  { code: '+376', country: 'Andorra', flag: '🇦🇩' },
  { code: '+244', country: 'Angola', flag: '🇦🇴' },
  { code: '+1-268', country: 'Antigua and Barbuda', flag: '🇦🇬' },
  { code: '+54', country: 'Argentina', flag: '🇦🇷' },
  { code: '+374', country: 'Armenia', flag: '🇦🇲' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+43', country: 'Austria', flag: '🇦🇹' },
  { code: '+994', country: 'Azerbaijan', flag: '🇦🇿' },
  { code: '+1-242', country: 'Bahamas', flag: '🇧🇸' },
  { code: '+973', country: 'Bahrain', flag: '🇧🇭' },
  { code: '+880', country: 'Bangladesh', flag: '🇧🇩' },
  { code: '+1-246', country: 'Barbados', flag: '🇧🇧' },
  { code: '+375', country: 'Belarus', flag: '🇧🇾' },
  { code: '+32', country: 'Belgium', flag: '🇧🇪' },
  { code: '+501', country: 'Belize', flag: '🇧🇿' },
  { code: '+229', country: 'Benin', flag: '🇧🇯' },
  { code: '+975', country: 'Bhutan', flag: '🇧🇹' },
  { code: '+591', country: 'Bolivia', flag: '' },
  { code: '+387', country: 'Bosnia and Herzegovina', flag: '🇧🇦' },
  { code: '+267', country: 'Botswana', flag: '🇧🇼' },
  { code: '+55', country: 'Brazil', flag: '🇧🇷' },
  { code: '+673', country: 'Brunei', flag: '' },
  { code: '+359', country: 'Bulgaria', flag: '🇧🇬' },
  { code: '+226', country: 'Burkina Faso', flag: '🇧🇫' },
  { code: '+257', country: 'Burundi', flag: '🇧🇮' },
  { code: '+238', country: 'Cabo Verde', flag: '🇨🇻' },
  { code: '+855', country: 'Cambodia', flag: '🇰🇭' },
  { code: '+237', country: 'Cameroon', flag: '🇨🇲' },
  { code: '+1', country: 'Canada', flag: '🇨🇦' },
  { code: '+236', country: 'Central African Republic', flag: '🇨🇫' },
  { code: '+235', country: 'Chad', flag: '🇹🇩' },
  { code: '+56', country: 'Chile', flag: '🇨🇱' },
  { code: '+86', country: 'China', flag: '🇨🇳' },
  { code: '+57', country: 'Colombia', flag: '🇨🇴' },
  { code: '+269', country: 'Comoros', flag: '🇰🇲' },
  { code: '+242', country: 'Congo (Congo-Brazzaville)', flag: '' },
  { code: '+506', country: 'Costa Rica', flag: '🇨🇷' },
  { code: '+385', country: 'Croatia', flag: '🇭🇷' },
  { code: '+53', country: 'Cuba', flag: '🇨🇺' },
  { code: '+357', country: 'Cyprus', flag: '🇨🇾' },
  { code: '+420', country: 'Czechia (Czech Republic)', flag: '' },
  { code: '+243', country: 'Democratic Republic of the Congo', flag: '' },
  { code: '+45', country: 'Denmark', flag: '🇩🇰' },
  { code: '+253', country: 'Djibouti', flag: '🇩🇯' },
  { code: '+1-767', country: 'Dominica', flag: '🇩🇲' },
  { code: '+1-809', country: 'Dominican Republic', flag: '🇩🇴' },
  { code: '+593', country: 'Ecuador', flag: '🇪🇨' },
  { code: '+20', country: 'Egypt', flag: '🇪🇬' },
  { code: '+503', country: 'El Salvador', flag: '🇸🇻' },
  { code: '+240', country: 'Equatorial Guinea', flag: '🇬🇶' },
  { code: '+291', country: 'Eritrea', flag: '🇪🇷' },
  { code: '+372', country: 'Estonia', flag: '🇪🇪' },
  { code: '+268', country: 'Eswatini (fmr. Swaziland)', flag: '' },
  { code: '+251', country: 'Ethiopia', flag: '🇪🇹' },
  { code: '+679', country: 'Fiji', flag: '🇫🇯' },
  { code: '+358', country: 'Finland', flag: '🇫🇮' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+241', country: 'Gabon', flag: '🇬🇦' },
  { code: '+220', country: 'Gambia', flag: '🇬🇲' },
  { code: '+995', country: 'Georgia', flag: '🇬🇪' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+233', country: 'Ghana', flag: '🇬🇭' },
  { code: '+30', country: 'Greece', flag: '🇬🇷' },
  { code: '+1-473', country: 'Grenada', flag: '🇬🇩' },
  { code: '+502', country: 'Guatemala', flag: '🇬🇹' },
  { code: '+224', country: 'Guinea', flag: '🇬🇳' },
  { code: '+245', country: 'Guinea-Bissau', flag: '🇬🇼' },
  { code: '+592', country: 'Guyana', flag: '🇬🇾' },
  { code: '+509', country: 'Haiti', flag: '🇭🇹' },
  { code: '+504', country: 'Honduras', flag: '🇭🇳' },
  { code: '+36', country: 'Hungary', flag: '🇭🇺' },
  { code: '+354', country: 'Iceland', flag: '🇮🇸' },
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+62', country: 'Indonesia', flag: '🇮🇩' },
  { code: '+98', country: 'Iran', flag: '' },
  { code: '+964', country: 'Iraq', flag: '🇮🇶' },
  { code: '+353', country: 'Ireland', flag: '🇮🇪' },
  { code: '+972', country: 'Israel', flag: '🇮🇱' },
  { code: '+39', country: 'Italy', flag: '🇮🇹' },
  { code: '+1-876', country: 'Jamaica', flag: '🇯🇲' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+962', country: 'Jordan', flag: '🇯🇴' },
  { code: '+7', country: 'Kazakhstan', flag: '🇰🇿' },
  { code: '+254', country: 'Kenya', flag: '🇰🇪' },
  { code: '+686', country: 'Kiribati', flag: '🇰🇮' },
  { code: '+965', country: 'Kuwait', flag: '🇰🇼' },
  { code: '+996', country: 'Kyrgyzstan', flag: '🇰🇬' },
  { code: '+856', country: 'Laos', flag: '' },
  { code: '+371', country: 'Latvia', flag: '🇱🇻' },
  { code: '+961', country: 'Lebanon', flag: '🇱🇧' },
  { code: '+266', country: 'Lesotho', flag: '🇱🇸' },
  { code: '+231', country: 'Liberia', flag: '🇱🇷' },
  { code: '+218', country: 'Libya', flag: '🇱🇾' },
  { code: '+423', country: 'Liechtenstein', flag: '🇱🇮' },
  { code: '+370', country: 'Lithuania', flag: '🇱🇹' },
  { code: '+352', country: 'Luxembourg', flag: '🇱🇺' },
  { code: '+261', country: 'Madagascar', flag: '🇲🇬' },
  { code: '+265', country: 'Malawi', flag: '🇲🇼' },
  { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
  { code: '+960', country: 'Maldives', flag: '🇲🇻' },
  { code: '+223', country: 'Mali', flag: '🇲🇱' },
  { code: '+356', country: 'Malta', flag: '🇲🇹' },
  { code: '+692', country: 'Marshall Islands', flag: '🇲🇭' },
  { code: '+222', country: 'Mauritania', flag: '🇲🇷' },
  { code: '+230', country: 'Mauritius', flag: '🇲🇺' },
  { code: '+52', country: 'Mexico', flag: '🇲🇽' },
  { code: '+691', country: 'Micronesia', flag: '' },
  { code: '+373', country: 'Moldova', flag: '' },
  { code: '+377', country: 'Monaco', flag: '🇲🇨' },
  { code: '+976', country: 'Mongolia', flag: '🇲🇳' },
  { code: '+382', country: 'Montenegro', flag: '🇲🇪' },
  { code: '+212', country: 'Morocco', flag: '🇲🇦' },
  { code: '+258', country: 'Mozambique', flag: '🇲🇿' },
  { code: '+95', country: 'Myanmar (formerly Burma)', flag: '' },
  { code: '+264', country: 'Namibia', flag: '🇳🇦' },
  { code: '+674', country: 'Nauru', flag: '🇳🇷' },
  { code: '+977', country: 'Nepal', flag: '🇳🇵' },
  { code: '+31', country: 'Netherlands', flag: '🇳🇱' },
  { code: '+64', country: 'New Zealand', flag: '🇳🇿' },
  { code: '+505', country: 'Nicaragua', flag: '🇳🇮' },
  { code: '+227', country: 'Niger', flag: '🇳🇪' },
  { code: '+234', country: 'Nigeria', flag: '🇳🇬' },
  { code: '+850', country: 'North Korea', flag: '' },
  { code: '+389', country: 'North Macedonia', flag: '🇲🇰' },
  { code: '+47', country: 'Norway', flag: '🇳🇴' },
  { code: '+968', country: 'Oman', flag: '🇴🇲' },
  { code: '+92', country: 'Pakistan', flag: '🇵🇰' },
  { code: '+680', country: 'Palau', flag: '🇵🇼' },
  { code: '+970', country: 'Palestine State', flag: '' },
  { code: '+507', country: 'Panama', flag: '🇵🇦' },
  { code: '+675', country: 'Papua New Guinea', flag: '🇵🇬' },
  { code: '+595', country: 'Paraguay', flag: '🇵🇾' },
  { code: '+51', country: 'Peru', flag: '🇵🇪' },
  { code: '+63', country: 'Philippines', flag: '🇵🇭' },
  { code: '+48', country: 'Poland', flag: '🇵🇱' },
  { code: '+351', country: 'Portugal', flag: '🇵🇹' },
  { code: '+974', country: 'Qatar', flag: '🇶🇦' },
  { code: '+40', country: 'Romania', flag: '🇷🇴' },
  { code: '+7', country: 'Russia', flag: '' },
  { code: '+250', country: 'Rwanda', flag: '🇷🇼' },
  { code: '+1-869', country: 'Saint Kitts and Nevis', flag: '🇰🇳' },
  { code: '+1-758', country: 'Saint Lucia', flag: '🇱🇨' },
  { code: '+1-784', country: 'Saint Vincent and the Grenadines', flag: '🇻🇨' },
  { code: '+685', country: 'Samoa', flag: '🇼🇸' },
  { code: '+378', country: 'San Marino', flag: '🇸🇲' },
  { code: '+239', country: 'Sao Tome and Principe', flag: '🇸🇹' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+221', country: 'Senegal', flag: '🇸🇳' },
  { code: '+381', country: 'Serbia', flag: '🇷🇸' },
  { code: '+248', country: 'Seychelles', flag: '🇸🇨' },
  { code: '+232', country: 'Sierra Leone', flag: '🇸🇱' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+421', country: 'Slovakia', flag: '🇸🇰' },
  { code: '+386', country: 'Slovenia', flag: '🇸🇮' },
  { code: '+677', country: 'Solomon Islands', flag: '🇸🇧' },
  { code: '+252', country: 'Somalia', flag: '🇸🇴' },
  { code: '+27', country: 'South Africa', flag: '🇿🇦' },
  { code: '+82', country: 'South Korea', flag: '' },
  { code: '+211', country: 'South Sudan', flag: '🇸🇸' },
  { code: '+34', country: 'Spain', flag: '🇪🇸' },
  { code: '+94', country: 'Sri Lanka', flag: '🇱🇰' },
  { code: '+249', country: 'Sudan', flag: '🇸🇩' },
  { code: '+597', country: 'Suriname', flag: '🇸🇷' },
  { code: '+46', country: 'Sweden', flag: '🇸🇪' },
  { code: '+41', country: 'Switzerland', flag: '🇨🇭' },
  { code: '+963', country: 'Syria', flag: '' },
  { code: '+886', country: 'Taiwan', flag: '' },
  { code: '+992', country: 'Tajikistan', flag: '🇹🇯' },
  { code: '+255', country: 'Tanzania', flag: '' },
  { code: '+66', country: 'Thailand', flag: '🇹🇭' },
  { code: '+670', country: 'Timor-Leste', flag: '🇹🇱' },
  { code: '+228', country: 'Togo', flag: '🇹🇬' },
  { code: '+676', country: 'Tonga', flag: '🇹🇴' },
  { code: '+1-868', country: 'Trinidad and Tobago', flag: '🇹🇹' },
  { code: '+216', country: 'Tunisia', flag: '🇹🇳' },
  { code: '+90', country: 'Turkey', flag: '🇹🇷' },
  { code: '+993', country: 'Turkmenistan', flag: '🇹🇲' },
  { code: '+688', country: 'Tuvalu', flag: '🇹🇻' },
  { code: '+256', country: 'Uganda', flag: '🇺🇬' },
  { code: '+380', country: 'Ukraine', flag: '🇺🇦' },
  { code: '+971', country: 'United Arab Emirates', flag: '🇦🇪' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+1', country: 'United States', flag: '🇺🇸' },
  { code: '+598', country: 'Uruguay', flag: '🇺🇾' },
  { code: '+998', country: 'Uzbekistan', flag: '🇺🇿' },
  { code: '+678', country: 'Vanuatu', flag: '🇻🇺' },
  { code: '+379', country: 'Vatican City', flag: '' },
  { code: '+58', country: 'Venezuela', flag: '' },
  { code: '+84', country: 'Vietnam', flag: '' },
  { code: '+967', country: 'Yemen', flag: '🇾🇪' },
  { code: '+260', country: 'Zambia', flag: '🇿🇲' },
  { code: '+263', country: 'Zimbabwe', flag: '🇿🇼' }
];

export default function UserStatisticsPanel({ isOpen, onClose, users = [], totalStats = {}, loading = false, onRefresh }) {
  const [countryStats, setCountryStats] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('count'); // 'count' or 'name'
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [processingStats, setProcessingStats] = useState(false);
  const { isDarkMode } = useTheme();

  // Helper function to extract country from WhatsApp number
  const getCountryFromWhatsApp = (whatsappNumber) => {
    if (!whatsappNumber) return null;
    
    // Remove any non-digit characters except +
    const cleanNumber = whatsappNumber.replace(/[^\d+]/g, '');
    
    // Sort country codes by length (longest first) to match longer codes first
    const sortedCodes = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
    
    for (const countryData of sortedCodes) {
      if (cleanNumber.startsWith(countryData.code)) {
        return countryData.country;
      }
    }
    
    return null;
  };

  // Calculate country statistics
  useEffect(() => {
    if (!isOpen) return;

    // If we have users data, process it
    if (users.length > 0) {
      setProcessingStats(true);
      
      // Group users by country
      const countryMap = new Map();
      let unknownCount = 0;

      users.forEach(user => {
        const country = getCountryFromWhatsApp(user.whatsapp);
        if (country) {
          countryMap.set(country, (countryMap.get(country) || 0) + 1);
        } else {
          unknownCount++;
        }
      });

      // Convert to array and add country data
      const stats = Array.from(countryMap.entries()).map(([country, count]) => {
        const countryData = COUNTRY_CODES.find(c => c.country === country);
        return {
          country,
          count,
          flag: countryData?.flag || '🌍',
          code: countryData?.code || '',
          percentage: ((count / users.length) * 100).toFixed(1)
        };
      });

      // Add unknown count if any
      if (unknownCount > 0) {
        stats.push({
          country: 'Unknown/Other',
          count: unknownCount,
          flag: '❓',
          code: '',
          percentage: ((unknownCount / users.length) * 100).toFixed(1)
        });
      }

      // Sort by count (descending) by default
      stats.sort((a, b) => b.count - a.count);
      
      setCountryStats(stats);
      setProcessingStats(false);
    } else if (!loading) {
      // Clear stats if no users and not loading
      setCountryStats([]);
      setProcessingStats(false);
    }
  }, [users, isOpen, loading]);

  // Filter and sort countries
  const filteredAndSortedStats = countryStats
    .filter(stat => 
      stat.country.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'count') {
        return b.count - a.count;
      } else {
        return a.country.localeCompare(b.country);
      }
    });

  const totalUsers = totalStats.total || users.length;
  const totalCountries = countryStats.length;
  const topCountry = countryStats[0];

  // Show loading state when fetching data or processing
  const isLoadingData = loading || processingStats;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 min-h-screen"
          onClick={onClose}
        />
      )}

      {/* Panel - Made wider for user statistics */}
      <div className={`
        fixed inset-y-0 right-0 w-[520px] shadow-2xl transform transition-transform duration-300 ease-in-out z-50
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        ${isDarkMode ? 'bg-gray-800' : 'bg-white'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className={`text-white p-6 ${
            isDarkMode 
              ? 'bg-gradient-to-r from-red-700 to-orange-700' 
              : 'bg-gradient-to-r from-red-600 to-orange-600'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">User Statistics</h2>
              <div className="flex items-center space-x-2">
                {/* Refresh Button */}
                {onRefresh && (
                  <button
                    onClick={onRefresh}
                    disabled={loading}
                    className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors disabled:opacity-50"
                    title="Refresh statistics"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    )}
                  </button>
                )}
                
                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-white/10 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <div>
                    <div className="text-sm opacity-90">Total Users</div>
                    <div className="text-xl font-bold">
                      {isLoadingData ? (
                        <div className="animate-pulse bg-white/20 h-6 w-12 rounded"></div>
                      ) : (
                        totalUsers.toLocaleString()
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Globe className="w-5 h-5" />
                  <div>
                    <div className="text-sm opacity-90">Countries</div>
                    <div className="text-xl font-bold">
                      {isLoadingData ? (
                        <div className="animate-pulse bg-white/20 h-6 w-8 rounded"></div>
                      ) : (
                        totalCountries
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional User Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/10 rounded-lg p-2">
                <div className="flex items-center space-x-1">
                  <UserCheck className="w-4 h-4" />
                  <div>
                    <div className="text-xs opacity-90">Active</div>
                    <div className="text-lg font-bold">
                      {isLoadingData ? (
                        <div className="animate-pulse bg-white/20 h-5 w-8 rounded"></div>
                      ) : (
                        totalStats.active || 0
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 rounded-lg p-2">
                <div className="flex items-center space-x-1">
                  <Shield className="w-4 h-4" />
                  <div>
                    <div className="text-xs opacity-90">Verified</div>
                    <div className="text-lg font-bold">
                      {isLoadingData ? (
                        <div className="animate-pulse bg-white/20 h-5 w-8 rounded"></div>
                      ) : (
                        totalStats.verified || 0
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 rounded-lg p-2">
                <div className="flex items-center space-x-1">
                  <Mail className="w-4 h-4" />
                  <div>
                    <div className="text-xs opacity-90">Inactive</div>
                    <div className="text-lg font-bold">
                      {isLoadingData ? (
                        <div className="animate-pulse bg-white/20 h-5 w-8 rounded"></div>
                      ) : (
                        totalStats.inactive || 0
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Loading Indicator */}
            {isLoadingData && (
              <div className="mt-4 flex items-center space-x-2 text-white/80">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white/80"></div>
                <span className="text-sm">
                  {loading ? 'Loading user data...' : 'Processing statistics...'}
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Controls */}
            <div className={`p-4 border-b space-y-3 transition-colors ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              {/* Search */}
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-400'
                }`} />
                <input
                  type="text"
                  placeholder="Search countries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm transition-colors ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-600 placeholder-gray-500'
                  }`}
                  disabled={isLoadingData}
                />
              </div>

              {/* Custom Sort Dropdown */}
              <div className="flex items-center space-x-2">
                <span className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>Sort by:</span>
                <div className="relative">
                  <button
                    type="button"
                    className={`relative w-32 border rounded-lg shadow-sm pl-3 pr-8 py-2 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:opacity-50 transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    onClick={() => setShowSortDropdown(!showSortDropdown)}
                    disabled={isLoadingData}
                  >
                    <span className="block truncate text-sm font-medium">
                      {sortBy === 'count' ? 'User Count' : 'Country Name'}
                    </span>
                    <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${
                        showSortDropdown ? 'rotate-180' : ''
                      } ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                    </span>
                  </button>

                  {showSortDropdown && !isLoadingData && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowSortDropdown(false)} />
                      <div className={`absolute z-20 mt-1 w-full shadow-lg max-h-60 rounded-lg py-1 ring-1 ring-opacity-5 overflow-auto focus:outline-none transition-colors ${
                        isDarkMode 
                          ? 'bg-gray-700 ring-gray-600' 
                          : 'bg-white ring-black'
                      }`}>
                        {[
                          { value: 'count', label: 'User Count' },
                          { value: 'name', label: 'Country Name' }
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            className={`w-full text-left relative cursor-pointer select-none py-2 pl-3 pr-9 transition-colors ${
                              sortBy === option.value 
                                ? isDarkMode
                                  ? 'bg-red-900/50 text-red-300 font-semibold'
                                  : 'bg-red-50 text-red-900 font-semibold'
                                : isDarkMode
                                  ? 'text-gray-300 font-medium hover:bg-gray-600 hover:text-white'
                                  : 'text-gray-900 font-medium hover:bg-red-50 hover:text-red-900'
                            }`}
                            onClick={() => {
                              setSortBy(option.value);
                              setShowSortDropdown(false);
                            }}
                          >
                            <span className="block truncate text-sm">{option.label}</span>
                            {sortBy === option.value && (
                              <span className={`absolute inset-y-0 right-0 flex items-center pr-3 ${
                                isDarkMode ? 'text-red-400' : 'text-red-600'
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

              {/* Top Country Highlight */}
              {topCountry && !isLoadingData && (
                <div className={`border rounded-lg p-3 transition-colors ${
                  isDarkMode 
                    ? 'bg-red-900/20 border-red-700' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className={`w-4 h-4 ${
                      isDarkMode ? 'text-red-400' : 'text-red-600'
                    }`} />
                    <span className={`text-sm font-medium ${
                      isDarkMode ? 'text-red-300' : 'text-red-800'
                    }`}>Top Country</span>
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-lg">{topCountry.flag}</span>
                    <span className={`font-semibold ${
                      isDarkMode ? 'text-red-200' : 'text-red-900'
                    }`}>{topCountry.country}</span>
                    <span className={isDarkMode ? 'text-red-300' : 'text-red-700'}>({topCountry.count} users)</span>
                  </div>
                </div>
              )}
            </div>

            {/* Country List */}
            <div className="flex-1 overflow-y-auto">
              {isLoadingData ? (
                <div className="flex flex-col items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mb-4"></div>
                  <p className={`text-sm ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {loading ? 'Loading user data...' : 'Processing country statistics...'}
                  </p>
                </div>
              ) : filteredAndSortedStats.length === 0 ? (
                <div className={`flex flex-col items-center justify-center h-32 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <BarChart3 className="w-8 h-8 mb-2" />
                  <p className="text-sm">
                    {searchTerm ? 'No countries match your search' : 'No data available'}
                  </p>
                </div>
              ) : (
                <div className="p-4 space-y-2">
                  {filteredAndSortedStats.map((stat, index) => (
                    <div
                      key={stat.country}
                      className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                        isDarkMode 
                          ? 'bg-gray-700 hover:bg-red-900/20' 
                          : 'bg-gray-50 hover:bg-red-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full shadow-sm ${
                          isDarkMode ? 'bg-gray-600' : 'bg-white'
                        }`}>
                          <span className="text-lg">{stat.flag}</span>
                        </div>
                        <div>
                          <div className={`font-medium ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>{stat.country}</div>
                          {stat.code && (
                            <div className={`text-xs ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>{stat.code}</div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${
                          isDarkMode ? 'text-red-400' : 'text-red-600'
                        }`}>{stat.count}</div>
                        <div className={`text-xs ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>{stat.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={`p-4 border-t transition-colors ${
              isDarkMode 
                ? 'border-gray-700 bg-gray-700' 
                : 'border-gray-200 bg-gray-50'
            }`}>
              <div className={`text-xs text-center ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Last updated: {new Date().toLocaleTimeString()}
              </div>
              <div className={`text-xs text-center mt-1 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-500'
              }`}>
                {isLoadingData ? (
                  'Loading data...'
                ) : (
                  `Analyzed all ${users.length} users from database`
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
