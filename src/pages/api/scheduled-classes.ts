import type { APIRoute } from "astro";

import { getScheduledClassesQuerySchema } from "../../lib/schemas/scheduled-class.schema";
import { getScheduledClasses } from "../../lib/services/scheduled-class.service";

export const prerender = false;

/**
 * GET /api/scheduled-classes
 * Retrieves a list of scheduled classes with optional time range filtering.
 * This endpoint is public and does not require authentication.
 *
 * Query Parameters:
 * - start_time (optional): ISO 8601 datetime string to filter classes starting at or after this time
 * - end_time (optional): ISO 8601 datetime string to filter classes starting before or at this time
 *
 * @returns 200 with array of ScheduledClassDto on success
 * @returns 400 if query parameters are invalid
 * @returns 500 on server error
 */
export const GET: APIRoute = async ({ url, locals }) => {
  try {
    // Extract query parameters
    const startTime = url.searchParams.get("start_time");
    const endTime = url.searchParams.get("end_time");

    // Build query object for validation
    const queryParams: Record<string, string> = {};
    if (startTime) queryParams.start_time = startTime;
    if (endTime) queryParams.end_time = endTime;

    // Validate query parameters
    const validationResult = getScheduledClassesQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Invalid query parameters",
          details: validationResult.error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Fetch scheduled classes
    const scheduledClasses = await getScheduledClasses(
      locals.supabase,
      validationResult.data.start_time,
      validationResult.data.end_time
    );

    // Return scheduled classes data
    return new Response(JSON.stringify(scheduledClasses), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log error for debugging
    console.error("Error fetching scheduled classes:", error);

    // Return generic error response
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An error occurred while fetching scheduled classes",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
