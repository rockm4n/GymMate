import { z } from 'zod';

/**
 * Validation schema for updating a user's profile.
 * Requires full_name to be a non-empty string.
 */
export const updateProfileSchema = z.object({
  full_name: z.string().min(1, 'Full name is required and cannot be empty'),
});

/**
 * Type inferred from the update profile schema.
 */
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

