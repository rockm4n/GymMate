import type { APIRoute } from "astro";

import { createBookingSchema } from "../../lib/schemas/booking.schema";
import { createBooking, BookingError } from "../../lib/services/booking.service";

export const prerender = false;

/**
 * POST /api/bookings
 * Creates a new booking for an authenticated user on a scheduled class.
 * This endpoint requires authentication via JWT token in the Authorization header.
 *
 * Request Body:
 * - scheduled_class_id (required): UUID of the scheduled class to book
 *
 * @returns 201 with BookingDto on success
 * @returns 400 if request body is invalid or business rules are violated
 * @returns 401 if user is not authenticated
 * @returns 404 if scheduled class is not found
 * @returns 500 on server error
 */
export const POST: APIRoute = async ({ request, locals }) => {
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

    // Step 2: Parse and validate request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Invalid JSON in request body",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const validationResult = createBookingSchema.safeParse(requestBody);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Invalid request body",
          details: validationResult.error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 3: Create the booking
    const bookingDto = await createBooking(locals.supabase, locals.user.id, validationResult.data);

    // Step 4: Return success response
    return new Response(JSON.stringify(bookingDto), {
      status: 201,
      headers: { "Content-Type": "application/json" },
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
        case "ALREADY_BOOKED":
        case "CLASS_FULL":
        case "CLASS_NOT_AVAILABLE":
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
          console.error("Database error in booking creation:", error);
          return new Response(
            JSON.stringify({
              error: "Internal Server Error",
              message: "A database error occurred while creating the booking",
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
    console.error("Unexpected error creating booking:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred while creating the booking",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
