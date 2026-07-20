import { test, expect } from '@playwright/test';

test.describe('E2E Landing Page Navigation Checks', () => {
  test('should display landing page layout and brand title', async ({ page }) => {
    // Navigate to the client index
    await page.goto('/');
    
    // Check if the ShopSphere branding text is visible on the header
    const branding = page.locator('text=ShopSphere');
    await expect(branding.first()).toBeVisible();
  });
});
