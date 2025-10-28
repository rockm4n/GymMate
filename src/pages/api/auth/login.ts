import type { APIRoute } from "astro";

import { createSupabaseServerInstance } from "../../../db/supabase.client.ts";
import { loginSchema } from "../../../lib/schemas/auth.schema.ts";

export const prerender = false;

/**
 * POST /api/auth/login
 *
 * Authenticates a user with email and password.
 * On success, sets httpOnly cookies for session management and returns user data.
 *
 * Request body:
 * {
 *   "email": "user@example.com",
 *   "password": "password123"
 * }
 *
 * Success response (200):
 * {
 *   "user": { id, email, ... }
 * }
 *
 * Error response (400):
 * {
 *   "error": "Error message"
 * }
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();

    // Validate request body with Zod schema
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowe dane wejściowe",
          details: result.error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { email, password } = result.data;

    // Create Supabase server client with cookie management
    const supabase = createSupabaseServerInstance({
      headers: request.headers,
      cookies,
    });

    // Attempt to sign in with email and password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Map Supabase error to user-friendly message
      let errorMessage = "Wystąpił błąd podczas logowania";

      if (error.message.includes("Invalid login credentials")) {
        errorMessage = "Nieprawidłowy adres e-mail lub hasło";
      } else if (error.message.includes("Email not confirmed")) {
        errorMessage = "Adres e-mail nie został potwierdzony";
      }

      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Session cookies are automatically set by createSupabaseServerInstance
    return new Response(JSON.stringify({ user: data.user }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    // Login error occurred
    return new Response(JSON.stringify({ error: "Wewnętrzny błąd serwera" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
