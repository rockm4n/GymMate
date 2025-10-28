import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  updatePasswordSchema,
  type LoginInput,
  type RegisterInput,
  type ForgotPasswordInput,
  type UpdatePasswordInput,
} from "../auth.schema";

describe("auth.schema", () => {
  describe("loginSchema", () => {
    describe("email validation", () => {
      it("should accept valid email addresses", () => {
        const validEmails = [
          "user@example.com",
          "test.email+tag@gmail.com",
          "user@subdomain.example.com",
          "123@test-domain.co.uk",
          "user_name@test.io",
        ];

        validEmails.forEach((email) => {
          const result = loginSchema.safeParse({ email, password: "password123" });
          expect(result.success).toBe(true);
        });
      });

      it("should reject invalid email formats", () => {
        const invalidEmails = [
          "invalid-email",
          "@example.com",
          "user@",
          "user.example.com",
          "user@.com",
          "user..user@example.com",
          "user@example..com",
          "",
        ];

        invalidEmails.forEach((email) => {
          const result = loginSchema.safeParse({ email, password: "password123" });
          expect(result.success).toBe(false);
          expect(result.error?.issues[0]?.path).toContain("email");
        });
      });

      it("should reject empty email", () => {
        const result = loginSchema.safeParse({ email: "", password: "password123" });
        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.message).toBe("E-mail jest wymagany");
      });

      it("should reject missing email", () => {
        const result = loginSchema.safeParse({ password: "password123" });
        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.message).toBe("Required");
      });
    });

    describe("password validation", () => {
      it("should accept password with minimum 8 characters", () => {
        const result = loginSchema.safeParse({
          email: "user@example.com",
          password: "12345678",
        });
        expect(result.success).toBe(true);
      });

      it("should reject password shorter than 8 characters", () => {
        const shortPasswords = ["1234567", "abc", "123456"];

        shortPasswords.forEach((password) => {
          const result = loginSchema.safeParse({ email: "user@example.com", password });
          expect(result.success).toBe(false);
          expect(result.error?.issues[0]?.message).toBe("Hasło musi mieć co najmniej 8 znaków");
        });
      });

      it("should reject empty password", () => {
        const result = loginSchema.safeParse({ email: "user@example.com", password: "" });
        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.message).toBe("Hasło jest wymagane");
      });

      it("should reject missing password", () => {
        const result = loginSchema.safeParse({ email: "user@example.com" });
        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.message).toBe("Required");
      });
    });

    describe("complete input validation", () => {
      it("should accept valid complete input", () => {
        const validInput: LoginInput = {
          email: "user@example.com",
          password: "password123",
        };

        const result = loginSchema.safeParse(validInput);
        expect(result.success).toBe(true);
        expect(result.data).toEqual(validInput);
      });
    });
  });

  describe("registerSchema", () => {
    describe("password confirmation validation", () => {
      it("should accept when passwords match", () => {
        const result = registerSchema.safeParse({
          email: "user@example.com",
          password: "password123",
          confirmPassword: "password123",
        });
        expect(result.success).toBe(true);
      });

      it("should reject when passwords do not match", () => {
        const result = registerSchema.safeParse({
          email: "user@example.com",
          password: "password123",
          confirmPassword: "different123",
        });
        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.message).toBe("Hasła nie są zgodne");
        expect(result.error?.issues[0]?.path).toContain("confirmPassword");
      });

      it("should reject empty confirmPassword", () => {
        const result = registerSchema.safeParse({
          email: "user@example.com",
          password: "password123",
          confirmPassword: "",
        });
        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.message).toBe("Potwierdzenie hasła jest wymagane");
      });
    });

    describe("complete input validation", () => {
      it("should accept valid complete registration input", () => {
        const validInput: RegisterInput = {
          email: "user@example.com",
          password: "password123",
          confirmPassword: "password123",
        };

        const result = registerSchema.safeParse(validInput);
        expect(result.success).toBe(true);
        expect(result.data).toEqual(validInput);
      });

      it("should reject registration with invalid email", () => {
        const result = registerSchema.safeParse({
          email: "invalid-email",
          password: "password123",
          confirmPassword: "password123",
        });
        expect(result.success).toBe(false);
      });

      it("should reject registration with short password", () => {
        const result = registerSchema.safeParse({
          email: "user@example.com",
          password: "short",
          confirmPassword: "short",
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe("forgotPasswordSchema", () => {
    it("should accept valid email", () => {
      const validInput: ForgotPasswordInput = {
        email: "user@example.com",
      };

      const result = forgotPasswordSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validInput);
    });

    it("should reject invalid email", () => {
      const result = forgotPasswordSchema.safeParse({ email: "invalid-email" });
      expect(result.success).toBe(false);
    });

    it("should reject empty email", () => {
      const result = forgotPasswordSchema.safeParse({ email: "" });
      expect(result.success).toBe(false);
    });
  });

  describe("updatePasswordSchema", () => {
    it("should accept valid password update", () => {
      const validInput: UpdatePasswordInput = {
        password: "newpassword123",
        confirmPassword: "newpassword123",
      };

      const result = updatePasswordSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validInput);
    });

    it("should reject when passwords do not match", () => {
      const result = updatePasswordSchema.safeParse({
        password: "password123",
        confirmPassword: "different123",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe("Hasła nie są zgodne");
    });

    it("should reject short password", () => {
      const result = updatePasswordSchema.safeParse({
        password: "short",
        confirmPassword: "short",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe("Hasło musi mieć co najmniej 8 znaków");
    });
  });

  describe("EDGE CASES", () => {
    describe("special characters in email", () => {
      it("should handle various special characters in email", () => {
        const specialEmails = [
          "user+tag@example.com",
          "user.name@example.com",
          "user-name@example.com",
          "user_name@example.com",
          "123@example.com",
        ];

        specialEmails.forEach((email) => {
          const result = loginSchema.safeParse({ email, password: "password123" });
          expect(result.success).toBe(true);
        });
      });
    });

    describe("unicode and international characters", () => {
      it("should accept passwords with unicode characters", () => {
        const unicodePasswords = ["password123ęóąśłżźćń", "пароль123", "密码123", "パスワード123"];

        unicodePasswords.forEach((password) => {
          const result = loginSchema.safeParse({ email: "user@example.com", password });
          // Note: Some unicode characters might be rejected by the schema if they contain control characters
          // This test documents current behavior - adjust expectations based on actual schema constraints
          if (!result.success) {
            // Password failed validation: result.error?.issues
          }
          // Only test passwords that are at least 8 characters long
          if (password.length >= 8) {
            expect(result.success).toBe(true);
          }
        });
      });
    });

    describe("boundary conditions", () => {
      it("should accept password exactly 8 characters", () => {
        const result = loginSchema.safeParse({
          email: "user@example.com",
          password: "12345678",
        });
        expect(result.success).toBe(true);
      });

      it("should accept very long emails", () => {
        const longEmail = "a".repeat(200) + "@example.com";
        const result = loginSchema.safeParse({ email: longEmail, password: "password123" });
        expect(result.success).toBe(true);
      });

      it("should accept very long passwords", () => {
        const longPassword = "a".repeat(1000);
        const result = loginSchema.safeParse({ email: "user@example.com", password: longPassword });
        expect(result.success).toBe(true);
      });
    });
  });
});
