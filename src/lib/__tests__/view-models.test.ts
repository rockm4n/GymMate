import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { transformBookingToViewModel } from '../view-models';
import type { BookingDto } from '@/types';

// Mock Date to control time-based logic
const mockNow = new Date('2024-01-15T12:00:00Z'); // Monday, Jan 15, 2024, 12:00 UTC

describe('view-models', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(mockNow);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('transformBookingToViewModel', () => {
    const mockBooking: BookingDto = {
      id: 'booking-123',
      created_at: '2024-01-10T10:00:00Z',
      user_id: 'user-123',
      scheduled_class: {
        id: 'class-456',
        start_time: '2024-01-20T14:00:00Z', // Saturday, Jan 20, 2024, 14:00 UTC
        end_time: '2024-01-20T15:00:00Z',   // Saturday, Jan 20, 2024, 15:00 UTC
        class: {
          id: 'yoga-class',
          name: 'Joga dla początkujących',
          color: '#10B981',
          duration_minutes: 60,
        },
        instructor: {
          id: 'instructor-789',
          full_name: 'Anna Kowalska',
          email: 'anna@example.com',
        },
        bookings_count: 5,
        capacity: 10,
        created_at: '2024-01-01T00:00:00Z',
      },
    };

    it('should transform booking DTO to view model with correct properties', () => {
      const result = transformBookingToViewModel(mockBooking);

      expect(result).toEqual({
        id: 'booking-123',
        className: 'Joga dla początkujących',
        instructorName: 'Anna Kowalska',
        startTime: new Date('2024-01-20T14:00:00Z'),
        endTime: new Date('2024-01-20T15:00:00Z'),
        formattedDate: '20 stycznia 2024',
        formattedTime: '15:00 - 16:00',
        isCancellable: true,
        isHistorical: false,
      });
    });

    it('should handle booking without instructor correctly', () => {
      const bookingWithoutInstructor: BookingDto = {
        ...mockBooking,
        scheduled_class: {
          ...mockBooking.scheduled_class,
          instructor: null,
        },
      };

      const result = transformBookingToViewModel(bookingWithoutInstructor);

      expect(result.instructorName).toBeNull();
    });

    describe('CANCELLATION BUSINESS RULES - 8 hour rule', () => {
      it('should mark booking as cancellable when more than 8 hours before start', () => {
        // Class starts at 14:00, current time is 12:00 (mockNow)
        // Difference: 2 hours, so should be cancellable
        const result = transformBookingToViewModel(mockBooking);
        expect(result.isCancellable).toBe(true);
      });

      it('should mark booking as NOT cancellable when less than 8 hours before start', () => {
        // Set time to 13:30 (6 hours before class start at 14:00)
        vi.setSystemTime(new Date('2024-01-20T13:30:00Z'));

        const result = transformBookingToViewModel(mockBooking);
        expect(result.isCancellable).toBe(false);
      });

      it('should mark booking as NOT cancellable when exactly 8 hours before start', () => {
        // Set time to exactly 8 hours before (14:00 - 8 hours = 06:00)
        vi.setSystemTime(new Date('2024-01-20T06:00:00Z'));

        const result = transformBookingToViewModel(mockBooking);
        expect(result.isCancellable).toBe(false); // Rule is "more than 8 hours"
      });

      it('should mark booking as cancellable when more than 8 hours before start (edge case)', () => {
        // Set time to 05:59 (8 hours + 1 minute before)
        vi.setSystemTime(new Date('2024-01-20T05:59:00Z'));

        const result = transformBookingToViewModel(mockBooking);
        expect(result.isCancellable).toBe(true);
      });

      it('should mark booking as NOT cancellable when class has already started', () => {
        // Set time after class start
        vi.setSystemTime(new Date('2024-01-20T14:30:00Z'));

        const result = transformBookingToViewModel(mockBooking);
        expect(result.isCancellable).toBe(false);
        expect(result.isHistorical).toBe(true);
      });
    });

    describe('HISTORICAL BOOKINGS - time-based logic', () => {
      it('should mark booking as historical when class has started', () => {
        // Set time after class start
        vi.setSystemTime(new Date('2024-01-20T14:30:00Z'));

        const result = transformBookingToViewModel(mockBooking);
        expect(result.isHistorical).toBe(true);
      });

      it('should mark booking as historical when class has ended', () => {
        // Set time after class end
        vi.setSystemTime(new Date('2024-01-20T16:00:00Z'));

        const result = transformBookingToViewModel(mockBooking);
        expect(result.isHistorical).toBe(true);
      });

      it('should NOT mark booking as historical when class is upcoming', () => {
        // Current time is before class start
        const result = transformBookingToViewModel(mockBooking);
        expect(result.isHistorical).toBe(false);
      });

      it('should NOT mark booking as historical when class starts now', () => {
        // Set time exactly at class start
        vi.setSystemTime(new Date('2024-01-20T14:00:00Z'));

        const result = transformBookingToViewModel(mockBooking);
        expect(result.isHistorical).toBe(false); // Class starts "now", not historical yet
      });
    });

    describe('DATE FORMATTING - Polish locale', () => {
      it('should format date in Polish locale correctly', () => {
        const result = transformBookingToViewModel(mockBooking);

        // January 20, 2024 in Polish: "20 stycznia 2024"
        expect(result.formattedDate).toBe('20 stycznia 2024');
      });

      it('should format time range correctly', () => {
        const result = transformBookingToViewModel(mockBooking);

        // 14:00 UTC - 15:00 UTC, but formatted in local timezone (UTC+1 = 15:00 - 16:00)
        expect(result.formattedTime).toBe('15:00 - 16:00');
      });

      it('should format single digit hours correctly', () => {
        const earlyMorningBooking: BookingDto = {
          ...mockBooking,
          scheduled_class: {
            ...mockBooking.scheduled_class,
            start_time: '2024-01-20T09:05:00Z', // 09:05
            end_time: '2024-01-20T10:05:00Z',   // 10:05
          },
        };

        const result = transformBookingToViewModel(earlyMorningBooking);
        expect(result.formattedTime).toBe('10:05 - 11:05');
      });
    });

    describe('EDGE CASES', () => {
      it('should handle midnight class correctly', () => {
        const midnightBooking: BookingDto = {
          ...mockBooking,
          scheduled_class: {
            ...mockBooking.scheduled_class,
            start_time: '2024-01-21T00:00:00Z', // Midnight
            end_time: '2024-01-21T01:00:00Z',   // 1:00 AM
          },
        };

        const result = transformBookingToViewModel(midnightBooking);
        expect(result.formattedTime).toBe('01:00 - 02:00');
      });

      it('should handle class on different day than current date', () => {
        // Current mock time is Jan 15, class is Jan 20
        const result = transformBookingToViewModel(mockBooking);
        expect(result.formattedDate).toBe('20 stycznia 2024');
      });

      it('should handle leap year dates correctly', () => {
        const leapYearBooking: BookingDto = {
          ...mockBooking,
          scheduled_class: {
            ...mockBooking.scheduled_class,
            start_time: '2024-02-29T14:00:00Z', // Leap year date
            end_time: '2024-02-29T15:00:00Z',
          },
        };

        const result = transformBookingToViewModel(leapYearBooking);
        expect(result.formattedDate).toBe('29 lutego 2024');
      });
    });
  });
});
