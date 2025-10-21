import { defineMiddleware } from "astro:middleware";

import { supabaseClient } from "../db/supabase.client.ts";

export const onRequest = defineMiddleware(async (context, next) => {
  // Get the authorization header from the request
  const authHeader = context.request.headers.get("authorization");

  // Create a Supabase client for this request
  context.locals.supabase = supabaseClient;

  // If there's an authorization header, verify the JWT token
  if (authHeader) {
    const token = authHeader.replace("Bearer ", "");
    const { data, error } = await supabaseClient.auth.getUser(token);

    if (!error && data.user) {
      context.locals.user = data.user;

      // Fetch user profile to get role information
      const { data: profile, error: profileError } = await supabaseClient
        .from("profiles")
        .select("id, full_name, role, created_at")
        .eq("id", data.user.id)
        .single();

      if (!profileError && profile) {
        context.locals.profile = profile;
      } else {
        context.locals.profile = null;
      }
    } else {
      context.locals.user = null;
      context.locals.profile = null;
    }
  } else {
    context.locals.user = null;
    context.locals.profile = null;
  }

  // Check authorization for admin routes (both API and pages)
  const url = new URL(context.request.url);
  const isAdminRoute = url.pathname.startsWith("/api/admin/") || url.pathname.startsWith("/admin/");
  
  if (isAdminRoute) {
    // Admin routes require authentication
    if (!context.locals.user) {
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
          }
        );
      }
      // For page routes, redirect to home
      return context.redirect("/", 302);
    }

    // Admin routes require STAFF role
    if (!context.locals.profile || context.locals.profile.role !== "staff") {
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
          }
        );
      }
      // For page routes, redirect to home
      return context.redirect("/", 302);
    }
  }

  return next();
});
