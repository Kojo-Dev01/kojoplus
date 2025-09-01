"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  ChevronDown,
  Eye,
  Edit,
  User,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Users,
  TrendingUp,
  MessageSquare,
  Calendar,
  Shield,
  RefreshCw,
  Ban,
  Send,
  BarChart3,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import StatisticsPanel from "@/components/trade/StatisticsPanel";
import BulkEmailModal from "@/components/common/BulkEmailModal";
import { useTheme } from '@/contexts/ThemeContext';
import COUNTRY_CODES from '@/data/countryCodes.json';
import { useRouter } from 'next/navigation';

export default function TradePage() {
  const [affiliates, setAffiliates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});
  const [pagination, setPagination] = useState({});
    const router = useRouter();
  const [selectedAffiliate, setSelectedAffiliate] = useState(null);
  const [filters, setFilters] = useState({
    country: "",
    telegramStatus: "",
    isActive: "",
    search: "",
    dateFrom: "",
    dateTo: "",
    page: 1,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showTelegramDropdown, setShowTelegramDropdown] = useState(false);
  const [showActiveDropdown, setShowActiveDropdown] = useState(false);
  const [countrySearchTerm, setCountrySearchTerm] = useState("");
  const [updateForm, setUpdateForm] = useState({
    exnessVerificationStatus: "",
    telegramInviteStatus: "",
    telegramGroupJoined: false,
    notes: "",
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [allAffiliatesLoaded, setAllAffiliatesLoaded] = useState(false);
  const [showStatsPanel, setShowStatsPanel] = useState(false);
  const [showBulkEmailModal, setShowBulkEmailModal] = useState(false);

  // Separate state for all affiliates (for bulk operations and statistics)
  const [allAffiliates, setAllAffiliates] = useState([]);
  const [loadingAllAffiliates, setLoadingAllAffiliates] = useState(false);

  // New state and logic for country filter dropdown
  const [countryFilter, setCountryFilter] = useState("");

  const { isDarkMode } = useTheme();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          
          // Check if user has access to resources
          if (userData?.isAdministrator && !userData.tabAccess?.includes('trade')) {
            setAccessDenied(true);
          }
        } else {
          router.replace('/auth/plus-code');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.replace('/auth/plus-code');
      }
    };

    checkAuth();
  }, [router]);

  // Helper function to extract country from WhatsApp number
  const getCountryFromWhatsApp = (whatsappNumber) => {
    if (!whatsappNumber) return null;

    // Remove any non-digit characters except +
    const cleanNumber = whatsappNumber.replace(/[^\d+]/g, "");

    // Try to match with country codes, starting with longest codes first
    const sortedCodes = [...COUNTRY_CODES].sort(
      (a, b) => b.code.length - a.code.length
    );

    for (const countryData of sortedCodes) {
      if (cleanNumber.startsWith(countryData.code)) {
        return countryData.country;
      }
    }

    return null;
  };

  const getCountry = (whatsappNumber) => {
    if (!whatsappNumber) return null;

    // Remove any non-digit characters except +
    const cleanNumber = whatsappNumber.replace(/[^\d+]/g, "");

    // Try to match with country codes, starting with longest codes first
    const sortedCodes = [...COUNTRY_CODES].sort(
      (a, b) => b.code.length - a.code.length
    );

    for (const countryData of sortedCodes) {
      if (cleanNumber.startsWith(countryData.code)) {
        return countryData;
      }
    }

    return null;
  };

  // Compute country counts from allAffiliates
  const countryCounts = (() => {
    const counts = {};
    allAffiliates.forEach((affiliate) => {
      const countryData = getCountry(affiliate.phone);
      if (countryData) {
        counts[countryData.country] = (counts[countryData.country] || 0) + 1;
      }
    });
    return counts;
  })();

  // Filtered countries for dropdown (only those present in DB, with search)
  const filteredCountries = Object.keys(countryCounts)
    .map((countryName) => {
      const countryData = COUNTRY_CODES.find((c) => c.country === countryName);
      return countryData
        ? { ...countryData, count: countryCounts[countryName] }
        : null;
    })
    .filter(Boolean)
    .filter((country) => {
      const searchLower = countrySearchTerm.toLowerCase();
      return (
        country.country.toLowerCase().includes(searchLower) ||
        country.code.toLowerCase().includes(searchLower)
      );
    });

  // Filter affiliates by country (client-side)
  const filteredAffiliates = affiliates.filter((affiliate) => {
    // Country filter
    if (filters.country) {
      const affiliateCountry = getCountryFromWhatsApp(affiliate.phone);
      if (affiliateCountry !== filters.country) return false;
    }

    // Search filter (client-side backup for real-time filtering)
    if (filters.search && filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase().trim();
      const matchesName = `${affiliate.firstName} ${affiliate.lastName}`.toLowerCase().includes(searchTerm);
      const matchesEmail = affiliate.email?.toLowerCase().includes(searchTerm);
      const matchesPhone = affiliate.phone?.toLowerCase().includes(searchTerm);
      
      if (!matchesName && !matchesEmail && !matchesPhone) return false;
    }

    return true;
  });


  const fetchAffiliates = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: filters.page.toString(),
        limit: "50",
        ...(filters.country && { country: filters.country }),
        ...(filters.telegramStatus && {
          telegramStatus: filters.telegramStatus,
        }),
        ...(filters.isActive !== "" && { isActive: filters.isActive }),
        ...(filters.search && filters.search.trim() && { search: filters.search.trim() }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo }),
      });

      const response = await fetch(`/api/affiliates?${params}`, {
        credentials: 'include' // Use cookies for authentication
      });

      if (response.ok) {
        const data = await response.json();
        setAffiliates(data.affiliates);
        setStats(data.stats);
        setPagination(data.pagination);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to fetch affiliates");
      }
    } catch (err) {
      if (err.message !== 'Authentication expired') {
        setError("Failed to fetch affiliates");
        console.error("Error fetching affiliates:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateAffiliate = async (affiliateId, updateData) => {
    try {
      setSubmitting(true);

      const response = await fetch(`/api/affiliates/${affiliateId}`, {
        method: "PATCH",
        credentials: 'include',
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const data = await response.json();

        // Update the affiliate in the list
        setAffiliates((prev) =>
          prev.map((affiliate) =>
            affiliate._id === affiliateId ? data.affiliate : affiliate
          )
        );

        // Update selected affiliate if it's the same one
        if (selectedAffiliate && selectedAffiliate._id === affiliateId) {
          setSelectedAffiliate(data.affiliate);
        }

        setShowUpdateModal(false);
        setUpdateForm({
          exnessVerificationStatus: "",
          telegramInviteStatus: "",
          telegramGroupJoined: false,
          notes: "",
          isActive: true,
        });

        // Refresh to update stats
        fetchAffiliates();

        return { success: true };
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to update affiliate");
        return { success: false };
      }
    } catch (err) {
      if (err.message !== 'Authentication expired') {
        setError("Failed to update affiliate");
        console.error("Error updating affiliate:", err);
      }
      return { success: false };
    } finally {
      setSubmitting(false);
    }
  };

  // New function to fetch all affiliates for statistics
  const fetchAllAffiliates = async () => {
    if (loadingAllAffiliates) return; // Prevent multiple simultaneous requests

    try {
      setLoadingAllAffiliates(true);

      console.log("Fetching all affiliates in background...");

      // Fetch all affiliates without pagination
      const response = await fetch("/api/affiliates?all=true", {
        credentials: 'include' // Use cookies for authentication
      });

      if (response.ok) {
        const data = await response.json();
        setAllAffiliates(data.affiliates || []);
        setAllAffiliatesLoaded(true);
        console.log(
          `Loaded ${data.affiliates?.length || 0} affiliates for bulk operations`
        );
        return data.affiliates || [];
      } else {
        console.error("Failed to fetch all affiliates");
        return [];
      }
    } catch (error) {
      if (error.message !== 'Authentication expired') {
        console.error("Error fetching all affiliates:", error);
      }
      return [];
    } finally {
      setLoadingAllAffiliates(false);
    }
  };

  // Handle opening statistics panel
  const handleOpenStatsPanel = async () => {
    setShowStatsPanel(true);

    // Always fetch fresh data when opening statistics panel
    await fetchAllAffiliates();
  };

  // Handle closing statistics panel
  const handleCloseStatsPanel = () => {
    setShowStatsPanel(false);
  };

  // Handle refresh of statistics (fetch all affiliates again)
  const handleRefreshStats = async () => {
    await fetchAllAffiliates();
  };

  // Load paginated affiliates on filter changes (including search)
  useEffect(() => {
    fetchAffiliates();
  }, [filters.page, filters.search, filters.telegramStatus, filters.isActive, filters.dateFrom, filters.dateTo]);

  // Load all affiliates in background on component mount
  useEffect(() => {
    fetchAllAffiliates();
  }, []);

  // Bulk Email Integration Functions
  const getAffiliateEmails = () => {
    return allAffiliates
      .filter((affiliate) => affiliate.email && affiliate.email.trim() !== "")
      .map((affiliate) => affiliate.email);
  };

  const getAffiliateEmailsByGroup = (group = "all") => {
    let filteredAffiliates = allAffiliates.filter(
      (affiliate) => affiliate.email && affiliate.email.trim() !== ""
    );

    switch (group) {
      case "active":
        filteredAffiliates = filteredAffiliates.filter(
          (affiliate) => affiliate.isActive
        );
        break;
      case "inactive":
        filteredAffiliates = filteredAffiliates.filter(
          (affiliate) => !affiliate.isActive
        );
        break;
      case "verified":
        filteredAffiliates = filteredAffiliates.filter(
          (affiliate) => affiliate.exnessVerificationStatus === "verified"
        );
        break;
      case "unverified":
        filteredAffiliates = filteredAffiliates.filter(
          (affiliate) => affiliate.exnessVerificationStatus !== "verified"
        );
        break;
      case "telegram-joined":
        filteredAffiliates = filteredAffiliates.filter(
          (affiliate) => affiliate.telegramGroupJoined === true
        );
        break;
      case "high-performers":
        filteredAffiliates = filteredAffiliates.filter(
          (affiliate) =>
            (affiliate.totalReferrals && affiliate.totalReferrals > 5) ||
            (affiliate.totalCommissions && affiliate.totalCommissions > 100)
        );
        break;
      case "all":
      default:
        break;
    }

    return filteredAffiliates.map((affiliate) => affiliate.email);
  };

  const getAffiliateGroupCounts = () => {
    const affiliatesWithEmails = allAffiliates.filter(
      (affiliate) => affiliate.email && affiliate.email.trim() !== ""
    );

    return {
      all: affiliatesWithEmails.length,
      active: affiliatesWithEmails.filter((affiliate) => affiliate.isActive)
        .length,
      inactive: affiliatesWithEmails.filter((affiliate) => !affiliate.isActive)
        .length,
      verified: affiliatesWithEmails.filter(
        (affiliate) => affiliate.exnessVerificationStatus === "verified"
      ).length,
      unverified: affiliatesWithEmails.filter(
        (affiliate) => affiliate.exnessVerificationStatus !== "verified"
      ).length,
      "telegram-joined": affiliatesWithEmails.filter(
        (affiliate) => affiliate.telegramGroupJoined === true
      ).length,
      "high-performers": affiliatesWithEmails.filter(
        (affiliate) =>
          (affiliate.totalReferrals && affiliate.totalReferrals > 5) ||
          (affiliate.totalCommissions && affiliate.totalCommissions > 100)
      ).length,
    };
  };

  // Get count of affiliates with valid emails
  const getValidEmailCount = () => {
    return allAffiliates.filter(
      (affiliate) => affiliate.email && affiliate.email.trim() !== ""
    ).length;
  };

  // Handle bulk email modal
  const handleOpenBulkEmailModal = () => {
    setShowBulkEmailModal(true);
  };

  const handleCloseBulkEmailModal = () => {
    setShowBulkEmailModal(false);
  };

  const getExnessStatusColor = (status) => {
    const colors = {
      verified: "bg-green-50 text-green-700 border-green-200",
      pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
      failed: "bg-red-50 text-red-700 border-red-200",
      not_found: "bg-gray-50 text-gray-700 border-gray-200",
    };
    return colors[status] || colors.pending;
  };

  const getExnessStatusIcon = (status) => {
    const icons = {
      verified: <CheckCircle className="w-4 h-4" />,
      pending: <Clock className="w-4 h-4" />,
      failed: <XCircle className="w-4 h-4" />,
      not_found: <AlertTriangle className="w-4 h-4" />,
    };
    return icons[status] || icons.pending;
  };

  const getTelegramStatusColor = (status) => {
    const colors = {
      generated: "bg-green-50 text-green-700 border-green-200",
      pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
      failed: "bg-red-50 text-red-700 border-red-200",
    };
    return colors[status] || colors.pending;
  };

  const getTelegramStatusIcon = (status) => {
    const icons = {
      generated: <CheckCircle className="w-4 h-4" />,
      pending: <Clock className="w-4 h-4" />,
      failed: <XCircle className="w-4 h-4" />,
    };
    return icons[status] || icons.pending;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleViewAffiliate = (affiliate) => {
    setSelectedAffiliate(affiliate);
    setShowDetailModal(true);
  };

  const handleEditAffiliate = (affiliate) => {
    setSelectedAffiliate(affiliate);
    setUpdateForm({
      exnessVerificationStatus: affiliate.exnessVerificationStatus,
      telegramInviteStatus: affiliate.telegramInviteStatus,
      telegramGroupJoined: affiliate.telegramGroupJoined,
      notes: affiliate.notes || "",
      isActive: affiliate.isActive,
    });
    setShowUpdateModal(true);
  };

  const handleUpdateSubmit = async () => {
    if (!selectedAffiliate) return;

    const updateData = {
      exnessVerificationStatus: updateForm.exnessVerificationStatus,
      telegramInviteStatus: updateForm.telegramInviteStatus,
      telegramGroupJoined: updateForm.telegramGroupJoined,
      notes: updateForm.notes.trim() || null,
      isActive: updateForm.isActive,
    };

    await updateAffiliate(selectedAffiliate._id, updateData);
  };

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6 max-w-[80vw]">
        {/* Error Display */}
        {error && (
          <div className={`border rounded-xl p-4 ${
            isDarkMode 
              ? 'bg-red-900/20 border-red-800' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center">
              <svg className={`w-5 h-5 mr-2 ${
                isDarkMode ? 'text-red-400' : 'text-red-500'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className={isDarkMode ? 'text-red-300' : 'text-red-700'}>{error}</p>
              <button 
                onClick={() => setError(null)}
                className={`ml-auto ${
                  isDarkMode 
                    ? 'text-red-400 hover:text-red-300' 
                    : 'text-red-500 hover:text-red-700'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className={`text-3xl font-bold ${
              isDarkMode ? 'text-white' : 'text-black'
            }`}>Trade with Kojo</h1>
            <p className={`mt-1 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Manage affiliate partners and track performance
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleOpenStatsPanel}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Statistics</span>
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-4 py-2 border rounded-xl transition-colors ${
                isDarkMode 
                  ? 'text-gray-300 border-gray-600 hover:bg-gray-700' 
                  : 'text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              <ChevronDown
                className={`w-4 h-4 transform transition-transform ${showFilters ? "rotate-180" : ""}`}
              />
            </button>
            <button
              onClick={() => fetchAffiliates()}
              className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
            >
              Refresh
            </button>
            <button
              onClick={handleOpenBulkEmailModal}
              disabled={loadingAllAffiliates || getValidEmailCount() === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative"
              title={
                getValidEmailCount() === 0
                  ? "No affiliates with email addresses"
                  : `Send bulk email to ${getValidEmailCount()} affiliate${getValidEmailCount() !== 1 ? "s" : ""}`
              }
            >
              {loadingAllAffiliates && !allAffiliatesLoaded ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  <span>Send Bulk Email</span>
                  {allAffiliatesLoaded && getValidEmailCount() > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-bold">
                        {getValidEmailCount()}
                      </span>
                    </div>
                  )}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          <div className={`rounded-2xl shadow-sm border p-6 transition-colors ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isDarkMode ? 'bg-blue-900/30 border border-blue-700/50' : 'bg-blue-100'
              }`}>
                <Users className={`w-6 h-6 ${
                  isDarkMode ? 'text-blue-300' : 'text-blue-600'
                }`} />
              </div>
              <div className="ml-4">
                <div className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Total Affiliates
                </div>
                <div className={`text-2xl font-bold ${
                  isDarkMode ? 'text-white' : 'text-black'
                }`}>
                  {loading ? "..." : stats.total}
                </div>
              </div>
            </div>
          </div>

          <div className={`rounded-2xl shadow-sm border p-6 transition-colors ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isDarkMode ? 'bg-green-900/30 border border-green-700/50' : 'bg-green-100'
              }`}>
                <CheckCircle className={`w-6 h-6 ${
                  isDarkMode ? 'text-green-300' : 'text-green-600'
                }`} />
              </div>
              <div className="ml-4">
                <div className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Verified
                </div>
                <div className={`text-2xl font-bold ${
                  isDarkMode ? 'text-green-300' : 'text-green-600'
                }`}>
                  {loading ? "..." : stats.verified}
                </div>
              </div>
            </div>
          </div>

          <div className={`rounded-2xl shadow-sm border p-6 transition-colors ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isDarkMode ? 'bg-yellow-900/30 border border-yellow-700/50' : 'bg-yellow-100'
              }`}>
                <Clock className={`w-6 h-6 ${
                  isDarkMode ? 'text-yellow-300' : 'text-yellow-600'
                }`} />
              </div>
              <div className="ml-4">
                <div className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Pending</div>
                <div className={`text-2xl font-bold ${
                  isDarkMode ? 'text-yellow-300' : 'text-yellow-600'
                }`}>
                  {loading ? "..." : stats.pending}
                </div>
              </div>
            </div>
          </div>

          <div className={`rounded-2xl shadow-sm border p-6 transition-colors ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isDarkMode ? 'bg-blue-900/30 border border-blue-700/50' : 'bg-blue-100'
              }`}>
                <MessageSquare className={`w-6 h-6 ${
                  isDarkMode ? 'text-blue-300' : 'text-blue-600'
                }`} />
              </div>
              <div className="ml-4">
                <div className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Telegram Generated
                </div>
                <div className={`text-2xl font-bold ${
                  isDarkMode ? 'text-blue-300' : 'text-blue-600'
                }`}>
                  {loading ? "..." : stats.telegramGenerated}
                </div>
              </div>
            </div>
          </div>

          <div className={`rounded-2xl shadow-sm border p-6 transition-colors ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isDarkMode ? 'bg-purple-900/30 border border-purple-700/50' : 'bg-purple-100'
              }`}>
                <Users className={`w-6 h-6 ${
                  isDarkMode ? 'text-purple-300' : 'text-purple-600'
                }`} />
              </div>
              <div className="ml-4">
                <div className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Telegram Joined
                </div>
                <div className={`text-2xl font-bold ${
                  isDarkMode ? 'text-purple-300' : 'text-purple-600'
                }`}>
                  {loading ? "..." : stats.telegramJoined}
                </div>
              </div>
            </div>
          </div>

          <div className={`rounded-2xl shadow-sm border p-6 transition-colors ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isDarkMode ? 'bg-green-900/30 border border-green-700/50' : 'bg-green-100'
              }`}>
                <TrendingUp className={`w-6 h-6 ${
                  isDarkMode ? 'text-green-300' : 'text-green-600'
                }`} />
              </div>
              <div className="ml-4">
                <div className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Active</div>
                <div className={`text-2xl font-bold ${
                  isDarkMode ? 'text-green-300' : 'text-green-600'
                }`}>
                  {loading ? "..." : stats.active}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className={`rounded-2xl shadow-sm border p-6 transition-colors ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {/* Search Input */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Search
                </label>
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-400'
                  }`} />
                  <input
                    type="text"
                    placeholder="Search by name, email, or phone..."
                    value={filters.search}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        search: e.target.value,
                        page: 1,
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        fetchAffiliates();
                      }
                    }}
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 font-medium transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                  {filters.search && (
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, search: '', page: 1 }))}
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                        isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Country Filter with Search */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Country
                </label>
                <div className="relative">
                  <button
                    type="button"
                    className={`relative w-full border rounded-xl shadow-sm pl-3 pr-10 py-3 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                  >
                    <span className={`block truncate font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {countryFilter
                        ? (() => {
                            const selected = filteredCountries.find(
                              (c) => c.country === countryFilter
                            );
                            return selected ? (
                              <span className="flex items-center space-x-2">
                                <span>{selected.flag}</span>
                                <span>{selected.country}</span>
                                <span className={`text-sm ${
                                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                  ({selected.code})
                                </span>
                                <span className="ml-2 text-xs text-green-700 font-bold">
                                  {selected.count}
                                </span>
                              </span>
                            ) : (
                              countryFilter
                            );
                          })()
                        : "All Countries"}
                    </span>
                    <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <ChevronDown
                        className={`h-5 w-5 transition-transform duration-200 ${
                          showCountryDropdown ? "rotate-180" : ""
                        } ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                      />
                    </span>
                  </button>
                  {showCountryDropdown && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowCountryDropdown(false)}
                      />
                      <div className={`absolute z-20 mt-1 w-full shadow-lg max-h-80 rounded-xl py-1 ring-1 ring-opacity-5 overflow-hidden focus:outline-none transition-colors ${
                        isDarkMode 
                          ? 'bg-gray-800 ring-gray-600' 
                          : 'bg-white ring-black'
                      }`}>
                        {/* Search input inside dropdown */}
                        <div className={`p-2 border-b ${
                          isDarkMode ? 'border-gray-600' : 'border-gray-200'
                        }`}>
                          <div className="relative">
                            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-400'
                            }`} />
                            <input
                              type="text"
                              placeholder="Search country or code..."
                              value={countrySearchTerm}
                              onChange={(e) =>
                                setCountrySearchTerm(e.target.value)
                              }
                              className={`w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm transition-colors ${
                                isDarkMode 
                                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                                  : 'bg-white border-gray-300 text-gray-600 placeholder-gray-500'
                              }`}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                          {/* All Countries option */}
                          <button
                            type="button"
                            className={`w-full text-left relative cursor-pointer select-none py-2 pl-3 pr-9 transition-colors ${
                              !countryFilter
                                ? isDarkMode
                                  ? 'bg-red-900/50 text-red-300 font-semibold'
                                  : 'bg-red-50 text-red-900 font-semibold'
                                : isDarkMode
                                  ? 'text-gray-300 font-medium hover:bg-gray-700 hover:text-white'
                                  : 'text-gray-900 font-medium hover:bg-red-50 hover:text-red-900'
                            }`}
                            onClick={() => {
                              setFilters((prev) => ({
                                ...prev,
                                country: "",
                                page: 1,
                              }));
                              setShowCountryDropdown(false);
                              setCountrySearchTerm("");
                            }}
                          >
                            <span className="block truncate">
                              All Countries
                            </span>
                            {!countryFilter && (
                              <span className={`absolute inset-y-0 right-0 flex items-center pr-3 ${
                                isDarkMode ? 'text-red-400' : 'text-red-600'
                              }`}>
                                <CheckCircle className="h-4 w-4" />
                              </span>
                            )}
                          </button>

                          {/* Filtered countries from DB */}
                          {filteredCountries.map((country) => (
                            <button
                              key={`${country.code}-${country.country}`}
                              type="button"
                              className={`w-full text-left relative cursor-pointer select-none py-2 pl-3 pr-9 transition-colors ${
                                countryFilter === country.country
                                  ? isDarkMode
                                    ? 'bg-red-900/50 text-red-300 font-semibold'
                                    : 'bg-red-50 text-red-900 font-semibold'
                                  : isDarkMode
                                    ? 'text-gray-300 font-medium hover:bg-gray-700 hover:text-white'
                                    : 'text-gray-900 font-medium hover:bg-red-50 hover:text-red-900'
                              }`}
                              onClick={() => {
                                setFilters((prev) => ({
                                  ...prev,
                                  country: country.country,
                                  page: 1,
                                }));
                                setShowCountryDropdown(false);
                                setCountryFilter(country.country);
                                setCountrySearchTerm("");
                              }}
                            >
                              <div className="flex items-center space-x-2 truncate">
                                <span>{country.flag}</span>
                                <span className="truncate">
                                  {country.country}
                                </span>
                                <span className={`text-sm ${
                                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                  ({country.code})
                                </span>
                                <span className="ml-2 text-xs text-green-700 font-bold">
                                  {country.count}
                                </span>
                              </div>
                              {countryFilter === country.country && (
                                <span className={`absolute inset-y-0 right-0 flex items-center pr-3 ${
                                  isDarkMode ? 'text-red-400' : 'text-red-600'
                                }`}>
                                  <CheckCircle className="h-4 w-4" />
                                </span>
                              )}
                            </button>
                          ))}

                          {filteredCountries.length === 0 &&
                            countrySearchTerm && (
                              <div className={`py-4 px-3 text-center text-sm ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                                No countries found matching &quot;
                                {countrySearchTerm}&quot;
                              </div>
                            )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Telegram Status Filter */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Telegram Status
                </label>
                <div className="relative">
                  <button
                    type="button"
                    className={`relative w-full border rounded-xl shadow-sm pl-3 pr-10 py-3 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    onClick={() =>
                      setShowTelegramDropdown(!showTelegramDropdown)
                    }
                  >
                    <span className={`block truncate font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {filters.telegramStatus
                        ? filters.telegramStatus.charAt(0).toUpperCase() +
                          filters.telegramStatus.slice(1)
                        : "All Status"}
                    </span>
                    <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <ChevronDown
                        className={`h-5 w-5 transition-transform duration-200 ${
                          showTelegramDropdown ? "rotate-180" : ""
                        } ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                      />
                    </span>
                  </button>

                  {showTelegramDropdown && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowTelegramDropdown(false)}
                      />
                      <div className={`absolute z-20 mt-1 w-full shadow-lg max-h-60 rounded-xl py-1 ring-1 ring-opacity-5 overflow-auto focus:outline-none transition-colors ${
                        isDarkMode 
                          ? 'bg-gray-800 ring-gray-600' 
                          : 'bg-white ring-black'
                      }`}>
                        {[
                          { value: "", label: "All Status" },
                          { value: "generated", label: "Generated" },
                          { value: "pending", label: "Pending" },
                          { value: "failed", label: "Failed" },
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            className={`w-full text-left relative cursor-pointer select-none py-2 pl-3 pr-9 transition-colors ${
                              filters.telegramStatus === option.value
                                ? isDarkMode
                                  ? 'bg-red-900/50 text-red-300 font-semibold'
                                  : 'bg-red-50 text-red-900 font-semibold'
                                : isDarkMode
                                  ? 'text-gray-300 font-medium hover:bg-gray-700 hover:text-white'
                                  : 'text-gray-900 font-medium hover:bg-red-50 hover:text-red-900'
                            }`}
                            onClick={() => {
                              setFilters((prev) => ({
                                ...prev,
                                telegramStatus: option.value,
                                page: 1,
                              }));
                              setShowTelegramDropdown(false);
                            }}
                          >
                            <span className="block truncate">
                              {option.label}
                            </span>
                            {filters.telegramStatus === option.value && (
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

              {/* Date From */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  From Date
                </label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      dateFrom: e.target.value,
                      page: 1,
                    }))
                  }
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              {/* Date To */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  To Date
                </label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      dateTo: e.target.value,
                      page: 1,
                    }))
                  }
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
            </div>
          </div>
        )}

        {/* Affiliates Table */}
        <div className={`rounded-2xl shadow-sm border overflow-hidden transition-colors ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="overflow-x-auto">
            <table
              className={`min-w-full divide-y ${
                isDarkMode ? 'divide-gray-700' : 'divide-gray-200'
              }`}
              style={{ tableLayout: "fixed" }}
            >
              <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                <tr>
                  <th className={`w-80 px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    Affiliate
                  </th>
                  <th className={`w-72 px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    Contact
                  </th>
                  <th className={`w-48 px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    Country
                  </th>
                  <th className={`w-48 px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    Telegram Status
                  </th>
                  <th className={`w-44 px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    Joined Date
                  </th>
                  <th className={`w-40 px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y transition-colors ${
                isDarkMode 
                  ? 'bg-gray-800 divide-gray-700' 
                  : 'bg-white divide-gray-200'
              }`}>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : filteredAffiliates.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center">
                      <div className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                        <Users className={`w-12 h-12 mx-auto mb-4 ${
                          isDarkMode ? 'text-gray-500' : 'text-gray-300'
                        }`} />
                        <p className="text-lg font-medium">
                          No affiliates found
                        </p>
                        <p className="text-sm">
                          {filters.country
                            ? `No affiliates found from ${filters.country}`
                            : "Try adjusting your filters or check back later."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAffiliates.map((affiliate) => {
                    const affiliateCountry = getCountryFromWhatsApp(
                      affiliate.phone
                    );
                    const countryData = COUNTRY_CODES.find(
                      (c) => c.country === affiliateCountry
                    );

                    return (
                      <tr
                        key={affiliate._id}
                        className={`transition-colors ${
                          isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className="w-80 px-6 py-4">
                          <div className="flex items-center min-w-0">
                            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
                              <User className="w-5 h-5 text-white" />
                            </div>
                            <div className="ml-4 min-w-0 flex-1">
                              <div
                                className={`text-sm font-medium truncate ${
                                  isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}
                                title={`${affiliate.firstName} ${affiliate.lastName}`}
                              >
                                {affiliate.firstName} {affiliate.lastName}
                              </div>
                              <div className="text-sm truncate">
                                {affiliate.isActive ? (
                                  <span className={`font-medium ${
                                    isDarkMode ? 'text-green-400' : 'text-green-600'
                                  }`}>
                                    Active
                                  </span>
                                ) : (
                                  <span className={`font-medium ${
                                    isDarkMode ? 'text-red-400' : 'text-red-600'
                                  }`}>
                                    Inactive
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="w-72 px-6 py-4">
                          <div className="min-w-0">
                            <div className={`flex items-center space-x-1 text-sm mb-1 ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-600'
                            }`}>
                              <Mail className="w-4 h-4 flex-shrink-0" />
                              <span
                                className="truncate"
                                title={affiliate.email}
                              >
                                {affiliate.email}
                              </span>
                            </div>
                            {affiliate.phone && (
                              <div className={`flex items-center space-x-1 text-sm ${
                                isDarkMode ? 'text-gray-300' : 'text-gray-600'
                              }`}>
                                <Phone className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">
                                  {affiliate.phone}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="w-48 px-6 py-4">
                          <div className="min-w-0">
                            {countryData ? (
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">
                                  {countryData.flag}
                                </span>
                                <div>
                                  <div className={`text-sm font-medium truncate ${
                                    isDarkMode ? 'text-white' : 'text-gray-900'
                                  }`}>
                                    {countryData.country}
                                  </div>
                                  <div className={`text-xs ${
                                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                  }`}>
                                    {countryData.code}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className={`text-sm ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                                Unknown
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="w-48 px-6 py-4">
                          <div className="min-w-0">
                            <div
                              className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${getTelegramStatusColor(affiliate.telegramInviteStatus)}`}
                            >
                              <div className="flex items-center min-w-0">
                                {getTelegramStatusIcon(
                                  affiliate.telegramInviteStatus
                                )}
                                <span className="ml-1 truncate">
                                  {affiliate.telegramInviteStatus}
                                </span>
                              </div>
                            </div>
                            <div className="text-xs mt-1">
                              {affiliate.telegramGroupJoined ? (
                                <span className="text-green-600 font-medium">
                                  Joined Group
                                </span>
                              ) : (
                                <span className="text-gray-500">
                                  Not Joined
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="w-44 px-6 py-4">
                          <div className={`text-sm truncate ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {formatDate(affiliate.createdAt)}
                          </div>
                          {affiliate.telegramGroupJoinedAt && (
                            <div className={`text-xs mt-1 truncate ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              TG: {formatDate(affiliate.telegramGroupJoinedAt)}
                            </div>
                          )}
                        </td>
                        <td className="w-40 px-6 py-4">
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleViewAffiliate(affiliate)}
                              className={`flex items-center px-2 py-1 rounded-lg transition-colors text-xs ${
                                isDarkMode 
                                  ? 'bg-blue-900/50 text-blue-300 hover:bg-blue-900/70' 
                                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              }`}
                              title="View Details"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </button>
                            <button
                              onClick={() => handleEditAffiliate(affiliate)}
                              className={`flex items-center px-2 py-1 rounded-lg transition-colors text-xs ${
                                isDarkMode 
                                  ? 'bg-green-900/50 text-green-300 hover:bg-green-900/70' 
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                              title="Edit Affiliate"
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className={`px-4 py-3 border-t sm:px-6 transition-colors ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className={`text-sm ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Showing {filteredAffiliates.length} of {affiliates.length} affiliates
                  {filters.search && ` matching "${filters.search}"`}
                  {filters.country && ` from ${filters.country}`}
                  {pagination.totalCount &&
                    ` (${pagination.totalCount} total in database)`}
                </div>
                <div className="flex items-center space-x-1">
                  {/* Previous Button */}
                  <button
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, page: prev.page - 1 }))
                    }
                    disabled={!pagination.hasPrev}
                    className="px-3 py-1 bg-black text-white border border-black rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
                  >
                    Previous
                  </button>
                  {/* Page Numbers */}
                  <div className="flex items-center space-x-1">
                    {/* First page */}
                    {pagination.currentPage > 3 && (
                      <>
                        <button
                          onClick={() =>
                            setFilters((prev) => ({ ...prev, page: 1 }))
                          }
                          className={`px-3 py-1 text-sm border rounded transition-colors ${
                            isDarkMode 
                              ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          1
                        </button>
                        {pagination.currentPage > 4 && (
                          <span className={`px-2 py-1 text-sm ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            ...
                          </span>
                        )}
                      </>
                    )}
                    {/* Pages around current page */}
                    {Array.from(
                      { length: pagination.totalPages },
                      (_, i) => i + 1
                    )
                      .filter((pageNum) => {
                        const current = pagination.currentPage;
                        return pageNum >= current - 2 && pageNum <= current + 2;
                      })
                      .map((pageNum) => (
                        <button
                          key={pageNum}
                          onClick={() =>
                            setFilters((prev) => ({ ...prev, page: pageNum }))
                          }
                          className={`px-3 py-1 text-sm border rounded transition-colors ${
                            pageNum === pagination.currentPage
                              ? "bg-red-600 text-white border-red-600"
                              : isDarkMode 
                                ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                                : "border-gray-300 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}
                    {/* Last page */}
                    {pagination.currentPage < pagination.totalPages - 2 && (
                      <>
                        {pagination.currentPage < pagination.totalPages - 3 && (
                          <span className={`px-2 py-1 text-sm ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            ...
                          </span>
                        )}
                        <button
                          onClick={() =>
                            setFilters((prev) => ({
                              ...prev,
                              page: pagination.totalPages,
                            }))
                          }
                          className={`px-3 py-1 text-sm border rounded transition-colors ${
                            isDarkMode 
                              ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {pagination.totalPages}
                        </button>
                      </>
                    )}
                  </div>
                  {/* Next Button */}
                  <button
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, page: prev.page + 1 }))
                    }
                    disabled={!pagination.hasNext}
                    className="px-3 py-1 bg-black text-white border border-black rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Detail Modal */}
        {showDetailModal && selectedAffiliate && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 min-h-screen">
            <div className={`rounded-2xl shadow-2xl border max-w-4xl w-full max-h-[95vh] overflow-y-auto transition-colors ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              {/* Modal header and content with dark mode styling */}
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      Affiliate Details
                    </h3>
                    <p className="text-gray-300 text-sm mt-1">
                      {selectedAffiliate.firstName} {selectedAffiliate.lastName}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    <XCircle className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column - Personal Details */}
                  <div className="space-y-4">
                    {/* Personal Information */}
                    <div className={`rounded-xl p-4 transition-colors ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                    }`}>
                      <h4 className={`font-medium mb-3 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        Personal Information
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className={`text-sm ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>Name</label>
                          <p className={`font-medium ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {selectedAffiliate.firstName}{" "}
                            {selectedAffiliate.lastName}
                          </p>
                        </div>
                        <div>
                          <label className={`text-sm ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>Email</label>
                          <p className={`break-all ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {selectedAffiliate.email}
                          </p>
                        </div>
                        <div>
                          <label className={`text-sm ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>Phone</label>
                          <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                            {selectedAffiliate.phone || "Not provided"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Contact Actions */}
                    <div className={`rounded-xl p-4 border transition-colors ${
                      isDarkMode 
                        ? 'bg-blue-900/20 border-blue-700/50' 
                        : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200'
                    }`}>
                      <h4 className={`font-medium mb-3 flex items-center ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        <MessageSquare className={`w-5 h-5 mr-2 ${
                          isDarkMode ? 'text-blue-400' : 'text-blue-600'
                        }`} />
                        Quick Contact
                      </h4>
                      <div className="grid grid-cols-1 gap-3">
                        {/* Email Button */}
                        <a
                          href={`mailto:${selectedAffiliate.email}?subject=Regarding Your Exness Affiliate Account&body=Hello ${selectedAffiliate.firstName},\n\nI hope this email finds you well.\n\nBest regards,\nKojo Admin Team`}
                          className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors group"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Mail className="w-4 h-4" />
                          <span className="font-medium">Send Email</span>
                          <svg
                            className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-6m-6 1l8-8m0 0l-6 0m6 0v6"
                            />
                          </svg>
                        </a>

                        {/* WhatsApp Button */}
                        {selectedAffiliate.phone && (
                          <a
                            href={`https://wa.me/${selectedAffiliate.phone.replace(/[^\d]/g, "")}?text=Hello%20${selectedAffiliate.firstName},%20I%20hope%20you%20are%20doing%20well.%20I%20am%20reaching%20out%20regarding%20your%20Exness%20affiliate%20account.%20%0A%0ABest%20regards,%0AKojo%20Admin%20Team`}
                            className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors group"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span className="font-medium">
                              WhatsApp Message
                            </span>
                            <svg
                              className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-6m-6 1l8-8m0 0l-6 0m6 0v6"
                            />
                          </svg>
                          </a>
                        )}

                        {/* Telegram Link Button (if available) */}
                        {/* {selectedAffiliate.telegramInviteLink && (
                          <a
                            href={selectedAffiliate.telegramInviteLink}
                            className="flex items-center justify-center space-x-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors group"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Send className="w-4 h-4" />
                            <span className="font-medium">Open Telegram Link</span>
                            <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-6m-6 1l8-8m0 0l-6 0m6 0v6" />
                            </svg>
                          </a>
                        )} */}
                      </div>
                    </div>

                    {/* Exness Details */}
                    <div className={`rounded-xl p-4 transition-colors ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                    }`}>
                      <h4 className={`font-medium mb-3 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        Exness Information
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className={`text-sm ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            Verification Status
                          </label>
                          <div
                            className={`inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full border mt-1 ${getExnessStatusColor(selectedAffiliate.exnessVerificationStatus)}`}
                          >
                            {getExnessStatusIcon(
                              selectedAffiliate.exnessVerificationStatus
                            )}
                            <span className="ml-1">
                              {selectedAffiliate.exnessVerificationStatus.replace(
                                "_",
                                " "
                              )}
                            </span>
                          </div>
                        </div>
                        <div>
                          <label className={`text-sm ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            Affiliated
                          </label>
                          <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                            {selectedAffiliate.exnessData?.isAffiliated
                              ? "Yes"
                              : "No"}
                          </p>
                        </div>
                        {selectedAffiliate.exnessData?.affiliationDate && (
                          <div>
                            <label className={`text-sm ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              Affiliation Date
                            </label>
                            <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                              {formatDate(
                                selectedAffiliate.exnessData.affiliationDate
                              )}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Telegram & Status */}
                  <div className="space-y-4">
                    {/* Telegram Information */}
                    <div className={`rounded-xl p-4 transition-colors ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                    }`}>
                      <h4 className={`font-medium mb-3 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        Telegram Information
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className={`text-sm ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            Invite Status
                          </label>
                          <div
                            className={`inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full border mt-1 ${getTelegramStatusColor(selectedAffiliate.telegramInviteStatus)}`}
                          >
                            {getTelegramStatusIcon(
                              selectedAffiliate.telegramInviteStatus
                            )}
                            <span className="ml-1">
                              {selectedAffiliate.telegramInviteStatus}
                            </span>
                          </div>
                        </div>
                        <div>
                          <label className={`text-sm ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            Group Joined
                          </label>
                          <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                            {selectedAffiliate.telegramGroupJoined ? (
                              <span className={`font-medium ${
                                isDarkMode ? 'text-green-400' : 'text-green-600'
                              }`}>
                                Yes
                              </span>
                            ) : (
                              <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>No</span>
                            )}
                          </p>
                        </div>
                        {selectedAffiliate.telegramGroupJoinedAt && (
                          <div>
                            <label className={`text-sm ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              Joined Date
                            </label>
                            <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                              {formatDate(
                                selectedAffiliate.telegramGroupJoinedAt
                              )}
                            </p>
                          </div>
                        )}
                        {selectedAffiliate.telegramInviteLink && (
                          <div>
                            <label className={`text-sm ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              Invite Link
                            </label>
                            <p className={`text-sm break-all ${
                              isDarkMode ? 'text-blue-400' : 'text-blue-600'
                            }`}>
                              <a
                                href={selectedAffiliate.telegramInviteLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline"
                              >
                                {selectedAffiliate.telegramInviteLink}
                              </a>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Account Status */}
                    <div className={`rounded-xl p-4 transition-colors ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                    }`}>
                      <h4 className={`font-medium mb-3 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        Account Status
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className={`text-sm ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            Status
                          </label>
                          <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                            {selectedAffiliate.isActive ? (
                              <span className={`font-medium ${
                                isDarkMode ? 'text-green-400' : 'text-green-600'
                              }`}>
                                Active
                              </span>
                            ) : (
                              <span className={`font-medium ${
                                isDarkMode ? 'text-red-400' : 'text-red-600'
                              }`}>
                                Inactive
                              </span>
                            )}
                          </p>
                        </div>
                        <div>
                          <label className={`text-sm ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            Created
                          </label>
                          <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                            {formatDate(selectedAffiliate.createdAt)}
                          </p>
                        </div>
                        <div>
                          <label className={`text-sm ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            Last Updated
                          </label>
                          <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                            {formatDate(selectedAffiliate.updatedAt)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    {selectedAffiliate.notes && (
                      <div className={`rounded-xl p-4 transition-colors ${
                        isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                      }`}>
                        <h4 className={`font-medium mb-3 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          Notes
                        </h4>
                        <p className={`text-sm leading-relaxed whitespace-pre-wrap ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-900'
                        }`}>
                          {selectedAffiliate.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className={`flex space-x-3 mt-6 pt-4 border-t transition-colors ${
                  isDarkMode ? 'border-gray-600' : 'border-gray-200'
                }`}>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className={`flex-1 px-4 py-2 border rounded-xl transition-colors ${
                      isDarkMode 
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      handleEditAffiliate(selectedAffiliate);
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    Edit Affiliate
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Update Modal */}
        {showUpdateModal && selectedAffiliate && (
          <div className="fixed inset-0 bg-white/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={`rounded-2xl shadow-2xl border max-w-2xl w-full transition-colors ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <h3 className={`text-xl font-semibold ${
                    isDarkMode ? 'text-white' : 'text-black'
                  }`}>
                    Update Affiliate
                  </h3>
                  <button
                    onClick={() => setShowUpdateModal(false)}
                    className={`transition-colors ${
                      isDarkMode 
                        ? 'text-gray-400 hover:text-gray-200' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Affiliate Info */}
                  <div className={`rounded-lg p-4 transition-colors ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <h4 className={`font-medium mb-2 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {selectedAffiliate.firstName} {selectedAffiliate.lastName}
                    </h4>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {selectedAffiliate.email}
                    </p>
                  </div>

                  {/* Form Fields */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Exness Verification Status
                    </label>
                    <select
                      value={updateForm.exnessVerificationStatus}
                      onChange={(e) =>
                        setUpdateForm((prev) => ({
                          ...prev,
                          exnessVerificationStatus: e.target.value,
                        }))
                      }
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="verified">Verified</option>
                      <option value="failed">Failed</option>
                      <option value="not_found">Not Found</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Telegram Invite Status
                    </label>
                    <select
                      value={updateForm.telegramInviteStatus}
                      onChange={(e) =>
                        setUpdateForm((prev) => ({
                          ...prev,
                          telegramInviteStatus: e.target.value,
                        }))
                      }
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="generated">Generated</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Telegram Group Joined
                    </label>
                    <select
                      value={updateForm.telegramGroupJoined}
                      onChange={(e) =>
                        setUpdateForm((prev) => ({
                          ...prev,
                          telegramGroupJoined: e.target.value === "true",
                        }))
                      }
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Account Status
                    </label>
                    <select
                      value={updateForm.isActive}
                      onChange={(e) =>
                        setUpdateForm((prev) => ({
                          ...prev,
                          isActive: e.target.value === "true",
                        }))
                      }
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Notes
                    </label>
                    <textarea
                      value={updateForm.notes}
                      onChange={(e) =>
                        setUpdateForm((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                      rows="4"
                      placeholder="Add any internal notes about this affiliate..."
                      maxLength={500}
                    />
                    <div className={`text-xs mt-1 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {updateForm.notes.length}/500 characters
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => setShowUpdateModal(false)}
                    className={`flex-1 px-4 py-2 border rounded-xl transition-colors ${
                      isDarkMode 
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateSubmit}
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Updating...</span>
                      </>
                    ) : (
                      <span>Update Affiliate</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Panel */}
        <StatisticsPanel
          isOpen={showStatsPanel}
          onClose={handleCloseStatsPanel}
          affiliates={allAffiliates}
          totalStats={stats}
          loading={loadingAllAffiliates}
          onRefresh={handleRefreshStats}
        />

        {/* Bulk Email Modal Integration - NEW */}
        <BulkEmailModal
          isOpen={showBulkEmailModal}
          onClose={handleCloseBulkEmailModal}
          emails={getAffiliateEmails()}
          title="Send Bulk Email to Affiliates"
          subtitle={`Send messages to your affiliate network (${getValidEmailCount()} affiliates with email addresses)`}
          getEmailsByGroup={getAffiliateEmailsByGroup}
          getGroupCounts={getAffiliateGroupCounts}
          isDataLoaded={allAffiliatesLoaded}
          isLoadingData={loadingAllAffiliates}
        />
      </div>
    </DashboardLayout>
  );
}
