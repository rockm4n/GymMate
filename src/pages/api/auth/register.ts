import type { APIRoute } from "astro";

import { createSupabaseServerInstance } from "../../../db/supabase.client.ts";
import { registerSchema } from "../../../lib/schemas/auth.schema.ts";

export const prerender = false;

/**
 * POST /api/auth/register
 *
 * Registers a new user with email and password.
 * On success, automatically logs in the user and sets session cookies.
 *
 * Request body:
 * {
 *   "email": "user@example.com",
 *   "password": "password123",
 *   "confirmPassword": "password123"
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
    const result = registerSchema.safeParse(body);

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

    // Attempt to sign up new user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Email confirmation is disabled in Supabase settings per PRD requirements (US-001)
        // User is automatically logged in after registration
        emailRedirectTo: `${new URL(request.url).origin}/app/schedule`,
      },
    });

    if (error) {
      // Map Supabase error to user-friendly message
      let errorMessage = "Wystąpił błąd podczas rejestracji";

      if (error.message.includes("User already registered")) {
        errorMessage = "Użytkownik o podanym adresie e-mail już istnieje";
      } else if (error.message.includes("Password should be at least")) {
        errorMessage = "Hasło musi mieć co najmniej 8 znaków";
      } else if (error.message.includes("Unable to validate email")) {
        errorMessage = "Nieprawidłowy format adresu e-mail";
      }

      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if user was created successfully
    if (!data.user) {
      return new Response(
        JSON.stringify({
          error: "Nie udało się utworzyć konta. Spróbuj ponownie.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Session cookies are automatically set by createSupabaseServerInstance
    // User is now logged in (per PRD US-001 requirement)
    return new Response(JSON.stringify({ user: data.user }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    // Registration error occurred
    return new Response(JSON.stringify({ error: "Wewnętrzny błąd serwera" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
