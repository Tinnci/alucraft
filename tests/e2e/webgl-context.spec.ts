import { test, expect, Page } from '@playwright/test';

// Helper: Wait for a console entry that matches a string
async function waitForConsoleMessage(page: Page, substr: string, ms = 20000) {
  const found: string[] = [];
  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes(substr)) {
      found.push(text);
    }
  });
  // wait for `ms` ms and return any messages
  await page.waitForTimeout(ms);
  return found;
}

// This test expects you to run `npm run dev` in another terminal, or to configure start-server-and-test
// It loads the test route with heavy load and waits for `WebGL context lost` messages in the console.
// Note: hardware and browser configuration can affect whether a context loss occurs.

test.describe('WebGL context loss (E2E)', () => {
  test('heavy scene should exhibit WebGL contextlost logs within 20s', async ({ page }) => {
    await page.goto('http://localhost:3000/test?heavy=1&boxes=500&tex=2048', { waitUntil: 'load' });
    // Wait and capture up to 30s for the contextlost message
    const msgs = await waitForConsoleMessage(page, 'WebGL context lost on canvas; diagnostics:', 30000);
    // Log messages so CI can print them even if test fails
    for (const m of msgs) {
      console.log('[E2E Console Log]', m.slice(0, 1000));
    }

    // The test is written to validate the reproduction; it expects at least one 'contextlost' message
    expect(msgs.length).toBeGreaterThan(0);
  });
});
