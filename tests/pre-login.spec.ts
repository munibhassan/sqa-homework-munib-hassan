import { test, expect, Page } from '@playwright/test';
import { waitForResponseStabilization } from '../utils/stabilization';
import { assertAgentResponseQuality } from '../utils/deepeval-helper';


// Helper to dismiss the cookie consent banner and reload the page if cookies were not set
async function handleCookieConsentAndLoadPills(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
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

  test('Submitting a free-text question via the ASK input produces a streamed agent response', async ({ page }) => {
    // Assert 0 agent bubbles are visible initially
    const agentBubbles = page.locator('div.flex.justify-start');
    await expect(agentBubbles).toHaveCount(0);

    // Locate the ASK input textarea
    const textarea = page.locator('textarea[placeholder="ASK anything..."]');
    await expect(textarea).toBeVisible();

    // Enter free-text question
    const question = 'What is the best way to earn ASK tokens?';
    await textarea.fill(question);

    // Locate and click the send button (the button inside the input container)
    const sendButton = page.locator('div.flex.gap-2 button');
    await expect(sendButton).toBeEnabled();
    await sendButton.click();

    // Verify the first agent bubble appears and streams the response
    const responseBubble = agentBubbles.first();
    const responseText = await waitForResponseStabilization(responseBubble, 25000);
    console.log(`Received stabilized response for text query: "${responseText}"`);

    // Verify response quality using DeepEval / Structural assertions
    await assertAgentResponseQuality(question, responseText);
  });

  test('Shift+Enter creates a new line instead of sending the message', async ({ page }) => {
    // Wait for the topic pills to be visible to ensure hydration has completed
    const pills = page.locator('button.group');
    await expect(pills.first()).toBeVisible({ timeout: 10000 });

    const agentBubbles = page.locator('div.flex.justify-start');
    await expect(agentBubbles).toHaveCount(0);

    const textarea = page.locator('textarea[placeholder="ASK anything..."]');
    await expect(textarea).toBeVisible();

    await textarea.focus();
    await page.keyboard.type('Line 1');
    await page.keyboard.press('Shift+Enter');
    await page.keyboard.type('Line 2');

    const val = await textarea.inputValue();
    expect(val).toBe('Line 1\nLine 2');

    await expect(agentBubbles).toHaveCount(0);
  });

  test('Enter keypress submits the message', async ({ page }) => {
    // Wait for the topic pills to be visible to ensure hydration has completed
    const pills = page.locator('button.group');
    await expect(pills.first()).toBeVisible({ timeout: 10000 });

    const agentBubbles = page.locator('div.flex.justify-start');
    await expect(agentBubbles).toHaveCount(0);

    const textarea = page.locator('textarea[placeholder="ASK anything..."]');
    await expect(textarea).toBeVisible();

    await textarea.focus();
    await page.keyboard.type('Hello');
    await page.keyboard.press('Enter');

    const responseBubble = agentBubbles.first();
    const responseText = await waitForResponseStabilization(responseBubble, 25000);
    console.log(`Received stabilized response for Enter keypress: "${responseText}"`);

    // Verify response quality using DeepEval / Structural assertions
    await assertAgentResponseQuality('Hello', responseText);
  });

  test('Mobile viewport layout responsiveness', async ({ page }) => {
    const viewport = page.viewportSize();
    console.log(`Testing viewport: ${viewport?.width}x${viewport?.height}`);

    const pills = page.locator('button.group');
    await expect(pills.first()).toBeVisible({ timeout: 10000 });

    const textarea = page.locator('textarea[placeholder="ASK anything..."]');
    await expect(textarea).toBeVisible();
  });

  test('Clicking Sign Up navigates to the registration page', async ({ page }) => {
    const signUpBtn = page.locator('button:has-text("Sign Up")').first();
    await expect(signUpBtn).toBeVisible();
    await signUpBtn.click();

    await expect(page).toHaveURL(/.*(auth|signup|register).*/, { timeout: 10000 });
  });

  test('Clicking Log in navigates to the login page', async ({ page }) => {
    const loginBtn = page.locator('button:has-text("Log in")').first();
    await expect(loginBtn).toBeVisible();
    await loginBtn.click();

    await expect(page).toHaveURL(/.*(auth|login|signin).*/, { timeout: 10000 });
  });
});

