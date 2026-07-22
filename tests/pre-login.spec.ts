import { test, expect, Page } from '@playwright/test';
import { waitForResponseStabilization } from '../utils/stabilization';
import { assertAgentResponseQuality } from '../utils/deepeval-helper';


// Helper to dismiss the cookie consent banner and reload the page if cookies were not set
async function handleCookieConsentAndLoadPills(page: Page) {
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

    test('Page loads and suggested topic pills are visible', async ({ page }) => {
    const pills = page.locator('button.group');
    await expect(pills.first()).toBeVisible({ timeout: 10000 });
    
    const count = await pills.count();
    expect(count).toBeGreaterThan(0);
    
    const topics: string[] = [];
    for (let i = 0; i < count; i++) {
      topics.push(await pills.nth(i).innerText());
    }
    console.log('Verified suggested topics:', topics);
    
    expect(topics).toContain('What is Permission');
    expect(topics).toContain('Permission Wallet');
  });
  
  test('Clicking a suggested topic produces a streamed agent response', async ({ page }) => {
    const pills = page.locator('button.group');
    await expect(pills.first()).toBeVisible({ timeout: 10000 });
    
    // Select the first pill (usually "What is Permission")
    const targetPill = pills.first();
    const pillText = await targetPill.innerText();
    console.log(`Clicking pill: "${pillText}"`);
    
    // Assert exactly 0 agent message bubbles are present before clicking
    const agentBubbles = page.locator('div.flex.justify-start');
    await expect(agentBubbles).toHaveCount(0);
    
    // Click the pill
    await targetPill.click();
    
    // Now there should be the first agent bubble for the response
    const responseBubble = agentBubbles.first();
    
    // Wait for the response to stabilize using our dynamic utility
    const responseText = await waitForResponseStabilization(responseBubble, 25000);
    console.log(`Received stabilized response for pill: "${responseText}"`);
    
    // Verify response quality using DeepEval / Structural assertions
    await assertAgentResponseQuality(pillText, responseText);
  });
});

