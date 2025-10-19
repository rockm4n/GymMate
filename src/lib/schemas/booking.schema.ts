import { z } from 'zod';

/**
 * Validation schema for creating a new booking.
 * Validates that scheduled_class_id is a valid UUID.
 */
export const createBookingSchema = z.object({
  scheduled_class_id: z
    .string({
      required_error: 'scheduled_class_id is required',
      invalid_type_error: 'scheduled_class_id must be a string',
    })
    .uuid({ message: 'scheduled_class_id must be a valid UUID' }),
});

/**
 * Type inferred from the create booking schema.
 */
export type CreateBookingInput = z.infer<typeof createBookingSchema>;

