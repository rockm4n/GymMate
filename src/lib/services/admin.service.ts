import type { SupabaseClient } from "../../db/supabase.client";
import type { AdminDashboardDto } from "../../types";

/**
 * Error types for admin operations
 */
export class AdminError extends Error {
  constructor(
    message: string,
    public code: "DATABASE_ERROR" | "UNAUTHORIZED"
  ) {
    super(message);
    this.name = "AdminError";
  }
}

/**
 * Service for admin-related operations.
 * Provides methods for retrieving aggregated data and KPIs for the admin dashboard.
 */
export const AdminService = {
  /**
   * Retrieves dashboard KPIs including occupancy rate, waiting list count,
   * and most popular classes.
   *
   * This method calls the get_dashboard_kpis RPC function which performs
   * all calculations in a single database query for optimal performance.
   *
   * @param supabase - Supabase client instance
   * @returns AdminDashboardDto with aggregated KPI data
   * @throws AdminError with appropriate error code
   */
  async getDashboardData(supabase: SupabaseClient): Promise<AdminDashboardDto> {
    const { data, error } = await supabase.rpc("get_dashboard_kpis");

    if (error) {
      throw new AdminError(`Failed to retrieve dashboard data: ${error.message}`, "DATABASE_ERROR");
    }

    if (!data) {
      throw new AdminError("No data returned from dashboard KPIs function", "DATABASE_ERROR");
    }

    // The RPC function returns the data as JSONB, cast it to AdminDashboardDto
    return data as unknown as AdminDashboardDto;
  },
};
