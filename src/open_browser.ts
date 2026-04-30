/**
 * src/open_browser.ts - Manage your browser session (Manual Login)
 *
 * Use this to:
 *   1. Log into Google Flow
 *   2. Log into Meta AI
 *   3. Check your credits/history manually
 *
 * Usage:
 *   npx ts-node src/open_browser.ts
 */

import { chromium } from 'playwright';
import { USER_DATA_DIR, FLOW_URL, META_AI_URL, BROWSER_CHANNEL } from './config';

async function main() {
  console.log('='.repeat(60));
  console.log('  OPENING PERSISTENT CHROME BROWSER');
  console.log('  Session data will be saved to: ' + USER_DATA_DIR);
  console.log('='.repeat(60));
  console.log('  -> Log into Google and Meta AI in the windows that open.');
  console.log('  -> Close the browser window when you are done.');
  console.log('='.repeat(60));

  const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
    headless: false,
    channel: BROWSER_CHANNEL as any,
    viewport: null, 
    ignoreDefaultArgs: ['--enable-automation'], // Hide the "Controlled by automation" bar
    args: [
      '--start-maximized',
      '--disable-blink-features=AutomationControlled' // Bypass Google's detection
    ]
  });

  // Open Google Flow
  const page1 = await context.newPage();
  await page1.goto(FLOW_URL);

  // Open Meta AI
  const page2 = await context.newPage();
  await page2.goto(META_AI_URL);

  // Close the initial blank page if it exists
  const pages = context.pages();
  if (pages.length > 2) {
    await pages[0].close();
  }

  // Keep the script running until the browser is closed
  context.on('close', () => {
    console.log('Browser closed. Session saved.');
    process.exit(0);
  });

  console.log('\nWaiting for you to finish... (Close the browser window to exit)');
}

main().catch((err) => {
  console.error('Failed to open browser:', err);
  process.exit(1);
});
