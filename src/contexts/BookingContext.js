'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const BookingContext = createContext();

export function BookingProvider({ children }) {
  const [bookingSlots, setBookingSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { secureApiCall } = useAuth();
  const [currentMonth, setCurrentMonth] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() });

  // Fetch slots for a specific month
  const fetchSlots = useCallback(async (year, month) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('authToken');
      const startDate = new Date(year, month, 1).toISOString();
      const endDate = new Date(year, month + 1, 0).toISOString();
      
      const response = await fetch(`/api/admin/booking-slots?startDate=${startDate}&endDate=${endDate}`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBookingSlots(data.slots.map(slot => ({
          ...slot,
          date: new Date(slot.date)
        })));
        setCurrentMonth({ year, month });
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch slots');
      }
    } catch (err) {
      setError('Failed to fetch slots');
      console.error('Error fetching slots:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refetch current month data
  const refetchCurrentMonth = useCallback(() => {
    fetchSlots(currentMonth.year, currentMonth.month);
  }, [fetchSlots, currentMonth.year, currentMonth.month]);

  // Set up interval for auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentMonth.year && currentMonth.month !== undefined) {
        refetchCurrentMonth();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [refetchCurrentMonth]);

  // Create a new booking slot
  const createSlot = async (slotData) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 BookingContext: Creating new slot with data:', slotData);
      
      const token = localStorage.getItem('authToken');
      const response = await secureApiCall('/api/admin/booking-slots', {
        method: 'POST',
        body: JSON.stringify(slotData)
      });

      if (response.ok) {
        const data = await response.json();
        const newSlot = {
          ...data.slot,
          date: new Date(data.slot.date)
        };
        setBookingSlots(prev => [...prev, newSlot]);
        
        // Refetch to ensure data consistency
        setTimeout(() => refetchCurrentMonth(), 1000);
        
        return { success: true, slot: newSlot };
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create slot');
        return { success: false, error: errorData.message };
      }
    } catch (err) {
      const errorMessage = 'Failed to create slot';
      setError(errorMessage);
      console.error('Error creating slot:', err);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Update a booking slot
  const updateSlot = async (slotId, updates) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/admin/booking-slots/${slotId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const data = await response.json();
        const updatedSlot = {
          ...data.slot,
          date: new Date(data.slot.date)
        };
        setBookingSlots(prev => 
          prev.map(slot => 
            slot._id === slotId ? updatedSlot : slot
          )
        );
        
        // Refetch to ensure data consistency
        setTimeout(() => refetchCurrentMonth(), 1000);
        
        return { success: true, slot: updatedSlot };
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update slot');
        return { success: false, error: errorData.message };
      }
    } catch (err) {
      const errorMessage = 'Failed to update slot';
      setError(errorMessage);
      console.error('Error updating slot:', err);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Toggle slot lock status
  const toggleSlotLock = async (slotId) => {
    const slot = bookingSlots.find(s => s._id === slotId);
    if (!slot) return { success: false, error: 'Slot not found' };
    
    return await updateSlot(slotId, { isLocked: !slot.isLocked });
  };

  // Delete a booking slot
  const deleteSlot = async (slotId) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/slots/${slotId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        // Remove slot from local state
        setBookingSlots(prev => prev.filter(slot => slot._id !== slotId));
        return { success: true };
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete slot');
        return { success: false, error: errorData.error };
      }
    } catch (error) {
      console.error('Error deleting slot:', error);
      setError('Failed to delete slot');
      return { success: false, error: 'Failed to delete slot' };
    } finally {
      setLoading(false);
    }
  };

  // Add new time slot
  const addTimeSlot = async (slotId, timeSlotData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/slots/${slotId}/timeslots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(timeSlotData),
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        // Update slot in local state with proper date conversion
        const updatedSlot = {
          ...data.slot,
          date: new Date(data.slot.date)
        };
        setBookingSlots(prev => 
          prev.map(slot => 
            slot._id === slotId ? updatedSlot : slot
          )
        );
        return { success: true, slot: updatedSlot };
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to add time slot');
        return { success: false, error: errorData.error };
      }
    } catch (error) {
      console.error('Error adding time slot:', error);
      setError('Failed to add time slot');
      return { success: false, error: 'Failed to add time slot' };
    } finally {
      setLoading(false);
    }
  };

  // Delete specific time slot
  const deleteTimeSlot = async (slotId, timeSlotIndex) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/slots/${slotId}/timeslots/${timeSlotIndex}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Update slot in local state with proper date conversion
        const updatedSlot = {
          ...data.slot,
          date: new Date(data.slot.date)
        };
        setBookingSlots(prev => 
          prev.map(slot => 
            slot._id === slotId ? updatedSlot : slot
          )
        );
        return { success: true, slot: updatedSlot };
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete time slot');
        return { success: false, error: errorData.error };
      }
    } catch (error) {
      console.error('Error deleting time slot:', error);
      setError('Failed to delete time slot');
      return { success: false, error: 'Failed to delete time slot' };
    } finally {
      setLoading(false);
    }
  };

  // Get slots for a specific date
  const getSlotsForDate = (date) => {
    return bookingSlots.filter(slot => {
      // Ensure slot.date is a proper Date object
      const slotDate = slot.date instanceof Date ? slot.date : new Date(slot.date);
      const compareDate = date instanceof Date ? date : new Date(date);
      
      return slotDate.toDateString() === compareDate.toDateString();
    });
  };

  // Get date status (locked/unlocked) - updated for new structure
  const getDateStatus = (date) => {
    const slots = getSlotsForDate(date);
    if (slots.length === 0) return 'locked';
    
    const hasUnlockedSlots = slots.some(slot => {
      if (!slot.isLocked) {
        // Check if slot has available time slots
        if (slot.timeSlots && slot.timeSlots.length > 0) {
          return slot.timeSlots.some(timeSlot => !timeSlot.isBooked);
        }
        // Backward compatibility for old structure
        return true;
      }
      return false;
    });
    return hasUnlockedSlots ? 'unlocked' : 'locked';
  };

  // Fetch bookings
  const fetchBookings = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('authToken');
      const params = new URLSearchParams(filters);
      
      const response = await fetch(`/api/admin/bookings?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings.map(booking => ({
          ...booking,
          bookingDate: new Date(booking.bookingDate),
          createdAt: new Date(booking.createdAt)
        })));
        return { success: true, data };
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch bookings');
        return { success: false, error: errorData.message };
      }
    } catch (err) {
      const errorMessage = 'Failed to fetch bookings';
      setError(errorMessage);
      console.error('Error fetching bookings:', err);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Update booking status
  const updateBookingStatus = async (bookingId, status) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        const data = await response.json();
        const updatedBooking = {
          ...data.booking,
          bookingDate: new Date(data.booking.bookingDate),
          createdAt: new Date(data.booking.createdAt)
        };
        
        setBookings(prev => 
          prev.map(booking => 
            booking._id === bookingId ? updatedBooking : booking
          )
        );
        
        return { success: true, booking: updatedBooking };
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update booking');
        return { success: false, error: errorData.message };
      }
    } catch (err) {
      const errorMessage = 'Failed to update booking';
      setError(errorMessage);
      console.error('Error updating booking:', err);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Get booking statistics
  const getBookingStats = () => {
    const stats = {
      total: bookings.length,
      pending: bookings.filter(b => b.status === 'pending').length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length,
      completed: bookings.filter(b => b.status === 'completed').length,
      revenue: bookings
        .filter(b => b.paymentStatus === 'paid')
        .reduce((sum, b) => sum + (b.paymentAmount || 0), 0)
    };
    return stats;
  };

  const value = {
    bookingSlots,
    bookings,
    loading,
    error,
    fetchSlots,
    createSlot,
    updateSlot,
    toggleSlotLock,
    deleteSlot,
    deleteTimeSlot,
    addTimeSlot,
    getSlotsForDate,
    getDateStatus,
    refetchCurrentMonth,
    fetchBookings,
    updateBookingStatus,
    getBookingStats,
    clearError: () => setError(null)
  };

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
}
