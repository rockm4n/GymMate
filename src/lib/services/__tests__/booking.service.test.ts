import { describe, it, expect, vi, beforeEach } from "vitest";
import { createBooking, getUserBookings, deleteBooking, BookingError } from "../booking.service";
import type { SupabaseClient } from "@/db/supabase.client";

describe("booking.service", () => {
  let mockSupabaseClient: unknown;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabaseClient = {
      rpc: vi.fn(),
      from: vi.fn(),
    };
  });

  describe("createBooking", () => {
    it("should create a booking successfully", async () => {
      const mockBookingData = {
        id: "1",
        created_at: "2025-10-28T10:00:00Z",
        scheduled_class: {
          id: "100",
          start_time: "2025-10-30T10:00:00Z",
          end_time: "2025-10-30T11:00:00Z",
          class: { name: "Yoga" },
          instructor: { full_name: "John Doe" },
        },
      };

      mockSupabaseClient.rpc.mockResolvedValue({
        data: mockBookingData,
        error: null,
      });

      const result = await createBooking(mockSupabaseClient as SupabaseClient, "user-123", {
        scheduled_class_id: "100",
      });

      expect(result).toEqual(mockBookingData);
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith("create_booking", {
        p_user_id: "user-123",
        p_scheduled_class_id: "100",
      });
    });

    it("should throw BookingError when class is full", async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: null,
        error: { message: "class_full: The class is at maximum capacity" },
      });

      await expect(
        createBooking(mockSupabaseClient as SupabaseClient, "user-123", {
          scheduled_class_id: "100",
        })
      ).rejects.toThrow(BookingError);

      await expect(
        createBooking(mockSupabaseClient as SupabaseClient, "user-123", {
          scheduled_class_id: "100",
        })
      ).rejects.toThrow("This class is fully booked");
    });

    it("should throw BookingError when already booked", async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: null,
        error: { message: "already_booked: User has already booked this class" },
      });

      await expect(
        createBooking(mockSupabaseClient as SupabaseClient, "user-123", {
          scheduled_class_id: "100",
        })
      ).rejects.toThrow("You have already booked this class");
    });
  });

  describe("getUserBookings", () => {
    it("should fetch user bookings successfully", async () => {
      const mockBookings = [
        {
          id: "1",
          created_at: "2025-10-28T10:00:00Z",
          scheduled_class: {
            id: "100",
            start_time: "2025-10-30T10:00:00Z",
            end_time: "2025-10-30T11:00:00Z",
            class: { name: "Yoga" },
            instructor: { full_name: "John Doe" },
          },
        },
      ];

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockBookings, error: null }),
      };

      mockSupabaseClient.from.mockReturnValue(mockChain);

      const result = await getUserBookings(mockSupabaseClient as SupabaseClient, "user-123");

      expect(result).toHaveLength(1);
      expect(result[0].scheduled_class.class.name).toBe("Yoga");
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("bookings");
    });

    it("should filter upcoming bookings", async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        gte: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      mockSupabaseClient.from.mockReturnValue(mockChain);

      await getUserBookings(mockSupabaseClient as SupabaseClient, "user-123", "UPCOMING");

      expect(mockChain.gte).toHaveBeenCalled();
    });
  });

  describe("deleteBooking", () => {
    it("should delete a booking successfully", async () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 10);

      const mockBooking = {
        id: "1",
        user_id: "user-123",
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

      mockSupabaseClient.from.mockReturnValueOnce(selectChain).mockReturnValueOnce(deleteChain);

      await expect(deleteBooking(mockSupabaseClient as SupabaseClient, "user-123", "1")).resolves.not.toThrow();
    });

    it("should throw error if booking not found", async () => {
      const selectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: "Not found" } }),
      };

      mockSupabaseClient.from.mockReturnValue(selectChain);

      await expect(deleteBooking(mockSupabaseClient as SupabaseClient, "user-123", "999")).rejects.toThrow(
        BookingError
      );
    });

    it("should throw error if cancellation is too late", async () => {
      const soonDate = new Date();
      soonDate.setHours(soonDate.getHours() + 2); // Only 2 hours before class

      const mockBooking = {
        id: "1",
        user_id: "user-123",
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

      await expect(deleteBooking(mockSupabaseClient as SupabaseClient, "user-123", "1")).rejects.toThrow(
        "at least 8 hours before"
      );
    });
  });

  describe("ADDITIONAL EDGE CASES AND BUSINESS RULES", () => {
    describe("createBooking - advanced error scenarios", () => {
      it("should handle database connection errors", async () => {
        mockSupabaseClient.rpc.mockRejectedValue(new Error("Database connection failed"));

        await expect(
          createBooking(mockSupabaseClient as SupabaseClient, "user-123", {
            scheduled_class_id: "100",
          })
        ).rejects.toThrow("Database connection failed");
      });

      it("should handle timeout errors", async () => {
        vi.useRealTimers(); // Use real timers for timeout test
        mockSupabaseClient.rpc.mockImplementation(
          () => new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 100))
        );

        await expect(
          createBooking(mockSupabaseClient as SupabaseClient, "user-123", {
            scheduled_class_id: "100",
          })
        ).rejects.toThrow("Timeout");
      });

      it("should handle malformed error responses", async () => {
        mockSupabaseClient.rpc.mockResolvedValue({
          data: null,
          error: { message: null }, // Malformed error
        });

        await expect(
          createBooking(mockSupabaseClient as SupabaseClient, "user-123", {
            scheduled_class_id: "100",
          })
        ).rejects.toThrow(); // May throw different error types for malformed responses
      });
    });

    describe("getUserBookings - advanced filtering scenarios", () => {
      it("should handle empty booking results", async () => {
        const mockChain = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        };

        mockSupabaseClient.from.mockReturnValue(mockChain);

        const result = await getUserBookings(mockSupabaseClient as SupabaseClient, "user-123");

        expect(result).toHaveLength(0);
      });

      it("should handle database errors during fetch", async () => {
        const mockChain = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: null, error: { message: "Database error" } }),
        };

        mockSupabaseClient.from.mockReturnValue(mockChain);

        await expect(getUserBookings(mockSupabaseClient as SupabaseClient, "user-123")).rejects.toThrow();
      });

      it("should filter historical bookings correctly", async () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 1); // Yesterday

        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 1); // Tomorrow

        const mockBookings = [
          {
            id: "1",
            created_at: "2024-01-01T10:00:00Z",
            scheduled_class: {
              id: "100",
              start_time: pastDate.toISOString(), // Past class
              end_time: pastDate.toISOString(),
              class: { name: "Past Yoga" },
              instructor: { full_name: "John Doe" },
            },
          },
          {
            id: "2",
            created_at: "2024-01-01T10:00:00Z",
            scheduled_class: {
              id: "101",
              start_time: futureDate.toISOString(), // Future class
              end_time: futureDate.toISOString(),
              class: { name: "Future Yoga" },
              instructor: { full_name: "Jane Doe" },
            },
          },
        ];

        const mockChain = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          lt: vi.fn().mockResolvedValue({ data: [mockBookings[0]], error: null }), // Only past bookings
        };

        mockSupabaseClient.from.mockReturnValue(mockChain);

        const result = await getUserBookings(mockSupabaseClient as SupabaseClient, "user-123", "PAST");

        expect(result).toHaveLength(1);
        expect(result[0].scheduled_class.class.name).toBe("Past Yoga");
        expect(mockChain.lt).toHaveBeenCalled();
      });

      it("should handle bookings with missing instructor data", async () => {
        const mockBookings = [
          {
            id: "1",
            created_at: "2024-01-01T10:00:00Z",
            scheduled_class: {
              id: "100",
              start_time: "2024-01-20T10:00:00Z",
              end_time: "2024-01-20T11:00:00Z",
              class: { name: "Yoga" },
              instructor: null, // Missing instructor
            },
          },
        ];

        const mockChain = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: mockBookings, error: null }),
        };

        mockSupabaseClient.from.mockReturnValue(mockChain);

        const result = await getUserBookings(mockSupabaseClient as SupabaseClient, "user-123");

        expect(result).toHaveLength(1);
        expect(result[0].scheduled_class.instructor).toBeNull();
      });
    });

    describe("deleteBooking - advanced cancellation rules", () => {
      it("should allow cancellation more than 8 hours before class", async () => {
        const futureDate = new Date();
        futureDate.setHours(futureDate.getHours() + 9); // 9 hours from now to be safe

        const mockBooking = {
          id: "1",
          user_id: "user-123",
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

        mockSupabaseClient.from.mockReturnValueOnce(selectChain).mockReturnValueOnce(deleteChain);

        await expect(deleteBooking(mockSupabaseClient as SupabaseClient, "user-123", "1")).resolves.not.toThrow();
      });

      it("should prevent cancellation when booking does not belong to user", async () => {
        const mockBooking = {
          id: "1",
          user_id: "different-user-456", // Different user
          scheduled_class: {
            start_time: "2024-01-20T10:00:00Z",
          },
        };

        const selectChain = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockBooking, error: null }),
        };

        mockSupabaseClient.from.mockReturnValue(selectChain);

        await expect(deleteBooking(mockSupabaseClient as SupabaseClient, "user-123", "1")).rejects.toThrow(
          BookingError
        );
      });

      it("should handle concurrent booking modifications", async () => {
        // Simulate booking being deleted by another process
        const selectChain = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: "Booking not found" },
          }),
        };

        mockSupabaseClient.from.mockReturnValue(selectChain);

        await expect(deleteBooking(mockSupabaseClient as SupabaseClient, "user-123", "nonexistent-id")).rejects.toThrow(
          BookingError
        );
      });

      it("should handle class that is currently in progress", async () => {
        const pastDate = new Date();
        pastDate.setHours(pastDate.getHours() - 1); // Class started 1 hour ago

        const mockBooking = {
          id: "1",
          user_id: "user-123",
          scheduled_class: {
            start_time: pastDate.toISOString(),
          },
        };

        const selectChain = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockBooking, error: null }),
        };

        mockSupabaseClient.from.mockReturnValue(selectChain);

        await expect(deleteBooking(mockSupabaseClient as SupabaseClient, "user-123", "1")).rejects.toThrow(
          "at least 8 hours before"
        );
      });
    });

    describe("CONCURRENT BOOKING SCENARIOS", () => {
      it("should handle race conditions during booking creation", async () => {
        // Simulate another user booking the last spot simultaneously
        mockSupabaseClient.rpc.mockResolvedValue({
          data: null,
          error: { message: "class_full: The class is at maximum capacity" },
        });

        await expect(
          createBooking(mockSupabaseClient as SupabaseClient, "user-123", {
            scheduled_class_id: "100",
          })
        ).rejects.toThrow("This class is fully booked");
      });

      it("should handle duplicate booking attempts in quick succession", async () => {
        // First call succeeds
        mockSupabaseClient.rpc
          .mockResolvedValueOnce({
            data: { id: "booking-1" },
            error: null,
          })
          // Second call fails with already booked
          .mockResolvedValueOnce({
            data: null,
            error: { message: "already_booked: User has already booked this class" },
          });

        // First booking should succeed
        await expect(
          createBooking(mockSupabaseClient as SupabaseClient, "user-123", {
            scheduled_class_id: "100",
          })
        ).resolves.toBeDefined();

        // Second booking should fail
        await expect(
          createBooking(mockSupabaseClient as SupabaseClient, "user-123", {
            scheduled_class_id: "100",
          })
        ).rejects.toThrow("You have already booked this class");
      });
    });

    describe("DATA INTEGRITY AND VALIDATION", () => {
      it("should validate user_id format", async () => {
        const invalidUserIds = [null, undefined, "", 123, {}, []];

        for (const invalidUserId of invalidUserIds) {
          await expect(
            createBooking(mockSupabaseClient as SupabaseClient, invalidUserId as string, {
              scheduled_class_id: "100",
            })
          ).rejects.toThrow();
        }
      });

      it("should handle malformed scheduled_class_id", async () => {
        mockSupabaseClient.rpc.mockResolvedValue({
          data: null,
          error: { message: "invalid_class_id: Invalid scheduled class ID" },
        });

        await expect(
          createBooking(mockSupabaseClient as SupabaseClient, "user-123", {
            scheduled_class_id: "invalid-id",
          })
        ).rejects.toThrow();
      });

      it("should handle non-existent scheduled class", async () => {
        mockSupabaseClient.rpc.mockResolvedValue({
          data: null,
          error: { message: "class_not_found: Scheduled class does not exist" },
        });

        await expect(
          createBooking(mockSupabaseClient as SupabaseClient, "user-123", {
            scheduled_class_id: "nonexistent-id",
          })
        ).rejects.toThrow();
      });
    });
  });
});
