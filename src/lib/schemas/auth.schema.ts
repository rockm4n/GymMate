import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "E-mail jest wymagany").email("Nieprawidłowy format adresu e-mail"),
  password: z.string().min(1, "Hasło jest wymagane").min(8, "Hasło musi mieć co najmniej 8 znaków"),
});

export const registerSchema = z
  .object({
    email: z.string().min(1, "E-mail jest wymagany").email("Nieprawidłowy format adresu e-mail"),
    password: z.string().min(1, "Hasło jest wymagane").min(8, "Hasło musi mieć co najmniej 8 znaków"),
    confirmPassword: z.string().min(1, "Potwierdzenie hasła jest wymagane"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są zgodne",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "E-mail jest wymagany").email("Nieprawidłowy format adresu e-mail"),
});

export const updatePasswordSchema = z
  .object({
    password: z.string().min(1, "Hasło jest wymagane").min(8, "Hasło musi mieć co najmniej 8 znaków"),
    confirmPassword: z.string().min(1, "Potwierdzenie hasła jest wymagane"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są zgodne",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
