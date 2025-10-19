import type { SupabaseClient } from "../../db/supabase.client";
import type { BookingDto, CreateBookingCommand } from "../../types";

/**
 * Error types for booking operations
 */
export class BookingError extends Error {
  constructor(
    message: string,
    public code:
      | "NOT_FOUND"
      | "ALREADY_BOOKED"
      | "CLASS_FULL"
      | "CLASS_NOT_AVAILABLE"
      | "DATABASE_ERROR"
      | "UNAUTHORIZED"
      | "TOO_LATE_TO_CANCEL"
  ) {
    super(message);
    this.name = "BookingError";
  }
}

/**
 * Creates a new booking for a user on a scheduled class.
 * This function uses the create_booking RPC function which provides:
 * - Atomic operation with row-level locking to prevent race conditions
 * - Validation that the scheduled class exists and is available
 * - Capacity checking (if capacity is set)
 * - Prevention of duplicate bookings (unique constraint)
 *
 * @param supabase - Supabase client instance
 * @param userId - ID of the user creating the booking
 * @param command - Command object containing scheduled_class_id
 * @returns BookingDto with the created booking and related data
 * @throws BookingError with appropriate error code
 */
export async function createBooking(
  supabase: SupabaseClient,
  userId: string,
  command: CreateBookingCommand
): Promise<BookingDto> {
  const { scheduled_class_id } = command;

  // Call the RPC function to create the booking atomically
  const { data, error } = await supabase.rpc("create_booking", {
    p_user_id: userId,
    p_scheduled_class_id: scheduled_class_id,
  });

  if (error) {
    // Map PostgreSQL exceptions to BookingError codes
    const errorMessage = error.message.toLowerCase();

    if (errorMessage.includes("class_not_found")) {
      throw new BookingError(`Scheduled class with ID ${scheduled_class_id} not found`, "NOT_FOUND");
    }

    if (errorMessage.includes("class_not_available")) {
      throw new BookingError("Class is not available for booking", "CLASS_NOT_AVAILABLE");
    }

    if (errorMessage.includes("class_full")) {
      throw new BookingError("This class is fully booked. No available spots remaining.", "CLASS_FULL");
    }

    if (errorMessage.includes("already_booked")) {
      throw new BookingError("You have already booked this class", "ALREADY_BOOKED");
    }

    // Generic database error
    throw new BookingError(`Failed to create booking: ${error.message}`, "DATABASE_ERROR");
  }

  // The RPC function returns the BookingDto directly as JSONB
  return data as unknown as BookingDto;
}

/**
 * Deletes a booking by ID.
 * Validates that:
 * - The booking exists
 * - The booking belongs to the requesting user
 * - The class hasn't started yet (at least 8 hours before start time)
 *
 * @param supabase - Supabase client instance
 * @param userId - ID of the user requesting deletion
 * @param bookingId - ID of the booking to delete
 * @throws BookingError with appropriate error code
 */
export async function deleteBooking(
  supabase: SupabaseClient,
  userId: string,
  bookingId: string
): Promise<void> {
  // First, fetch the booking to verify ownership and check cancellation policy
  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select(
      `
      id,
      user_id,
      scheduled_class:scheduled_classes!inner (
        start_time
      )
    `
    )
    .eq("id", bookingId)
    .single();

  if (fetchError || !booking) {
    throw new BookingError(`Booking with ID ${bookingId} not found`, "NOT_FOUND");
  }

  // Verify ownership
  if (booking.user_id !== userId) {
    throw new BookingError("You are not authorized to cancel this booking", "UNAUTHORIZED");
  }

  // Check cancellation policy (at least 8 hours before class start)
  const startTime = new Date(booking.scheduled_class.start_time);
  const now = new Date();
  const hoursUntilStart = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntilStart < 8) {
    throw new BookingError(
      "Bookings can only be cancelled at least 8 hours before the class starts",
      "TOO_LATE_TO_CANCEL"
    );
  }

  // Delete the booking
  const { error: deleteError } = await supabase.from("bookings").delete().eq("id", bookingId);

  if (deleteError) {
    throw new BookingError(`Failed to delete booking: ${deleteError.message}`, "DATABASE_ERROR");
  }
}

/**
 * Gets all bookings for a user, optionally filtered by status.
 * Returns bookings with related scheduled class, class, and instructor information.
 *
 * @param supabase - Supabase client instance
 * @param userId - ID of the user
 * @param status - Optional filter: 'UPCOMING' for future classes, 'PAST' for completed classes
 * @returns Array of BookingDto
 * @throws BookingError on database error
 */
export async function getUserBookings(
  supabase: SupabaseClient,
  userId: string,
  status?: "UPCOMING" | "PAST"
): Promise<BookingDto[]> {
  let query = supabase
    .from("bookings")
    .select(
      `
      id,
      created_at,
      scheduled_class:scheduled_classes!inner (
        id,
        start_time,
        end_time,
        class:classes!inner (
          name
        ),
        instructor:instructors (
          full_name
        )
      )
    `
    )
    .eq("user_id", userId)
    .order("scheduled_class(start_time)", { ascending: false });

  // Apply status filter if provided
  if (status === "UPCOMING") {
    query = query.gte("scheduled_class.start_time", new Date().toISOString());
  } else if (status === "PAST") {
    query = query.lt("scheduled_class.start_time", new Date().toISOString());
  }

  const { data, error } = await query;

  if (error) {
    throw new BookingError(`Failed to fetch user bookings: ${error.message}`, "DATABASE_ERROR");
  }

  // Transform the data to match BookingDto structure
  return (data || []).map((booking) => ({
    id: booking.id,
    created_at: booking.created_at,
    scheduled_class: {
      id: booking.scheduled_class.id,
      start_time: booking.scheduled_class.start_time,
      end_time: booking.scheduled_class.end_time,
      class: {
        name: booking.scheduled_class.class.name,
      },
      instructor: booking.scheduled_class.instructor
        ? {
            full_name: booking.scheduled_class.instructor.full_name,
          }
        : null,
    },
  }));
}
