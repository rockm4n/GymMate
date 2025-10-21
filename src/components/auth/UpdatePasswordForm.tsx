import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { FormItem, FormLabel, FormMessage } from "../ui/form";
import { updatePasswordSchema, type UpdatePasswordInput } from "@/lib/schemas/auth.schema";

export function UpdatePasswordForm() {
  const [formData, setFormData] = useState<UpdatePasswordInput>({
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof UpdatePasswordInput, string>>>({});
  const [generalError, setGeneralError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name as keyof UpdatePasswordInput]) {
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
    const result = updatePasswordSchema.safeParse(formData);
    
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof UpdatePasswordInput, string>> = {};
      result.error.errors.forEach((error) => {
        if (error.path[0]) {
          fieldErrors[error.path[0] as keyof UpdatePasswordInput] = error.message;
        }
      });
      setErrors(fieldErrors);
      setIsLoading(false);
      return;
    }

    // TODO: Implement Supabase password update
    // This will be implemented in the next phase
    console.log("Password update attempt:", result.data);
    
    // Simulate success
    setIsSuccess(true);
    setIsLoading(false);
  };

  if (isSuccess) {
    return (
      <div className="space-y-6">
        <div className="p-4 rounded-md bg-primary/10 border border-primary/20 text-primary">
          <p className="font-medium mb-2">Hasło zostało zmienione!</p>
          <p className="text-sm">
            Twoje hasło zostało pomyślnie zaktualizowane. Możesz teraz zalogować się
            używając nowego hasła.
          </p>
        </div>
        
        <Button asChild className="w-full">
          <a href="/login">Przejdź do logowania</a>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {generalError && (
        <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {generalError}
        </div>
      )}

      <FormItem>
        <FormLabel htmlFor="password">Nowe hasło</FormLabel>
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
        <FormLabel htmlFor="confirmPassword">Powtórz nowe hasło</FormLabel>
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
        {isLoading ? "Aktualizacja..." : "Zmień hasło"}
      </Button>
    </form>
  );
}

