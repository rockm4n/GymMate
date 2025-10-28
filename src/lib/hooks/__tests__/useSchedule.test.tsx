// Mock the toast module at the top level (hoisted)
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useSchedule } from '../useSchedule';
import type { ScheduledClassDto, BookingDto } from '@/types';
import { toast } from 'sonner';

// Mock fetch globally
const fetchMock = vi.fn();
global.fetch = fetchMock;

// Get the mocked toast functions
const toastSuccessMock = toast.success as any;
const toastErrorMock = toast.error as any;

describe('useSchedule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z')); // Monday, Jan 15, 2024, 12:00 UTC
    
    // Mock default fetch responses for all tests
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('should initialize with current week start and empty data', () => {
      const { result } = renderHook(() => useSchedule());

      // Should start with Monday of current week
      const expectedWeekStart = new Date('2024-01-14T23:00:00Z'); // Monday, Jan 15, 2024 adjusted for timezone
      expect(result.current.currentWeekStartDate).toEqual(expectedWeekStart);

      expect(result.current.scheduledClasses).toEqual([]);
      expect(result.current.isLoading).toBe(true); // Initial load
      expect(result.current.error).toBe(null);
      expect(result.current.selectedClass).toBe(null);
    });
  });

  describe('initial data fetch', () => {
    it('should fetch data on mount', async () => {
      vi.useRealTimers(); // Use real timers for async operations
      const mockClasses: ScheduledClassDto[] = [
        {
          id: 'class-1',
          start_time: '2024-01-20T14:00:00Z',
          end_time: '2024-01-20T15:00:00Z',
          class: { id: 'yoga', name: 'Joga', color: '#10B981', duration_minutes: 60 },
          instructor: { id: 'inst-1', full_name: 'Anna Kowalska', email: 'anna@example.com' },
          bookings_count: 5,
          capacity: 10,
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockClasses),
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]), // No bookings
      });

      const { result } = renderHook(() => useSchedule());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(result.current.scheduledClasses).toHaveLength(1);
      expect(result.current.scheduledClasses[0].class.name).toBe('Joga');
    });

    it('should handle initial fetch error', async () => {
      vi.useRealTimers(); // Use real timers for async operations
      fetchMock.mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      });

      const { result } = renderHook(() => useSchedule());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Failed to fetch scheduled classes');
      expect(result.current.scheduledClasses).toEqual([]);
    });
  });

  describe('week navigation', () => {
    it('should navigate to next week', () => {
      const { result } = renderHook(() => useSchedule());

      const initialWeek = result.current.currentWeekStartDate;

      act(() => {
        result.current.goToNextWeek();
      });

      const nextWeek = new Date(initialWeek);
      nextWeek.setDate(nextWeek.getDate() + 7);

      expect(result.current.currentWeekStartDate).toEqual(nextWeek);
    });

    it('should navigate to previous week', () => {
      const { result } = renderHook(() => useSchedule());

      const initialWeek = result.current.currentWeekStartDate;

      act(() => {
        result.current.goToPreviousWeek();
      });

      const previousWeek = new Date(initialWeek);
      previousWeek.setDate(previousWeek.getDate() - 7);

      expect(result.current.currentWeekStartDate).toEqual(previousWeek);
    });
  });

  describe('class selection', () => {
    it('should select a class', () => {
      const { result } = renderHook(() => useSchedule());

      const mockClass = {
        id: 'class-1',
        userStatus: 'AVAILABLE' as const,
        bookingId: null,
        waitingListEntryId: null,
        isFull: false,
        hasStarted: false,
        isBookable: true,
        isCancellable: false,
        isWaitlistable: false,
        start_time: '2024-01-20T14:00:00Z',
        end_time: '2024-01-20T15:00:00Z',
        class: { id: 'yoga', name: 'Joga', color: '#10B981', duration_minutes: 60 },
        instructor: { id: 'inst-1', full_name: 'Anna Kowalska', email: 'anna@example.com' },
        bookings_count: 5,
        capacity: 10,
        created_at: '2024-01-01T00:00:00Z',
      };

      act(() => {
        result.current.selectClass(mockClass);
      });

      expect(result.current.selectedClass).toEqual(mockClass);
    });

    it('should clear class selection', () => {
      const { result } = renderHook(() => useSchedule());

      act(() => {
        result.current.selectClass(null);
      });

      expect(result.current.selectedClass).toBe(null);
    });
  });

  describe('bookClass - BUSINESS RULES', () => {
    it('should book a class successfully', async () => {
      vi.useRealTimers(); // Use real timers for async operations
      // Mock initial data fetch
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });
      
      // Mock booking call
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'booking-123' }),
      });
      
      // Mock refetch after booking
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      const { result } = renderHook(() => useSchedule());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.bookClass('class-123');
      });

      expect(fetchMock).toHaveBeenCalledWith('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scheduled_class_id: 'class-123' }),
      });

      expect(toastSuccessMock).toHaveBeenCalledWith(
        'Rezerwacja zakończona sukcesem!',
        { description: 'Zostałeś zapisany na zajęcia.' }
      );
    });

    it('should handle booking error', async () => {
      vi.useRealTimers(); // Use real timers for async operations
      // Mock initial data fetch
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });
      
      // Mock booking error
      fetchMock.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: 'Class is full' }),
      });

      const { result } = renderHook(() => useSchedule());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(result.current.bookClass('class-123')).rejects.toThrow();

      expect(toastErrorMock).toHaveBeenCalledWith(
        'Nie udało się zarezerwować zajęć',
        { description: 'Class is full' }
      );
    });

    it('should refetch data after successful booking', async () => {
      vi.useRealTimers(); // Use real timers for async operations
      // Initial fetch
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      // Booking call
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'booking-123' }),
      });

      // Refetch after booking
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      const { result } = renderHook(() => useSchedule());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.bookClass('class-123');
      });

      expect(fetchMock).toHaveBeenCalledTimes(5); // 2 initial + 1 booking + 2 refetch
    });
  });

  describe('cancelBooking - BUSINESS RULES', () => {
    it('should cancel booking successfully', async () => {
      vi.useRealTimers(); // Use real timers for async operations
      // Mock initial data fetch
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });
      
      // Mock cancel call
      fetchMock.mockResolvedValueOnce({
        ok: true,
      });
      
      // Mock refetch after cancel
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      const { result } = renderHook(() => useSchedule());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.cancelBooking('booking-123');
      });

      expect(fetchMock).toHaveBeenCalledWith('/api/bookings/booking-123', {
        method: 'DELETE',
      });

      expect(toastSuccessMock).toHaveBeenCalledWith(
        'Rezerwacja anulowana',
        { description: 'Twoja rezerwacja została pomyślnie anulowana.' }
      );
    });

    it('should handle cancellation error', async () => {
      vi.useRealTimers(); // Use real timers for async operations
      // Mock initial data fetch
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });
      
      // Mock cancel error
      fetchMock.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: 'Too late to cancel' }),
      });

      const { result } = renderHook(() => useSchedule());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(result.current.cancelBooking('booking-123')).rejects.toThrow();

      expect(toastErrorMock).toHaveBeenCalledWith(
        'Nie udało się anulować rezerwacji',
        { description: 'Too late to cancel' }
      );
    });
  });

  describe('joinWaitingList - BUSINESS RULES', () => {
    it('should join waiting list successfully', async () => {
      vi.useRealTimers(); // Use real timers for async operations
      // Mock initial data fetch
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });
      
      // Mock waiting list call
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'waiting-123' }),
      });
      
      // Mock refetch after joining
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      const { result } = renderHook(() => useSchedule());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.joinWaitingList('class-123');
      });

      expect(fetchMock).toHaveBeenCalledWith('/api/waiting-list-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scheduled_class_id: 'class-123' }),
      });

      expect(toastSuccessMock).toHaveBeenCalledWith(
        'Dołączono do listy oczekujących',
        { description: 'Powiadomimy Cię, gdy zwolni się miejsce.' }
      );
    });

    it('should handle waiting list error', async () => {
      vi.useRealTimers(); // Use real timers for async operations
      // Mock initial data fetch
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });
      
      // Mock waiting list error
      fetchMock.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: 'Already on waiting list' }),
      });

      const { result } = renderHook(() => useSchedule());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(result.current.joinWaitingList('class-123')).rejects.toThrow();

      expect(toastErrorMock).toHaveBeenCalledWith(
        'Nie udało się dołączyć do listy oczekujących',
        { description: 'Already on waiting list' }
      );
    });
  });

  describe('refetch functionality', () => {
    it('should manually refetch data', async () => {
      vi.useRealTimers(); // Use real timers for async operations
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });

      const { result } = renderHook(() => useSchedule());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      fetchMock.mockClear();

      await act(async () => {
        await result.current.refetch();
      });

      expect(fetchMock).toHaveBeenCalledTimes(2); // Classes and bookings
    });
  });

  describe('BUSINESS RULES - data transformation', () => {
    it('should correctly transform classes with user bookings', async () => {
      vi.useRealTimers(); // Use real timers for async operations
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z')); // Set fixed time for consistent tests
      const mockClasses: ScheduledClassDto[] = [
        {
          id: 'class-1',
          start_time: '2024-01-20T14:00:00Z',
          end_time: '2024-01-20T15:00:00Z',
          class: { id: 'yoga', name: 'Joga', color: '#10B981', duration_minutes: 60 },
          instructor: { id: 'inst-1', full_name: 'Anna Kowalska', email: 'anna@example.com' },
          bookings_count: 5,
          capacity: 10,
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      const mockBookings: BookingDto[] = [
        {
          id: 'booking-1',
          created_at: '2024-01-15T10:00:00Z',
          user_id: 'user-123',
          scheduled_class: mockClasses[0],
        },
      ];

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockClasses),
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBookings),
      });

      const { result } = renderHook(() => useSchedule());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const transformedClass = result.current.scheduledClasses[0];
      expect(transformedClass.userStatus).toBe('BOOKED');
      expect(transformedClass.bookingId).toBe('booking-1');
      expect(transformedClass.isBookable).toBe(false); // Already booked
      expect(transformedClass.isCancellable).toBe(true); // More than 8 hours away
    });

    it('should mark full classes correctly', async () => {
      vi.useRealTimers(); // Use real timers for async operations
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z')); // Set fixed time for consistent tests
      const mockClasses: ScheduledClassDto[] = [
        {
          id: 'class-1',
          start_time: '2024-01-20T14:00:00Z',
          end_time: '2024-01-20T15:00:00Z',
          class: { id: 'yoga', name: 'Joga', color: '#10B981', duration_minutes: 60 },
          instructor: { id: 'inst-1', full_name: 'Anna Kowalska', email: 'anna@example.com' },
          bookings_count: 10, // At capacity
          capacity: 10,
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockClasses),
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]), // No user bookings
      });

      const { result } = renderHook(() => useSchedule());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const transformedClass = result.current.scheduledClasses[0];
      expect(transformedClass.isFull).toBe(true);
      expect(transformedClass.isBookable).toBe(false); // Full
      expect(transformedClass.isWaitlistable).toBe(true); // Can join waiting list
    });

    it('should mark started classes as not bookable', async () => {
      vi.useRealTimers(); // Use real timers for async operations
      const mockClasses: ScheduledClassDto[] = [
        {
          id: 'class-1',
          start_time: '2024-01-10T14:00:00Z', // Past date
          end_time: '2024-01-10T15:00:00Z',
          class: { id: 'yoga', name: 'Joga', color: '#10B981', duration_minutes: 60 },
          instructor: { id: 'inst-1', full_name: 'Anna Kowalska', email: 'anna@example.com' },
          bookings_count: 5,
          capacity: 10,
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockClasses),
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]), // No bookings
      });

      const { result } = renderHook(() => useSchedule());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const transformedClass = result.current.scheduledClasses[0];
      expect(transformedClass.hasStarted).toBe(true);
      expect(transformedClass.isBookable).toBe(false);
      expect(transformedClass.isWaitlistable).toBe(false);
    });
  });

  describe('ERROR HANDLING', () => {
    it('should handle network errors gracefully', async () => {
      vi.useRealTimers(); // Use real timers for async operations
      fetchMock.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useSchedule());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeInstanceOf(Error);
    });

    it('should handle 401 responses for bookings (user not authenticated)', async () => {
      vi.useRealTimers(); // Use real timers for async operations
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401, // Not authenticated
      });

      const { result } = renderHook(() => useSchedule());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should not set error for 401 on bookings endpoint
      expect(result.current.error).toBe(null);
      expect(result.current.scheduledClasses).toEqual([]);
    });
  });
});
