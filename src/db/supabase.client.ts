import type { AstroCookies } from "astro";
import { createBrowserClient, createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import { type SupabaseClient as SupabaseClientBase } from "@supabase/supabase-js";

import type { Database } from "../db/database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

/**
 * Browser client for use in React components and client-side code.
 * This client persists session in localStorage and handles automatic token refresh.
 */
export const supabaseClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);

/**
 * Cookie options for server-side session management.
 * Used by createSupabaseServerInstance to configure secure, httpOnly cookies.
 */
export const cookieOptions: CookieOptionsWithName = {
  path: "/",
  secure: true,
  httpOnly: true,
  sameSite: "lax",
};

/**
 * Helper function to parse Cookie header into array of name-value pairs.
 */
function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  return cookieHeader.split(";").map((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    return { name, value: rest.join("=") };
  });
}

/**
 * Creates a Supabase server client for SSR (Server-Side Rendering) in Astro.
 * This client reads and writes session cookies using Astro's cookie management.
 *
 * @param context - Object containing Astro headers and cookies
 * @returns Supabase server client instance
 */
export const createSupabaseServerInstance = (context: { headers: Headers; cookies: AstroCookies }) => {
  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(context.headers.get("Cookie") ?? "");
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => context.cookies.set(name, value, options));
      },
    },
  });

  return supabase;
};

/**
 * Type for the Supabase client with our Database schema.
 * Use this type instead of importing from @supabase/supabase-js directly.
 */
export type SupabaseClient = SupabaseClientBase<Database>;
