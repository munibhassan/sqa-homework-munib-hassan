import { test, expect } from '@playwright/test';
// Helper to dismiss the cookie consent banner and reload the page if cookies were not set
async function handleCookieConsentAndLoadPills(page) {
  await page.goto('/');
  const rejectBtn = page.locator('#onetrust-reject-all-handler');
  try {
    await rejectBtn.waitFor({ state: 'visible', timeout: 5000 });
    await rejectBtn.click();
    await page.waitForTimeout(1000);
    await page.reload();
  } catch (e) {
    const pills = page.locator('button.group');
    if (await pills.count() === 0) {
      await page.reload();
    }
  }
}

test.describe('Pre-Login Experience - Landing Page & Chat Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await handleCookieConsentAndLoadPills(page);
  });
});
