import type { SupabaseClient } from "../../db/supabase.client";
import type { ProfileDto, UpdateProfileCommand } from "../../types";

/**
 * Retrieves a user's profile by their ID.
 *
 * @param supabase - Supabase client instance
 * @param userId - The ID of the user whose profile to retrieve
 * @returns The user's profile data or null if not found
 * @throws Error if database operation fails
 */
export async function getUserProfile(supabase: SupabaseClient, userId: string): Promise<ProfileDto | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, created_at")
    .eq("id", userId)
    .single();

  if (error) {
    // If profile not found, return null instead of throwing
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to fetch user profile: ${error.message}`);
  }

  return data;
}

/**
 * Updates a user's profile with the provided data.
 *
 * @param supabase - Supabase client instance
 * @param userId - The ID of the user whose profile to update
 * @param data - The profile data to update
 * @returns The updated profile data
 * @throws Error if database operation fails
 */
export async function updateUserProfile(
  supabase: SupabaseClient,
  userId: string,
  data: UpdateProfileCommand
): Promise<ProfileDto> {
  const { data: updatedProfile, error } = await supabase
    .from("profiles")
    .update(data)
    .eq("id", userId)
    .select("id, full_name, role, created_at")
    .single();

  if (error) {
    throw new Error(`Failed to update user profile: ${error.message}`);
  }

  return updatedProfile;
}
