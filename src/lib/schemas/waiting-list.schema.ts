import { z } from "zod";

/**
 * Validation schema for creating a new waiting list entry.
 * Validates that scheduled_class_id is a valid UUID.
 */
export const createWaitingListEntrySchema = z.object({
  scheduled_class_id: z
    .string({
      required_error: "scheduled_class_id is required",
      invalid_type_error: "scheduled_class_id must be a string",
    })
    .uuid({ message: "scheduled_class_id must be a valid UUID" }),
});

/**
 * Type inferred from the create waiting list entry schema.
 */
export type CreateWaitingListEntryInput = z.infer<typeof createWaitingListEntrySchema>;
