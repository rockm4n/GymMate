import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { FormItem, FormLabel, FormMessage } from "../ui/form";
import { registerSchema, type RegisterInput } from "@/lib/schemas/auth.schema";

export function RegisterForm() {
  const [formData, setFormData] = useState<RegisterInput>({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterInput, string>>>({});
  const [generalError, setGeneralError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name as keyof RegisterInput]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (generalError) {
      setGeneralError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGeneralError("");
    setIsLoading(true);

    // Validate form data
    const result = registerSchema.safeParse(formData);
    
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof RegisterInput, string>> = {};
      result.error.errors.forEach((error) => {
        if (error.path[0]) {
          fieldErrors[error.path[0] as keyof RegisterInput] = error.message;
        }
      });
      setErrors(fieldErrors);
      setIsLoading(false);
      return;
    }

    try {
      // Call register API endpoint
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(result.data),
      });

      const data = await response.json();

      if (!response.ok) {
        // Display server error message
        setGeneralError(data.error || "Wystąpił błąd podczas rejestracji");
        setIsLoading(false);
        return;
      }

      // Registration successful - redirect to schedule page
      // Per PRD US-001: user is automatically logged in after registration
      // Using window.location.href for full page reload to ensure fresh SSR data
      window.location.href = "/app/schedule";
    } catch (error) {
      console.error("Registration error:", error);
      setGeneralError("Wystąpił błąd połączenia. Spróbuj ponownie.");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {generalError && (
        <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {generalError}
        </div>
      )}

      <FormItem>
        <FormLabel htmlFor="email">E-mail</FormLabel>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="twoj@email.com"
          value={formData.email}
          onChange={handleChange}
          aria-invalid={!!errors.email}
          disabled={isLoading}
        />
        <FormMessage>{errors.email}</FormMessage>
      </FormItem>

      <FormItem>
        <FormLabel htmlFor="password">Hasło</FormLabel>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={formData.password}
          onChange={handleChange}
          aria-invalid={!!errors.password}
          disabled={isLoading}
        />
        <FormMessage>{errors.password}</FormMessage>
      </FormItem>

      <FormItem>
        <FormLabel htmlFor="confirmPassword">Powtórz hasło</FormLabel>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={formData.confirmPassword}
          onChange={handleChange}
          aria-invalid={!!errors.confirmPassword}
          disabled={isLoading}
        />
        <FormMessage>{errors.confirmPassword}</FormMessage>
      </FormItem>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Rejestracja..." : "Zarejestruj się"}
      </Button>

      <div className="text-center text-sm text-muted-foreground">
        Masz już konto?{" "}
        <a
          href="/login"
          className="text-primary hover:underline underline-offset-4 font-medium"
        >
          Zaloguj się
        </a>
      </div>
    </form>
  );
}

