/**
 * E2E test — home page loads and shows hero
 */
import { test, expect } from '@playwright/test';

test('home page loads successfully', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
  // Should show one of the hero CTAs
  await expect(page.getByText(/Boilerplate/i)).toBeVisible();
});

test('login page is accessible from home', async ({ page }) => {
  await page.goto('/');
  // Click on the first sign in / login link
  const loginLink = page.getByRole('link', { name: /sign in|تسجيل الدخول/i }).first();
  await loginLink.click();
  await expect(page).toHaveURL(/\/auth\/login/);
});

test('login page renders the form', async ({ page }) => {
  await page.goto('/auth/login');
  await expect(page.getByLabel(/email|البريد/i)).toBeVisible();
  await expect(page.getByLabel(/password|كلمة المرور/i)).toBeVisible();
});
