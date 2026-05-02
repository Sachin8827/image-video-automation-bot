// src/workflowEngine.ts
// Orchestrates the full image -> video pipeline using Playwright.

import { chromium } from 'playwright-extra';
import { BrowserContext, Page } from 'playwright';
import stealth from 'puppeteer-extra-plugin-stealth';


// Use stealth plugin
chromium.use(stealth());

import { USER_DATA_DIR, HEADLESS, SLOW_MO_MS, RETRY_DELAY_MS, BROWSER_CHANNEL } from './config';
import { PromptLoader, Prompt } from './promptLoader';
import { StatusTracker } from './statusTracker';
import { ImageGenerator } from './imageGenerator';
import { VideoGenerator } from './videoGenerator';
import { Downloader } from './downloader';
import logger from './logger';

export class WorkflowEngine {
  private context: BrowserContext | null = null;
  private flowPage: Page | null = null;
  private metaPage: Page | null = null;
  private loader = new PromptLoader();
  private tracker = new StatusTracker();
  private sessionCounter = 0;
  private readonly PROMPTS_BEFORE_BREAK = 5;


  private async startBrowser(): Promise<void> {
    this.context = await chromium.launchPersistentContext(USER_DATA_DIR, {
      headless: HEADLESS,
      slowMo: SLOW_MO_MS,
      acceptDownloads: true,
      channel: BROWSER_CHANNEL,
      ignoreDefaultArgs: ['--enable-automation'],
      args: [
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    });


    // Hardening: Inject deep stealth scripts via string to bypass TS compiler
    await this.context.addInitScript(`
      // 1. Hide webdriver
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });

      // 2. Fake chrome.runtime
      window.chrome = { runtime: {}, loadTimes: () => {}, csi: () => {} };

      // 3. Spoof plugins & mimeTypes
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, 'mimeTypes', { get: () => [1, 2, 3, 4, 5] });

      // 4. Override permissions query
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) =>
        parameters.name === 'notifications'
          ? Promise.resolve({ state: Notification.permission })
          : originalQuery(parameters);

      // 5. Spoof WebGL renderer (Intel Iris)
      const getParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function(parameter) {
        if (parameter === 37445) return 'Intel Inc.';
        if (parameter === 37446) return 'Intel Iris OpenGL Engine';
        return getParameter.call(this, parameter);
      };
    `);


    // Reuse the first tab that Chrome opens automatically
    const pages = this.context.pages();
    this.flowPage = pages.length > 0 ? pages[0] : await this.context.newPage();

    // Open a second tab for Meta (even though we have it commented out, this keeps the structure)
    this.metaPage = await this.context.newPage();

    logger.info('Browser launched with stealth hardening.');
  }



  private async stopBrowser(): Promise<void> {
    if (this.context) {
      await this.context.close();
      logger.info('Browser closed');
    }
  }

  private async runImageStep(prompt: Prompt): Promise<string> {
    const { id, image_prompt } = prompt;
    const generator = new ImageGenerator(this.flowPage!);
    this.tracker.setImageInProgress(id);
    try {
      const imagePath = await generator.generate(id, image_prompt);
      this.tracker.setImageSuccess(id, imagePath);
      return imagePath;
    } catch (err) {
      const msg = String(err);
      logger.error(`[ID:${id}] Image error: ${msg}`);
      this.tracker.setImageFailed(id, msg);
      throw err;
    }
  }

  private async runVideoStep(prompt: Prompt, imagePath: string): Promise<void> {
    const { id, animation_prompt } = prompt;
    const generator = new VideoGenerator(this.metaPage!);
    this.tracker.setVideoInProgress(id);
    try {
      const videoPath = await generator.generate(id, imagePath, animation_prompt);
      this.tracker.setVideoSuccess(id, videoPath);
    } catch (err) {
      const msg = String(err);
      logger.error(`[ID:${id}] Video error: ${msg}`);
      this.tracker.setVideoFailed(id, msg);
      throw err;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async processAll(): Promise<void> {
    // Phase 1: Image generation
    const imagePrompts = this.loader.getPendingImagePrompts();
    if (imagePrompts.length) {
      logger.info(`Phase 1: ${imagePrompts.length} image(s) to generate`);
      for (const prompt of imagePrompts) {
        try {
          await this.runImageStep(prompt);
        } catch {
          logger.warn(`[ID:${prompt.id}] Skipping video (image failed)`);
          continue;
        }

        // --- Session Rate Limiting ---
        this.sessionCounter++;
        if (this.sessionCounter >= this.PROMPTS_BEFORE_BREAK) {
          const breakMinutes = Math.floor(Math.random() * 3) + 3; // 3-5 mins
          logger.info(`[SESSION] Reached ${this.PROMPTS_BEFORE_BREAK} prompts. Taking a human break for ${breakMinutes} minutes...`);
          await this.sleep(breakMinutes * 60 * 1000);
          this.sessionCounter = 0;
          logger.info('[SESSION] Break over. Resuming automation...');
        }

        // Hardening: Random delay between prompts (10-25s)
        const delay = Math.floor(Math.random() * 15_000) + 10_000;
        logger.info(`Waiting ${delay / 1000}s before next prompt to remain stealthy...`);
        await this.sleep(delay);

      }

    } else {
      logger.info('Phase 1: No pending image tasks');
    }

    // Phase 2: Video generation
    const videoPrompts = this.loader.getPendingVideoPrompts();
    if (videoPrompts.length) {
      logger.info(`Phase 2: ${videoPrompts.length} video(s) to generate`);
      for (const prompt of videoPrompts) {
        const imagePath = prompt.image_path || Downloader.getImagePath(prompt.id);
        try {
          await this.runVideoStep(prompt, imagePath);

          // --- Session Rate Limiting ---
          this.sessionCounter++;
          if (this.sessionCounter >= this.PROMPTS_BEFORE_BREAK) {
            const breakMinutes = Math.floor(Math.random() * 3) + 3; // 3-5 mins
            logger.info(`[SESSION] Reached ${this.PROMPTS_BEFORE_BREAK} prompts. Taking a human break for ${breakMinutes} minutes...`);
            await this.sleep(breakMinutes * 60 * 1000);
            this.sessionCounter = 0;
            logger.info('[SESSION] Break over. Resuming automation...');
          }

          // Hardening: Random delay between prompts (10-25s)
          const delay = Math.floor(Math.random() * 15_000) + 10_000;
          logger.info(`Waiting ${delay / 1000}s before next video prompt to remain stealthy...`);
          await this.sleep(delay);
        } catch {
          logger.warn(`[ID:${prompt.id}] Video step failed, moving to next`);
          await this.sleep(RETRY_DELAY_MS);
        }

      }
    } else {
      logger.info('Phase 2: No pending video tasks');
    }


  }

  async run(): Promise<void> {
    logger.info('='.repeat(60));
    logger.info('IMAGE-VIDEO AUTOMATION BOT  |  Starting...');
    logger.info('='.repeat(60));
    await this.startBrowser();
    try {
      await this.processAll();
    } finally {
      await this.stopBrowser();
    }
    this.tracker.printSummary();
  }
}
