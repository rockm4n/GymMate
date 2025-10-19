import type { SupabaseClient } from "../../db/supabase.client";
import type { ScheduledClassDto } from "../../types";

/**
 * Retrieves scheduled classes with optional time range filtering.
 * Uses the get_scheduled_classes RPC function to efficiently fetch
 * all related data (class info, instructor info, bookings count) in a single query.
 *
 * @param supabase - Supabase client instance
 * @param startTime - Optional ISO 8601 datetime string to filter classes starting at or after this time
 * @param endTime - Optional ISO 8601 datetime string to filter classes starting before or at this time
 * @returns Array of scheduled classes with related data
 * @throws Error if database operation fails
 */
export async function getScheduledClasses(
  supabase: SupabaseClient,
  startTime?: string,
  endTime?: string
): Promise<ScheduledClassDto[]> {
  const { data, error } = await supabase.rpc("get_scheduled_classes", {
    start_filter: startTime,
    end_filter: endTime,
  });

  if (error) {
    throw new Error(`Failed to fetch scheduled classes: ${error.message}`);
  }

  return data as ScheduledClassDto[];
}
