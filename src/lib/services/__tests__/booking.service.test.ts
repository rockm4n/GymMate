import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createBooking,
  getUserBookings,
  deleteBooking,
  BookingError,
} from '../booking.service';
import type { SupabaseClient } from '@/db/supabase.client';

describe('booking.service', () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabaseClient = {
      rpc: vi.fn(),
      from: vi.fn(),
    };
  });

  describe('createBooking', () => {
    it('should create a booking successfully', async () => {
      const mockBookingData = {
        id: '1',
        created_at: '2025-10-28T10:00:00Z',
        scheduled_class: {
          id: '100',
          start_time: '2025-10-30T10:00:00Z',
          end_time: '2025-10-30T11:00:00Z',
          class: { name: 'Yoga' },
          instructor: { full_name: 'John Doe' },
        },
      };

      mockSupabaseClient.rpc.mockResolvedValue({
        data: mockBookingData,
        error: null,
      });

      const result = await createBooking(
        mockSupabaseClient as SupabaseClient,
        'user-123',
        { scheduled_class_id: '100' }
      );

      expect(result).toEqual(mockBookingData);
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('create_booking', {
        p_user_id: 'user-123',
        p_scheduled_class_id: '100',
      });
    });

    it('should throw BookingError when class is full', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: null,
        error: { message: 'class_full: The class is at maximum capacity' },
      });

      await expect(
        createBooking(mockSupabaseClient as SupabaseClient, 'user-123', {
          scheduled_class_id: '100',
        })
      ).rejects.toThrow(BookingError);

      await expect(
        createBooking(mockSupabaseClient as SupabaseClient, 'user-123', {
          scheduled_class_id: '100',
        })
      ).rejects.toThrow('This class is fully booked');
    });

    it('should throw BookingError when already booked', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: null,
        error: { message: 'already_booked: User has already booked this class' },
      });

      await expect(
        createBooking(mockSupabaseClient as SupabaseClient, 'user-123', {
          scheduled_class_id: '100',
        })
      ).rejects.toThrow('You have already booked this class');
    });
  });

  describe('getUserBookings', () => {
    it('should fetch user bookings successfully', async () => {
      const mockBookings = [
        {
          id: '1',
          created_at: '2025-10-28T10:00:00Z',
          scheduled_class: {
            id: '100',
            start_time: '2025-10-30T10:00:00Z',
            end_time: '2025-10-30T11:00:00Z',
            class: { name: 'Yoga' },
            instructor: { full_name: 'John Doe' },
          },
        },
      ];

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockBookings, error: null }),
      };

      mockSupabaseClient.from.mockReturnValue(mockChain);

      const result = await getUserBookings(
        mockSupabaseClient as SupabaseClient,
        'user-123'
      );

      expect(result).toHaveLength(1);
      expect(result[0].scheduled_class.class.name).toBe('Yoga');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('bookings');
    });

    it('should filter upcoming bookings', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        gte: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      mockSupabaseClient.from.mockReturnValue(mockChain);

      await getUserBookings(
        mockSupabaseClient as SupabaseClient,
        'user-123',
        'UPCOMING'
      );

      expect(mockChain.gte).toHaveBeenCalled();
    });
  });

  describe('deleteBooking', () => {
    it('should delete a booking successfully', async () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 10);

      const mockBooking = {
        id: '1',
        user_id: 'user-123',
        scheduled_class: {
          start_time: futureDate.toISOString(),
        },
      };

      const selectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockBooking, error: null }),
      };

      const deleteChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce(selectChain)
        .mockReturnValueOnce(deleteChain);

      await expect(
        deleteBooking(mockSupabaseClient as SupabaseClient, 'user-123', '1')
      ).resolves.not.toThrow();
    });

    it('should throw error if booking not found', async () => {
      const selectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
      };

      mockSupabaseClient.from.mockReturnValue(selectChain);

      await expect(
        deleteBooking(mockSupabaseClient as SupabaseClient, 'user-123', '999')
      ).rejects.toThrow(BookingError);
    });

    it('should throw error if cancellation is too late', async () => {
      const soonDate = new Date();
      soonDate.setHours(soonDate.getHours() + 2); // Only 2 hours before class

      const mockBooking = {
        id: '1',
        user_id: 'user-123',
        scheduled_class: {
          start_time: soonDate.toISOString(),
        },
      };

      const selectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockBooking, error: null }),
      };

      mockSupabaseClient.from.mockReturnValue(selectChain);

      await expect(
        deleteBooking(mockSupabaseClient as SupabaseClient, 'user-123', '1')
      ).rejects.toThrow('at least 8 hours before');
    });
  });
});

