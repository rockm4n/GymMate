import type { APIRoute } from "astro";

import { AdminService, AdminError } from "../../../lib/services/admin.service";

export const prerender = false;

/**
 * GET /api/admin/dashboard
 * Retrieves aggregated Key Performance Indicators (KPIs) for the admin dashboard.
 * This endpoint is restricted to authenticated users with STAFF role.
 *
 * Authorization is handled by middleware which:
 * - Verifies JWT token in Authorization header
 * - Checks that user has STAFF role
 * - Returns 401 if not authenticated
 * - Returns 403 if not STAFF
 *
 * @returns 200 with AdminDashboardDto containing:
 *   - today_occupancy_rate: percentage of booked spots for today's classes
 *   - total_waiting_list_count: total number of users on waiting lists
 *   - most_popular_classes: array of top 5 classes by booking count
 * @returns 500 on server error
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    // At this point, middleware has already verified:
    // 1. User is authenticated (locals.user exists)
    // 2. User has STAFF role (locals.profile.role === 'staff')
    // So we can proceed directly to fetching the data

    // Fetch dashboard KPIs using AdminService
    const dashboardData = await AdminService.getDashboardData(locals.supabase);

    // Return success response with KPI data
    return new Response(JSON.stringify(dashboardData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle AdminError with specific error codes
    if (error instanceof AdminError) {
      // eslint-disable-next-line no-console
      console.error("Admin service error:", error);
      return new Response(
        JSON.stringify({
          error: "Internal Server Error",
          message: "Failed to retrieve dashboard data",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("Unexpected error in admin dashboard endpoint:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred while retrieving dashboard data",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
