import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { FormItem, FormLabel, FormMessage } from "../ui/form";
import { loginSchema, type LoginInput } from "@/lib/schemas/auth.schema";

export function LoginForm() {
  const [formData, setFormData] = useState<LoginInput>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof LoginInput, string>>>({});
  const [generalError, setGeneralError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name as keyof LoginInput]) {
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
    const result = loginSchema.safeParse(formData);
    
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof LoginInput, string>> = {};
      result.error.errors.forEach((error) => {
        if (error.path[0]) {
          fieldErrors[error.path[0] as keyof LoginInput] = error.message;
        }
      });
      setErrors(fieldErrors);
      setIsLoading(false);
      return;
    }

    // TODO: Implement Supabase authentication
    // This will be implemented in the next phase
    console.log("Login attempt:", result.data);
    
    setIsLoading(false);
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
          autoComplete="current-password"
          placeholder="••••••••"
          value={formData.password}
          onChange={handleChange}
          aria-invalid={!!errors.password}
          disabled={isLoading}
        />
        <FormMessage>{errors.password}</FormMessage>
      </FormItem>

      <div className="flex items-center justify-between">
        <a
          href="/forgot-password"
          className="text-sm text-primary hover:underline underline-offset-4"
        >
          Zapomniałeś hasła?
        </a>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Logowanie..." : "Zaloguj się"}
      </Button>

      <div className="text-center text-sm text-muted-foreground">
        Nie masz konta?{" "}
        <a
          href="/register"
          className="text-primary hover:underline underline-offset-4 font-medium"
        >
          Zarejestruj się
        </a>
      </div>
    </form>
  );
}

