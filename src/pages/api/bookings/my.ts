import type { APIRoute } from "astro";

import { getUserBookings, BookingError } from "../../../lib/services/booking.service";

export const prerender = false;

/**
 * GET /api/bookings/my
 * Retrieves all bookings for the authenticated user.
 * This endpoint requires authentication via JWT token in the Authorization header.
 *
 * Query Parameters:
 * - status (optional): Filter by status - 'UPCOMING' for future classes, 'PAST' for completed classes
 *
 * @returns 200 with array of BookingDto on success
 * @returns 401 if user is not authenticated
 * @returns 500 on server error
 */
export const GET: APIRoute = async ({ url, locals }) => {
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

    // Step 2: Extract and validate query parameters
    const statusParam = url.searchParams.get("status");
    let status: "UPCOMING" | "PAST" | undefined;

    if (statusParam) {
      if (statusParam !== "UPCOMING" && statusParam !== "PAST") {
        return new Response(
          JSON.stringify({
            error: "Bad Request",
            message: "Invalid status parameter. Must be 'UPCOMING' or 'PAST'",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      status = statusParam;
    }

    // Step 3: Fetch user bookings
    const bookings = await getUserBookings(locals.supabase, locals.user.id, status);

    // Step 4: Return bookings data
    return new Response(JSON.stringify(bookings), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle BookingError
    if (error instanceof BookingError) {
      // eslint-disable-next-line no-console
      console.error("Error fetching user bookings:", error);
      return new Response(
        JSON.stringify({
          error: "Internal Server Error",
          message: "An error occurred while fetching your bookings",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("Unexpected error fetching user bookings:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred while fetching your bookings",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
