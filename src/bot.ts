#!/usr/bin/env ts-node
/**
 * src/bot.ts - Main entry point for Image & Video Automation Bot (TypeScript)
 *
 * Usage:
 *   npx ts-node src/bot.ts           # Run full pipeline
 *   npx ts-node src/bot.ts --dry-run # Validate prompts only
 *   npm run dev                      # Same as above via npm script
 *
 * First time setup:
 *   npx ts-node src/setup_auth.ts    # One-time login
 */

import { WorkflowEngine } from './workflowEngine';
import { PromptLoader } from './promptLoader';
import logger from './logger';

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

async function main(): Promise<void> {
  if (isDryRun) {
    // Dry run: just load and display prompts
    const loader = new PromptLoader();
    const prompts = loader.loadAll();
    logger.info(`Dry run -- ${prompts.length} prompt(s) loaded from prompts.json`);
    for (const p of prompts) {
      logger.info(
        `  ID ${String(p.id).padStart(3)} | ` +
        `img=${p.image_status.padEnd(12)} | ` +
        `vid=${p.video_status.padEnd(12)} | ` +
        `prompt=${p.image_prompt.slice(0, 50)}...`
      );
    }
    return;
  }

  // Full automation run
  const engine = new WorkflowEngine();
  try {
    await engine.run();
  } catch (err) {
    logger.error(`Unhandled error: ${err}`);
    process.exit(1);
  }
}

process.on('SIGINT', () => {
  logger.warn('Bot interrupted by user (Ctrl+C)');
  process.exit(0);
});

main();
