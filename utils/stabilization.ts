import { Locator } from '@playwright/test';

/**
 * Polls the locator's innerText and waits for it to stop changing (stabilize).
 * Ignores the initial "typing..." indicator text.
 */
export async function waitForResponseStabilization(
  locator: Locator,
  timeoutMs = 25000,
  pollIntervalMs = 800
): Promise<string> {
  const page = locator.page();
  
  // 1. Wait for the response container to become visible in the DOM
  await locator.waitFor({ state: 'visible', timeout: timeoutMs });
  
  let prevText = '';
  const startTime = Date.now();
  
  // 2. Poll the text content until it remains unchanged between intervals
  while (Date.now() - startTime < timeoutMs) {
    const currentText = await locator.innerText();
    
    // If the text is empty or is still showing the initial typing placeholder, do not count as stabilized
    const isTyping = currentText.toLowerCase().includes('typing...') || currentText.trim().length === 0;
    
    if (!isTyping && currentText === prevText) {
      // Do a quick double check after a short wait to ensure streaming didn't just pause briefly
      await page.waitForTimeout(500);
      const doubleCheckText = await locator.innerText();
      if (doubleCheckText === currentText) {
        return currentText;
      }
    }
    
    prevText = currentText;
    await page.waitForTimeout(pollIntervalMs);
  }
  
  throw new Error(`Response text did not stabilize within ${timeoutMs}ms (Final text: "${await locator.innerText()}")`);
}
