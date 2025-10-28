import type { APIRoute } from "astro";

import { createSupabaseServerInstance } from "../../../db/supabase.client.ts";

export const prerender = false;

/**
 * POST /api/auth/logout
 *
 * Logs out the current user by clearing their session.
 * Removes session cookies and invalidates the session on the server.
 *
 * Success response (200):
 * {
 *   "success": true
 * }
 *
 * Error response (400):
 * {
 *   "error": "Error message"
 * }
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Create Supabase server client with cookie management
    const supabase = createSupabaseServerInstance({
      headers: request.headers,
      cookies,
    });

    // Sign out the user
    const { error } = await supabase.auth.signOut();

    if (error) {
      // Logout error occurred
      return new Response(JSON.stringify({ error: "Wystąpił błąd podczas wylogowywania" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Session cookies are automatically cleared by createSupabaseServerInstance
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    // Logout error occurred
    return new Response(JSON.stringify({ error: "Wewnętrzny błąd serwera" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
