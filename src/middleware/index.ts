import { defineMiddleware } from "astro:middleware";

import { createSupabaseServerInstance } from "../db/supabase.client.ts";

// Public paths - pages that don't require authentication
const PUBLIC_PATHS = [
  "/", // Landing page
  "/login",
  "/register",
  "/forgot-password",
  "/update-password",
];

// Public API endpoints - don't require JWT authentication
const PUBLIC_API_PATHS = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/forgot-password",
];

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);

  // Create Supabase server client for SSR (cookie-based)
  const supabase = createSupabaseServerInstance({
    headers: context.request.headers,
    cookies: context.cookies,
  });

  // Make supabase client available in context.locals
  context.locals.supabase = supabase;

  // UNIFIED AUTH APPROACH:
  // Use cookie-based session from Supabase SSR for both pages and API routes
  // This is simpler and works seamlessly with client-side fetch() calls

  let user = null;
  let profile = null;

  // Get user from cookie-based session
  const {
    data: { user: sessionUser },
  } = await supabase.auth.getUser();

  if (sessionUser) {
    user = sessionUser;

    // Fetch user profile to get role information
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, role, created_at")
      .eq("id", sessionUser.id)
      .single();

    if (!profileError && profileData) {
      profile = profileData;
    }
  }

  // Set user and profile in locals
  context.locals.user = user;
  context.locals.profile = profile;

  // REDIRECT LOGIC FOR AUTH PAGES
  // If user is authenticated and tries to access login/register, redirect to schedule
  if (user && (url.pathname === "/login" || url.pathname === "/register")) {
    return context.redirect("/app/schedule", 302);
  }

  // AUTHORIZATION CHECKS FOR ADMIN ROUTES
  const isAdminRoute =
    url.pathname.startsWith("/api/admin/") || url.pathname.startsWith("/admin/");

  if (isAdminRoute) {
    // Admin routes require authentication
    if (!user) {
      // For API routes, return JSON error
      if (url.pathname.startsWith("/api/")) {
        return new Response(
          JSON.stringify({
            error: "Unauthorized",
            message: "Authentication required. Please provide a valid JWT token.",
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
      // For page routes, redirect to login
      return context.redirect("/login", 302);
    }

    // Admin routes require STAFF role
    if (!profile || profile.role !== "staff") {
      // For API routes, return JSON error
      if (url.pathname.startsWith("/api/")) {
        return new Response(
          JSON.stringify({
            error: "Forbidden",
            message: "Access denied. This resource requires STAFF privileges.",
          }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
      // For page routes, redirect to home
      return context.redirect("/", 302);
    }
  }

  // AUTHORIZATION CHECKS FOR PROTECTED USER ROUTES (/app/*)
  const isProtectedUserRoute = url.pathname.startsWith("/app/");

  if (isProtectedUserRoute && !user) {
    // Redirect unauthenticated users to login
    return context.redirect("/login", 302);
  }

  return next();
});
