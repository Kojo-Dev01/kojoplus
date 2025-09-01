"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  Filter,
  Search,
  ChevronDown,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
  Video,
  DollarSign,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useTheme } from "@/contexts/ThemeContext";
import { useRouter } from "next/navigation";

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
    const [user, setUser] = useState(null);
  const [stats, setStats] = useState({});
  const router = useRouter();
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    status: "",
    search: "",
    page: 1,
  });
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    status: "",
    scheduledDate: "",
    meetingLink: "",
    notes: "",
    adminNotes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const { isDarkMode } = useTheme();

  useEffect(() => {
      const checkAuth = async () => {
        try {
          const response = await fetch('/api/auth/me');
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
            
            // Check if user has access to resources
            if (userData?.isAdministrator && !userData.tabAccess?.includes('one_on_one')) {
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

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: filters.page.toString(),
        limit: "50",
        ...(filters.status && { status: filters.status }),
        ...(filters.search && { search: filters.search }),
      });

      const response = await fetch(
        `/api/mentorship-bookings?${params}`, {
          credentials: 'include'
        }
      );

      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings);
        setStats(data.stats);
        setPagination(data.pagination);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to fetch bookings");
      }
    } catch (err) {
      if (err.message !== "Authentication expired") {
        setError("Failed to fetch bookings");
        console.error("Error fetching bookings:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId, updateData) => {
    try {
      setSubmitting(true);

      const response = await fetch(
        `/api/mentorship-bookings/${bookingId}`,
        {
          method: "PATCH",
          credentials: 'include',
          body: JSON.stringify(updateData),
        }
      );

      if (response.ok) {
        const data = await response.json();

        // Update the booking in the list
        setBookings((prev) =>
          prev.map((booking) =>
            booking._id === bookingId ? data.booking : booking
          )
        );

        // Update selected booking if it's the same one
        if (selectedBooking && selectedBooking._id === bookingId) {
          setSelectedBooking(data.booking);
        }

        setShowUpdateModal(false);
        setUpdateForm({
          status: "",
          scheduledDate: "",
          meetingLink: "",
          notes: "",
          adminNotes: "",
        });

        // Refresh to update stats
        fetchBookings();

        return { success: true };
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to update booking");
        return { success: false };
      }
    } catch (err) {
      if (err.message !== "Authentication expired") {
        setError("Failed to update booking");
        console.error("Error updating booking:", err);
      }
      return { success: false };
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [filters.status, filters.search, filters.page]);

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
      contacted: "bg-blue-50 text-blue-700 border-blue-200",
      scheduled: "bg-purple-50 text-purple-700 border-purple-200",
      completed: "bg-green-50 text-green-700 border-green-200",
      cancelled: "bg-red-50 text-red-700 border-red-200",
    };
    return colors[status] || colors.pending;
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock className="w-4 h-4" />,
      contacted: <MessageSquare className="w-4 h-4" />,
      scheduled: <Calendar className="w-4 h-4" />,
      completed: <CheckCircle className="w-4 h-4" />,
      cancelled: <XCircle className="w-4 h-4" />,
    };
    return icons[status] || icons.pending;
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      paid: "bg-green-100 text-green-800",
      refunded: "bg-red-100 text-red-800",
    };
    return colors[status] || colors.pending;
  };

  const formatDate = (date) => {
    if (!date) return "Not scheduled";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleViewBooking = (booking) => {
    setSelectedBooking(booking);
    setShowDetailModal(true);
  };

  const handleEditBooking = (booking) => {
    setSelectedBooking(booking);
    setUpdateForm({
      status: booking.status,
      scheduledDate: booking.scheduledDate
        ? new Date(booking.scheduledDate).toISOString().slice(0, 16)
        : "",
      meetingLink: booking.meetingLink || "",
      notes: booking.notes || "",
      adminNotes: booking.adminNotes || "",
    });
    setShowUpdateModal(true);
  };

  const handleQuickStatusUpdate = async (bookingId, newStatus) => {
    await updateBookingStatus(bookingId, { status: newStatus });
  };

  const handleUpdateSubmit = async () => {
    if (!selectedBooking) return;

    const updateData = {
      status: updateForm.status,
      adminNotes: updateForm.adminNotes,
    };

    if (updateForm.scheduledDate) {
      updateData.scheduledDate = new Date(updateForm.scheduledDate);
    }

    if (updateForm.meetingLink) {
      updateData.meetingLink = updateForm.meetingLink;
    }

    if (updateForm.notes) {
      updateData.notes = updateForm.notes;
    }

    await updateBookingStatus(selectedBooking._id, updateData);
  };

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Error Display */}
        {error && (
          <div
            className={`border rounded-xl p-4 ${
              isDarkMode
                ? "bg-red-900/20 border-red-800"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex items-center">
              <AlertCircle
                className={`w-5 h-5 mr-2 ${
                  isDarkMode ? "text-red-400" : "text-red-500"
                }`}
              />
              <p className={isDarkMode ? "text-red-300" : "text-red-700"}>
                {error}
              </p>
              <button
                onClick={() => setError(null)}
                className={`ml-auto ${
                  isDarkMode
                    ? "text-red-400 hover:text-red-300"
                    : "text-red-500 hover:text-red-700"
                }`}
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1
              className={`text-3xl font-bold ${
                isDarkMode ? "text-white" : "text-black"
              }`}
            >
              Mentorship Bookings
            </h1>
            <p
              className={`mt-1 ${
                isDarkMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Manage one-on-one mentorship session bookings
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-4 py-2 border rounded-xl transition-colors ${
                isDarkMode
                  ? "text-gray-300 border-gray-600 hover:bg-gray-700"
                  : "text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              <ChevronDown
                className={`w-4 h-4 transform transition-transform ${showFilters ? "rotate-180" : ""}`}
              />
            </button>
            <button
              onClick={fetchBookings}
              className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          <div
            className={`rounded-2xl shadow-sm border p-6 transition-colors ${
              isDarkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="flex items-center">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isDarkMode
                    ? "bg-blue-900/30 border border-blue-700/50"
                    : "bg-blue-100"
                }`}
              >
                <Calendar
                  className={`w-6 h-6 ${
                    isDarkMode ? "text-blue-300" : "text-blue-600"
                  }`}
                />
              </div>
              <div className="ml-4">
                <div
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Total Bookings
                </div>
                <div
                  className={`text-2xl font-bold ${
                    isDarkMode ? "text-white" : "text-black"
                  }`}
                >
                  {loading ? "..." : stats.total}
                </div>
              </div>
            </div>
          </div>

          <div
            className={`rounded-2xl shadow-sm border p-6 transition-colors ${
              isDarkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="flex items-center">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isDarkMode
                    ? "bg-yellow-900/30 border border-yellow-700/50"
                    : "bg-yellow-100"
                }`}
              >
                <Clock
                  className={`w-6 h-6 ${
                    isDarkMode ? "text-yellow-300" : "text-yellow-600"
                  }`}
                />
              </div>
              <div className="ml-4">
                <div
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Pending
                </div>
                <div
                  className={`text-2xl font-bold ${
                    isDarkMode ? "text-yellow-300" : "text-yellow-600"
                  }`}
                >
                  {loading ? "..." : stats.pending}
                </div>
              </div>
            </div>
          </div>

          <div
            className={`rounded-2xl shadow-sm border p-6 transition-colors ${
              isDarkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="flex items-center">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isDarkMode
                    ? "bg-blue-900/30 border border-blue-700/50"
                    : "bg-blue-100"
                }`}
              >
                <MessageSquare
                  className={`w-6 h-6 ${
                    isDarkMode ? "text-blue-300" : "text-blue-600"
                  }`}
                />
              </div>
              <div className="ml-4">
                <div
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Contacted
                </div>
                <div
                  className={`text-2xl font-bold ${
                    isDarkMode ? "text-blue-300" : "text-blue-600"
                  }`}
                >
                  {loading ? "..." : stats.contacted}
                </div>
              </div>
            </div>
          </div>

          <div
            className={`rounded-2xl shadow-sm border p-6 transition-colors ${
              isDarkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="flex items-center">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isDarkMode
                    ? "bg-purple-900/30 border border-purple-700/50"
                    : "bg-purple-100"
                }`}
              >
                <Video
                  className={`w-6 h-6 ${
                    isDarkMode ? "text-purple-300" : "text-purple-600"
                  }`}
                />
              </div>
              <div className="ml-4">
                <div
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Scheduled
                </div>
                <div
                  className={`text-2xl font-bold ${
                    isDarkMode ? "text-purple-300" : "text-purple-600"
                  }`}
                >
                  {loading ? "..." : stats.scheduled}
                </div>
              </div>
            </div>
          </div>

          <div
            className={`rounded-2xl shadow-sm border p-6 transition-colors ${
              isDarkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="flex items-center">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isDarkMode
                    ? "bg-green-900/30 border border-green-700/50"
                    : "bg-green-100"
                }`}
              >
                <CheckCircle
                  className={`w-6 h-6 ${
                    isDarkMode ? "text-green-300" : "text-green-600"
                  }`}
                />
              </div>
              <div className="ml-4">
                <div
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Completed
                </div>
                <div
                  className={`text-2xl font-bold ${
                    isDarkMode ? "text-green-300" : "text-green-600"
                  }`}
                >
                  {loading ? "..." : stats.completed}
                </div>
              </div>
            </div>
          </div>

          <div
            className={`rounded-2xl shadow-sm border p-6 transition-colors ${
              isDarkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="flex items-center">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isDarkMode
                    ? "bg-red-900/30 border border-red-700/50"
                    : "bg-red-100"
                }`}
              >
                <XCircle
                  className={`w-6 h-6 ${
                    isDarkMode ? "text-red-300" : "text-red-600"
                  }`}
                />
              </div>
              <div className="ml-4">
                <div
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Cancelled
                </div>
                <div
                  className={`text-2xl font-bold ${
                    isDarkMode ? "text-red-300" : "text-red-600"
                  }`}
                >
                  {loading ? "..." : stats.cancelled}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div
            className={`rounded-2xl shadow-sm border p-6 transition-colors ${
              isDarkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Search Input */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Search
                </label>
                <div className="relative">
                  <Search
                    className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                      isDarkMode ? "text-gray-400" : "text-gray-400"
                    }`}
                  />
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
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 font-medium transition-colors ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                    }`}
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Status
                </label>
                <div className="relative">
                  <button
                    type="button"
                    className={`relative w-full border rounded-xl shadow-sm pl-3 pr-10 py-3 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                    onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  >
                    <span
                      className={`block truncate font-medium ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {filters.status
                        ? filters.status.charAt(0).toUpperCase() +
                          filters.status.slice(1)
                        : "All Status"}
                    </span>
                    <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <ChevronDown
                        className={`h-5 w-5 transition-transform duration-200 ${
                          showStatusDropdown ? "rotate-180" : ""
                        } ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                      />
                    </span>
                  </button>

                  {showStatusDropdown && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowStatusDropdown(false)}
                      />
                      <div
                        className={`absolute z-20 mt-1 w-full shadow-lg max-h-60 rounded-xl py-1 ring-1 ring-opacity-5 overflow-auto focus:outline-none transition-colors ${
                          isDarkMode
                            ? "bg-gray-800 ring-gray-600"
                            : "bg-white ring-black"
                        }`}
                      >
                        {[
                          { value: "", label: "All Status" },
                          { value: "pending", label: "Pending" },
                          { value: "contacted", label: "Contacted" },
                          { value: "scheduled", label: "Scheduled" },
                          { value: "completed", label: "Completed" },
                          { value: "cancelled", label: "Cancelled" },
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            className={`w-full text-left relative cursor-pointer select-none py-2 pl-3 pr-9 transition-colors ${
                              filters.status === option.value
                                ? isDarkMode
                                  ? "bg-red-900/50 text-red-300 font-semibold"
                                  : "bg-red-50 text-red-900 font-semibold"
                                : isDarkMode
                                  ? "text-gray-300 font-medium hover:bg-gray-700 hover:text-white"
                                  : "text-gray-900 font-medium hover:bg-red-50 hover:text-red-900"
                            }`}
                            onClick={() => {
                              setFilters((prev) => ({
                                ...prev,
                                status: option.value,
                                page: 1,
                              }));
                              setShowStatusDropdown(false);
                            }}
                          >
                            <span className="block truncate">
                              {option.label}
                            </span>
                            {filters.status === option.value && (
                              <span
                                className={`absolute inset-y-0 right-0 flex items-center pr-3 ${
                                  isDarkMode ? "text-red-400" : "text-red-600"
                                }`}
                              >
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
            </div>
          </div>
        )}

        {/* Bookings Table */}
        <div
          className={`rounded-2xl shadow-sm border overflow-hidden transition-colors ${
            isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="overflow-x-auto">
            <table
              className={`min-w-full divide-y ${
                isDarkMode ? "divide-gray-700" : "divide-gray-200"
              }`}
            >
              <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}>
                <tr>
                  <th
                    className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? "text-gray-300" : "text-gray-500"
                    }`}
                  >
                    Customer
                  </th>
                  <th
                    className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? "text-gray-300" : "text-gray-500"
                    }`}
                  >
                    Contact
                  </th>
                  {/* <th
                    className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? "text-gray-300" : "text-gray-500"
                    }`}
                  >
                    Status
                  </th>
                  <th
                    className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? "text-gray-300" : "text-gray-500"
                    }`}
                  >
                    Scheduled Date
                  </th> */}
                  <th
                    className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? "text-gray-300" : "text-gray-500"
                    }`}
                  >
                    Payment
                  </th>
                  <th
                    className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? "text-gray-300" : "text-gray-500"
                    }`}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody
                className={`divide-y transition-colors ${
                  isDarkMode
                    ? "bg-gray-800 divide-gray-700"
                    : "bg-white divide-gray-200"
                }`}
              >
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : bookings.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center">
                      <div
                        className={
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }
                      >
                        <Calendar
                          className={`w-12 h-12 mx-auto mb-4 ${
                            isDarkMode ? "text-gray-500" : "text-gray-300"
                          }`}
                        />
                        <p className="text-lg font-medium">
                          No mentorship bookings found
                        </p>
                        <p className="text-sm">
                          Try adjusting your filters or check back later.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  bookings.map((booking) => (
                    <tr
                      key={booking._id}
                      className={`transition-colors ${
                        isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center">
                            <User className="w-6 h-6 text-white" />
                          </div>
                          <div className="ml-4">
                            <div
                              className={`text-sm font-medium ${
                                isDarkMode ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {booking.firstName} {booking.lastName}
                            </div>
                            <div
                              className={`text-sm ${
                                isDarkMode ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              {booking.bookingReference}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div
                            className={`flex items-center space-x-1 text-sm ${
                              isDarkMode ? "text-gray-300" : "text-gray-600"
                            }`}
                          >
                            <Mail className="w-4 h-4" />
                            <span>{booking.email}</span>
                          </div>
                          <div
                            className={`flex items-center space-x-1 text-sm ${
                              isDarkMode ? "text-gray-300" : "text-gray-600"
                            }`}
                          >
                            <Phone className="w-4 h-4" />
                            <span>{booking.phone}</span>
                          </div>
                        </div>
                      </td>
                      {/* <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(booking.status)}`}
                        >
                          {getStatusIcon(booking.status)}
                          <span className="ml-1">
                            {booking.status.charAt(0).toUpperCase() +
                              booking.status.slice(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`text-sm ${
                            isDarkMode ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {formatDate(booking.scheduledDate)}
                        </div>
                        {booking.contactedAt && (
                          <div
                            className={`text-xs ${
                              isDarkMode ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            Contacted: {formatDate(booking.contactedAt)}
                          </div>
                        )}
                      </td> */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`text-xs px-2 py-1 rounded-full inline-block ${getPaymentStatusColor(booking.paymentStatus)}`}
                        >
                          {booking.paymentStatus.charAt(0).toUpperCase() +
                            booking.paymentStatus.slice(1)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewBooking(booking)}
                            className={`flex items-center px-3 py-1 rounded-lg transition-colors ${
                              isDarkMode
                                ? "bg-blue-900/50 text-blue-300 hover:bg-blue-900/70"
                                : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                            }`}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </button>
                          <button
                            onClick={() => handleEditBooking(booking)}
                            className={`flex items-center px-3 py-1 rounded-lg transition-colors ${
                              isDarkMode
                                ? "bg-green-900/50 text-green-300 hover:bg-green-900/70"
                                : "bg-green-100 text-green-700 hover:bg-green-200"
                            }`}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </button>
                          {/* {booking.status === 'pending' && (
                            <button
                              onClick={() => handleQuickStatusUpdate(booking._id, 'contacted')}
                              className={`flex items-center px-3 py-1 rounded-lg transition-colors ${
                                isDarkMode 
                                  ? 'bg-purple-900/50 text-purple-300 hover:bg-purple-900/70' 
                                  : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                              }`}
                            >
                              <MessageSquare className="w-4 h-4 mr-1" />
                              Contact
                            </button>
                          )} */}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Enhanced Pagination with Page Numbers */}
          {pagination.totalPages > 1 && (
            <div
              className={`px-4 py-3 border-t sm:px-6 transition-colors ${
                isDarkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`text-sm ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Showing page {pagination.currentPage} of{" "}
                  {pagination.totalPages} ({pagination.totalCount} total
                  bookings)
                </div>

                {/* Page Numbers Navigation */}
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
                              ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                              : "border-gray-300 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          1
                        </button>
                        {pagination.currentPage > 4 && (
                          <span
                            className={`px-2 py-1 text-sm ${
                              isDarkMode ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
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
                                ? "border-gray-600 text-gray-300 hover:bg-gray-700"
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
                          <span
                            className={`px-2 py-1 text-sm ${
                              isDarkMode ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
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
                              ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                              : "border-gray-300 text-gray-700 hover:bg-gray-50"
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
        {showDetailModal && selectedBooking && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div
              className={`rounded-2xl shadow-2xl border max-w-4xl w-full max-h-[90vh] overflow-y-auto transition-colors ${
                isDarkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <h3
                    className={`text-xl font-semibold ${
                      isDarkMode ? "text-white" : "text-black"
                    }`}
                  >
                    Mentorship Booking Details
                  </h3>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className={`transition-colors ${
                      isDarkMode
                        ? "text-gray-400 hover:text-gray-200"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Customer Information */}
                  <div className="space-y-6">
                    <div
                      className={`rounded-lg p-5 transition-colors ${
                        isDarkMode ? "bg-gray-700" : "bg-gray-50"
                      }`}
                    >
                      <h4
                        className={`text-lg font-medium mb-4 ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        Customer Information
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label
                            className={`text-sm font-medium ${
                              isDarkMode ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            Name
                          </label>
                          <p
                            className={`font-medium ${
                              isDarkMode ? "text-white" : "text-gray-900"
                            }`}
                          >
                            {selectedBooking.firstName}{" "}
                            {selectedBooking.lastName}
                          </p>
                        </div>
                        <div>
                          <label
                            className={`text-sm font-medium ${
                              isDarkMode ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            Email
                          </label>
                          <p
                            className={
                              isDarkMode ? "text-white" : "text-gray-900"
                            }
                          >
                            {selectedBooking.email}
                          </p>
                        </div>
                        <div>
                          <label
                            className={`text-sm font-medium  ${
                              isDarkMode ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            WhatsApp:
                          </label>
                          <a
                            href={`https://wa.me/${selectedBooking.phone.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`font-medium underline ml-4 ${
                              isDarkMode
                                ? "text-green-400 hover:text-green-300"
                                : "text-green-600 hover:text-green-800"
                            }`}
                          >
                            {selectedBooking.phone}
                          </a>
                        </div>
                        <div>
                          <label
                            className={`text-sm font-medium ${
                              isDarkMode ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            Booking Reference
                          </label>
                          <p
                            className={`font-mono text-sm ${
                              isDarkMode ? "text-white" : "text-gray-900"
                            }`}
                          >
                            {selectedBooking.bookingReference}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`rounded-lg p-5 transition-colors ${
                        isDarkMode ? "bg-gray-700" : "bg-gray-50"
                      }`}
                    >
                      <h4
                        className={`text-lg font-medium mb-4 ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        Message
                      </h4>
                      <p
                        className={`leading-relaxed whitespace-pre-wrap ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {selectedBooking.message}
                      </p>
                    </div>
                  </div>

                  {/* Booking Status and Details */}
                  <div className="space-y-6">
                    <div
                      className={`rounded-lg p-5 transition-colors ${
                        isDarkMode ? "bg-gray-700" : "bg-gray-50"
                      }`}
                    >
                      <h4
                        className={`text-lg font-medium mb-4 ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        Booking Status
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label
                            className={`text-sm font-medium ${
                              isDarkMode ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            Current Status
                          </label>
                          <div
                            className={`inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full border mt-1 ${getStatusColor(selectedBooking.status)}`}
                          >
                            {getStatusIcon(selectedBooking.status)}
                            <span className="ml-1">
                              {selectedBooking.status.charAt(0).toUpperCase() +
                                selectedBooking.status.slice(1)}
                            </span>
                          </div>
                        </div>

                        <div>
                          <label
                            className={`text-sm font-medium ${
                              isDarkMode ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            Created
                          </label>
                          <p
                            className={
                              isDarkMode ? "text-white" : "text-gray-900"
                            }
                          >
                            {formatDate(selectedBooking.createdAt)}
                          </p>
                        </div>

                        {selectedBooking.contactedAt && (
                          <div>
                            <label
                              className={`text-sm font-medium ${
                                isDarkMode ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              Contacted
                            </label>
                            <p
                              className={
                                isDarkMode ? "text-white" : "text-gray-900"
                              }
                            >
                              {formatDate(selectedBooking.contactedAt)}
                            </p>
                          </div>
                        )}

                        {selectedBooking.scheduledDate && (
                          <div>
                            <label
                              className={`text-sm font-medium ${
                                isDarkMode ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              Scheduled Date
                            </label>
                            <p
                              className={
                                isDarkMode ? "text-white" : "text-gray-900"
                              }
                            >
                              {formatDate(selectedBooking.scheduledDate)}
                            </p>
                          </div>
                        )}

                        {selectedBooking.meetingLink && (
                          <div>
                            <label
                              className={`text-sm font-medium ${
                                isDarkMode ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              Meeting Link
                            </label>
                            <a
                              href={selectedBooking.meetingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline break-all"
                            >
                              {selectedBooking.meetingLink}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    <div
                      className={`rounded-lg p-5 transition-colors ${
                        isDarkMode ? "bg-gray-700" : "bg-gray-50"
                      }`}
                    >
                      <h4
                        className={`text-lg font-medium mb-4 ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        Payment Information
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label
                            className={`text-sm font-medium ${
                              isDarkMode ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            Payment Status
                          </label>
                          <div
                            className={`inline-block px-3 py-1 text-sm rounded-full mt-1 ${getPaymentStatusColor(selectedBooking.paymentStatus)}`}
                          >
                            {selectedBooking.paymentStatus
                              .charAt(0)
                              .toUpperCase() +
                              selectedBooking.paymentStatus.slice(1)}
                          </div>
                        </div>
                        {selectedBooking.paymentReference && (
                          <div>
                            <label
                              className={`text-sm font-medium ${
                                isDarkMode ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              Payment Reference
                            </label>
                            <p
                              className={`font-mono text-sm ${
                                isDarkMode ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {selectedBooking.paymentReference}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {(selectedBooking.notes || selectedBooking.adminNotes) && (
                      <div
                        className={`rounded-lg p-5 transition-colors ${
                          isDarkMode ? "bg-gray-700" : "bg-gray-50"
                        }`}
                      >
                        <h4
                          className={`text-lg font-medium mb-4 ${
                            isDarkMode ? "text-white" : "text-gray-900"
                          }`}
                        >
                          Notes
                        </h4>
                        {selectedBooking.notes && (
                          <div className="mb-3">
                            <label
                              className={`text-sm font-medium ${
                                isDarkMode ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              Customer Notes
                            </label>
                            <p
                              className={`whitespace-pre-wrap ${
                                isDarkMode ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {selectedBooking.notes}
                            </p>
                          </div>
                        )}
                        {selectedBooking.adminNotes && (
                          <div>
                            <label
                              className={`text-sm font-medium ${
                                isDarkMode ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              Admin Notes
                            </label>
                            <p
                              className={`whitespace-pre-wrap ${
                                isDarkMode ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {selectedBooking.adminNotes}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div
                  className={`flex space-x-3 mt-6 pt-6 border-t transition-colors ${
                    isDarkMode ? "border-gray-700" : "border-gray-200"
                  }`}
                >
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className={`flex-1 px-4 py-2 border rounded-xl transition-colors ${
                      isDarkMode
                        ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      handleEditBooking(selectedBooking);
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    Edit Booking
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Update Modal */}
        {showUpdateModal && selectedBooking && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div
              className={`rounded-2xl shadow-2xl border max-w-2xl w-full transition-colors ${
                isDarkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <h3
                    className={`text-xl font-semibold ${
                      isDarkMode ? "text-white" : "text-black"
                    }`}
                  >
                    Update Booking
                  </h3>
                  <button
                    onClick={() => setShowUpdateModal(false)}
                    className={`transition-colors ${
                      isDarkMode
                        ? "text-gray-400 hover:text-gray-200"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Status */}
                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Status
                    </label>
                    <select
                      value={updateForm.status}
                      onChange={(e) =>
                        setUpdateForm((prev) => ({
                          ...prev,
                          status: e.target.value,
                        }))
                      }
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-white"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="contacted">Contacted</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  {/* Scheduled Date */}
                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Scheduled Date
                    </label>
                    <input
                      type="datetime-local"
                      value={updateForm.scheduledDate}
                      onChange={(e) =>
                        setUpdateForm((prev) => ({
                          ...prev,
                          scheduledDate: e.target.value,
                        }))
                      }
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-white"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                    />
                  </div>

                  {/* Meeting Link */}
                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Meeting Link
                    </label>
                    <input
                      type="url"
                      value={updateForm.meetingLink}
                      onChange={(e) =>
                        setUpdateForm((prev) => ({
                          ...prev,
                          meetingLink: e.target.value,
                        }))
                      }
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                      }`}
                      placeholder="https://zoom.us/j/..."
                    />
                  </div>

                  {/* Admin Notes */}
                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Admin Notes
                    </label>
                    <textarea
                      value={updateForm.adminNotes}
                      onChange={(e) =>
                        setUpdateForm((prev) => ({
                          ...prev,
                          adminNotes: e.target.value,
                        }))
                      }
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                      }`}
                      rows="4"
                      placeholder="Add any internal notes about this booking..."
                      maxLength={1000}
                    />
                    <div
                      className={`text-xs mt-1 ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {updateForm.adminNotes.length}/1000 characters
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => setShowUpdateModal(false)}
                    className={`flex-1 px-4 py-2 border rounded-xl transition-colors ${
                      isDarkMode
                        ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
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
                      <span>Update Booking</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
