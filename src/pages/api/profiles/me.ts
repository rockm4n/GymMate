import type { APIRoute } from "astro";

import { updateProfileSchema } from "../../../lib/schemas/profile.schema";
import { getUserProfile, updateUserProfile } from "../../../lib/services/profile.service";

export const prerender = false;

/**
 * GET /api/profiles/me
 * Retrieves the profile of the currently authenticated user.
 *
 * @returns 200 with ProfileDto on success
 * @returns 401 if user is not authenticated
 * @returns 404 if profile not found
 * @returns 500 on server error
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    // Check if user is authenticated
    if (!locals.user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Authentication required",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Fetch user profile
    const profile = await getUserProfile(locals.supabase, locals.user.id);

    // Check if profile exists
    if (!profile) {
      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "Profile not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Return profile data
    return new Response(JSON.stringify(profile), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    // Error fetching user profile
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An error occurred while fetching the profile",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

/**
 * PATCH /api/profiles/me
 * Updates the profile of the currently authenticated user.
 *
 * @returns 200 with updated ProfileDto on success
 * @returns 400 if request body is invalid
 * @returns 401 if user is not authenticated
 * @returns 500 on server error
 */
export const PATCH: APIRoute = async ({ locals, request }) => {
  try {
    // Check if user is authenticated
    if (!locals.user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Authentication required",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
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

    // Validate request body
    const validationResult = updateProfileSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Validation failed",
          details: validationResult.error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Update user profile
    const updatedProfile = await updateUserProfile(locals.supabase, locals.user.id, validationResult.data);

    // Return updated profile
    return new Response(JSON.stringify(updatedProfile), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    // Error updating user profile
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An error occurred while updating the profile",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
