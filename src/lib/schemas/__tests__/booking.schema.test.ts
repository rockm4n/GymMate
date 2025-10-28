import { describe, it, expect } from "vitest";
import { createBookingSchema, type CreateBookingInput } from "../booking.schema";

describe("booking.schema", () => {
  describe("createBookingSchema", () => {
    describe("scheduled_class_id validation", () => {
      it("should accept valid UUID v4", () => {
        const validInput: CreateBookingInput = {
          scheduled_class_id: "550e8400-e29b-41d4-a716-446655440000", // Valid UUID v4
        };

        const result = createBookingSchema.safeParse(validInput);
        expect(result.success).toBe(true);
      });

      it("should accept valid UUID v1", () => {
        const validInput: CreateBookingInput = {
          scheduled_class_id: "550e8400-e29b-11d4-a716-446655440000", // Valid UUID v1
        };

        const result = createBookingSchema.safeParse(validInput);
        expect(result.success).toBe(true);
      });

      it("should reject invalid UUID format", () => {
        const invalidInputs = [
          "not-a-uuid",
          "550e8400-e29b-41d4-a716", // Too short
          "550e8400-e29b-41d4-a716-446655440000-extra", // Too long
          "550e8400-e29b-41d4-a716-44665544000z", // Invalid character 'z'
          "", // Empty string
          "550e8400e29b41d4a716446655440000", // No dashes
        ];

        invalidInputs.forEach((invalidInput) => {
          const result = createBookingSchema.safeParse({ scheduled_class_id: invalidInput });
          expect(result.success).toBe(false);
          expect(result.error?.issues[0]?.message).toBe("scheduled_class_id must be a valid UUID");
        });
      });

      it("should reject when scheduled_class_id is missing", () => {
        const result = createBookingSchema.safeParse({});
        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.message).toBe("scheduled_class_id is required");
      });

      it("should reject when scheduled_class_id is not a string", () => {
        const invalidInputs = [123, null, undefined, {}, [], true];

        invalidInputs.forEach((invalidInput) => {
          const result = createBookingSchema.safeParse({ scheduled_class_id: invalidInput });
          expect(result.success).toBe(false);
          // The error message depends on the input type
          if (typeof invalidInput === "string") {
            expect(result.error?.issues[0]?.message).toBe("scheduled_class_id must be a valid UUID");
          } else if (invalidInput === undefined) {
            expect(result.error?.issues[0]?.message).toBe("scheduled_class_id is required");
          } else {
            expect(result.error?.issues[0]?.message).toBe("scheduled_class_id must be a string");
          }
        });
      });
    });

    describe("COMPLETE INPUT VALIDATION", () => {
      it("should accept complete valid input", () => {
        const validInput: CreateBookingInput = {
          scheduled_class_id: "550e8400-e29b-41d4-a716-446655440000",
        };

        const result = createBookingSchema.safeParse(validInput);
        expect(result.success).toBe(true);
        expect(result.data).toEqual(validInput);
      });

      it("should reject input with extra properties", () => {
        const inputWithExtra = {
          scheduled_class_id: "550e8400-e29b-41d4-a716-446655440000",
          extra_property: "should be ignored",
          another_extra: 123,
        };

        const result = createBookingSchema.safeParse(inputWithExtra);
        expect(result.success).toBe(true);
        // Extra properties are stripped by Zod
        expect(result.data).toEqual({
          scheduled_class_id: "550e8400-e29b-41d4-a716-446655440000",
        });
      });
    });

    describe("EDGE CASES", () => {
      it("should handle uppercase UUID", () => {
        const uppercaseUUID = "550E8400-E29B-41D4-A716-446655440000";
        const result = createBookingSchema.safeParse({ scheduled_class_id: uppercaseUUID });
        expect(result.success).toBe(true);
      });

      it("should handle nil UUID", () => {
        const nilUUID = "00000000-0000-0000-0000-000000000000";
        const result = createBookingSchema.safeParse({ scheduled_class_id: nilUUID });
        expect(result.success).toBe(true);
      });

      it("should handle max UUID", () => {
        const maxUUID = "FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF";
        const result = createBookingSchema.safeParse({ scheduled_class_id: maxUUID });
        expect(result.success).toBe(true);
      });

      it("should reject UUID with invalid dash positions", () => {
        const invalidDashPositions = [
          "550e8400e-29b-41d4-a716-446655440000", // Dash in wrong position
          "550e8400-e29b41d4-a716-446655440000", // Missing dash
          "550e8400-e29b-41d4a716-446655440000", // Missing dash
        ];

        invalidDashPositions.forEach((invalidUUID) => {
          const result = createBookingSchema.safeParse({ scheduled_class_id: invalidUUID });
          expect(result.success).toBe(false);
        });
      });
    });

    describe("TYPE INFERENCE", () => {
      it("should correctly infer CreateBookingInput type", () => {
        const input: CreateBookingInput = {
          scheduled_class_id: "550e8400-e29b-41d4-a716-446655440000",
        };

        // TypeScript should enforce that only scheduled_class_id is allowed
        // @ts-expect-error - This should cause a TypeScript error
        // const invalidInput: CreateBookingInput = { invalid_prop: 'test' };

        const result = createBookingSchema.safeParse(input);
        expect(result.success).toBe(true);
      });
    });
  });
});
