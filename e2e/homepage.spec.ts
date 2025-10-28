import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should display homepage and navigate to login', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');

    // Check if the page loads
    await expect(page).toHaveTitle(/GymMate/i);

    // Look for login link/button and click it
    const loginButton = page.getByRole('link', { name: /login|zaloguj/i });
    if (await loginButton.isVisible()) {
      await loginButton.click();
      
      // Verify navigation to login page
      await expect(page).toHaveURL(/.*login/);
    }
  });

  test('should have accessible navigation', async ({ page }) => {
    await page.goto('/');

    // Check for main navigation elements
    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible();
  });
});

