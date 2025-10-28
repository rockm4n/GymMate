import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { FormItem, FormLabel, FormMessage, FormDescription } from "../ui/form";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/schemas/auth.schema";

export function ForgotPasswordForm() {
  const [formData, setFormData] = useState<ForgotPasswordInput>({
    email: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ForgotPasswordInput, string>>>({});
  const [generalError, setGeneralError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name as keyof ForgotPasswordInput]) {
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
    setIsSuccess(false);

    // Validate form data
    const result = forgotPasswordSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ForgotPasswordInput, string>> = {};
      result.error.errors.forEach((error) => {
        if (error.path[0]) {
          fieldErrors[error.path[0] as keyof ForgotPasswordInput] = error.message;
        }
      });
      setErrors(fieldErrors);
      setIsLoading(false);
      return;
    }

    // TODO: Implement Supabase password reset
    // This will be implemented in the next phase
    // Password reset request: result.data

    // Simulate success
    setIsSuccess(true);
    setIsLoading(false);
  };

  if (isSuccess) {
    return (
      <div className="space-y-6">
        <div className="p-4 rounded-md bg-primary/10 border border-primary/20 text-primary">
          <p className="font-medium mb-2">Link został wysłany!</p>
          <p className="text-sm">
            Sprawdź swoją skrzynkę e-mail. Jeśli konto z podanym adresem istnieje, otrzymasz link do zresetowania hasła.
          </p>
        </div>

        <div className="text-center">
          <a href="/login" className="text-sm text-primary hover:underline underline-offset-4">
            Powrót do logowania
          </a>
        </div>
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
        <FormDescription>
          Podaj adres e-mail powiązany z Twoim kontem. Wyślemy Ci link do zresetowania hasła.
        </FormDescription>
      </FormItem>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Wysyłanie..." : "Wyślij link resetujący"}
      </Button>

      <div className="text-center text-sm text-muted-foreground">
        Pamiętasz hasło?{" "}
        <a href="/login" className="text-primary hover:underline underline-offset-4 font-medium">
          Zaloguj się
        </a>
      </div>
    </form>
  );
}
