import type { SupabaseClient } from "../../db/supabase.client";
import type { BookingDto, CreateBookingCommand } from "../../types";

/**
 * Error types for booking operations
 */
export class BookingError extends Error {
  constructor(
    message: string,
    public code: "NOT_FOUND" | "ALREADY_BOOKED" | "CLASS_FULL" | "CLASS_NOT_AVAILABLE" | "DATABASE_ERROR"
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
