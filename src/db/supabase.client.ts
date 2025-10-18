import { createClient, type SupabaseClient as SupabaseClientBase } from '@supabase/supabase-js';

import type { Database } from '../db/database.types.ts';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

/**
 * Type for the Supabase client with our Database schema.
 * Use this type instead of importing from @supabase/supabase-js directly.
 */
export type SupabaseClient = SupabaseClientBase<Database>;
