import type { APIRoute } from "astro";

import { createWaitingListEntrySchema } from "../../lib/schemas/waiting-list.schema";
import {
  createWaitingListEntry,
  WaitingListError,
} from "../../lib/services/waiting-list.service";

export const prerender = false;

/**
 * POST /api/waiting-list-entries
 * Creates a new waiting list entry for an authenticated user on a scheduled class.
 * This endpoint requires authentication via JWT token in the Authorization header.
 *
 * Request Body:
 * - scheduled_class_id (required): UUID of the scheduled class to join waiting list for
 *
 * @returns 201 with WaitingListEntryDto on success
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

    const validationResult = createWaitingListEntrySchema.safeParse(requestBody);
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

    // Step 3: Create the waiting list entry
    const waitingListEntryDto = await createWaitingListEntry(
      locals.supabase,
      locals.user.id,
      validationResult.data
    );

    // Step 4: Return success response
    return new Response(JSON.stringify(waitingListEntryDto), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle WaitingListError with specific error codes
    if (error instanceof WaitingListError) {
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
        case "CLASS_NOT_FULL":
        case "ALREADY_ON_WAITING_LIST":
        case "ALREADY_BOOKED":
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
          console.error("Database error in waiting list entry creation:", error);
          return new Response(
            JSON.stringify({
              error: "Internal Server Error",
              message: "A database error occurred while creating the waiting list entry",
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
    console.error("Unexpected error creating waiting list entry:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred while creating the waiting list entry",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

