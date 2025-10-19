import { z } from "zod";

/**
 * Validation schema for query parameters when fetching scheduled classes.
 * Both start_time and end_time are optional ISO 8601 datetime strings.
 */
export const getScheduledClassesQuerySchema = z.object({
  start_time: z.string().datetime({ message: "start_time must be a valid ISO 8601 datetime string" }).optional(),
  end_time: z.string().datetime({ message: "end_time must be a valid ISO 8601 datetime string" }).optional(),
});

/**
 * Type inferred from the get scheduled classes query schema.
 */
export type GetScheduledClassesQuery = z.infer<typeof getScheduledClassesQuerySchema>;
