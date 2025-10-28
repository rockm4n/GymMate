import type { APIRoute } from "astro";

import { deleteBooking, BookingError } from "../../../lib/services/booking.service";

export const prerender = false;

/**
 * DELETE /api/bookings/:id
 * Deletes a booking for an authenticated user.
 * This endpoint requires authentication via JWT token in the Authorization header.
 *
 * Path Parameters:
 * - id (required): UUID of the booking to delete
 *
 * Business Rules:
 * - User must own the booking
 * - Booking can only be cancelled at least 8 hours before class start time
 *
 * @returns 204 No Content on success
 * @returns 400 if business rules are violated
 * @returns 401 if user is not authenticated
 * @returns 403 if user doesn't own the booking
 * @returns 404 if booking is not found
 * @returns 500 on server error
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    // Step 1: Check authentication
    if (!locals.user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Authentication required. Please provide a valid JWT token.",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 2: Validate booking ID parameter
    const bookingId = params.id;
    if (!bookingId) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Booking ID is required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 3: Delete the booking
    await deleteBooking(locals.supabase, locals.user.id, bookingId);

    // Step 4: Return success response (204 No Content)
    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    // Handle BookingError with specific error codes
    if (error instanceof BookingError) {
      switch (error.code) {
        case "NOT_FOUND":
          return new Response(
            JSON.stringify({
              error: "Not Found",
              message: error.message,
            }),
            {
              status: 404,
              headers: { "Content-Type": "application/json" },
            }
          );
        case "UNAUTHORIZED":
          return new Response(
            JSON.stringify({
              error: "Forbidden",
              message: error.message,
            }),
            {
              status: 403,
              headers: { "Content-Type": "application/json" },
            }
          );
        case "TOO_LATE_TO_CANCEL":
          return new Response(
            JSON.stringify({
              error: "Bad Request",
              message: error.message,
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
        case "DATABASE_ERROR":
          // eslint-disable-next-line no-console
          console.error("Database error in booking deletion:", error);
          return new Response(
            JSON.stringify({
              error: "Internal Server Error",
              message: "A database error occurred while deleting the booking",
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          );
      }
    }

    // Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("Unexpected error deleting booking:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred while deleting the booking",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
