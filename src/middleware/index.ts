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
    } else {
      context.locals.user = null;
    }
  } else {
    context.locals.user = null;
  }

  return next();
});
