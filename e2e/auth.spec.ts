import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("should display login form", async ({ page }) => {
    await page.goto("/login");

    // Check for email and password inputs
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password|hasło/i)).toBeVisible();

    // Check for login button
    await expect(page.getByRole("button", { name: /login|zaloguj/i })).toBeVisible();
  });

  test("should display register form", async ({ page }) => {
    await page.goto("/register");

    // Check for registration form fields
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password|hasło/i)).toBeVisible();

    // Check for register button
    await expect(page.getByRole("button", { name: /register|zarejestruj/i })).toBeVisible();
  });

  test("should show validation error for invalid login", async ({ page }) => {
    await page.goto("/login");

    // Fill in invalid credentials
    await page.getByLabel(/email/i).fill("invalid@email.com");
    await page.getByLabel(/password|hasło/i).fill("wrongpassword");

    // Submit form
    await page.getByRole("button", { name: /login|zaloguj/i }).click();

    // Wait for error message (adjust selector based on your error display)
    await expect(page.locator("text=/error|błąd|invalid|nieprawidłow/i").first()).toBeVisible({ timeout: 5000 });
  });
});
