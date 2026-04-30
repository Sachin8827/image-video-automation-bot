/**
 * src/setup_auth.ts - ONE-TIME manual login script (TypeScript)
 *
 * Run ONCE before using bot.ts for the first time.
 * Opens a visible browser so you can log into:
 *   1. Google (for Google Flow)
 *   2. Meta AI (for video generation)
 *
 * Session saved to user-data/ and reused automatically by bot.ts.
 * Re-run if Google/Meta force a re-login (~30-90 days).
 *
 * Usage:
 *   npx ts-node src/setup_auth.ts
 *   npm run setup-auth
 */

import { chromium } from 'playwright';
import * as readline from 'readline';
import { USER_DATA_DIR, FLOW_URL, META_AI_URL, BROWSER_CHANNEL } from './config';

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans); }));
}

async function main(): Promise<void> {
  console.log('='.repeat(60));
  console.log('  IMAGE-VIDEO BOT  |  ONE-TIME AUTH SETUP (TypeScript)');
  console.log('='.repeat(60));
  console.log(`  Session will be saved to: ${USER_DATA_DIR}/`);
  console.log('');

  const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
    headless: false,
    slowMo: 100,
    channel: BROWSER_CHANNEL as any,
    ignoreDefaultArgs: ['--enable-automation'],
    args: ['--disable-blink-features=AutomationControlled']
  });

  const page = await context.newPage();

  // Step 1: Google login
  console.log('[Step 1/2]  Opening Google Flow...');
  await page.goto(FLOW_URL);
  await prompt(
    '  -> Log into your Google account in the browser.\n' +
    '  -> Press ENTER once logged in and you can see the Flow project: '
  );
  console.log('  Google login saved.');
  console.log('');

  // Step 2: Meta AI login
  console.log('[Step 2/2]  Opening Meta AI...');
  await page.goto(META_AI_URL);
  await prompt(
    '  -> Log into your Meta / Facebook account in the browser.\n' +
    '  -> Press ENTER once logged in and you can see the Meta AI prompt: '
  );
  console.log('  Meta AI login saved.');
  console.log('');

  await context.close();

  console.log('='.repeat(60));
  console.log('  Auth setup complete!');
  console.log(`  Session saved to: ${USER_DATA_DIR}/`);
  console.log('  You can now run: npm run dev');
  console.log('='.repeat(60));
}

main().catch((err) => {
  console.error('Setup failed:', err);
  process.exit(1);
});
