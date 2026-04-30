// src/imageGenerator.ts
// Playwright automation for Google Flow image generation.

import { Page } from 'playwright';
import {
  FLOW_URL,
  FLOW_PROMPT_INPUT_SELECTOR,
  FLOW_GENERATE_BTN_SELECTOR,
  FLOW_DONE_INDICATOR,
  FLOW_DOWNLOAD_BTN_SELECTOR,
  ELEMENT_TIMEOUT,
  GENERATION_TIMEOUT,
  DOWNLOAD_TIMEOUT,
} from './config';
import { Downloader } from './downloader';
import logger from './logger';

export class ImageGenerator {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async generate(id: number, imagePrompt: string): Promise<string> {
    logger.info(`[ID:${id}] Starting image generation on Google Flow`);

    // Step 1: Navigate to persistent project URL
    await this.page.goto(FLOW_URL, { waitUntil: 'domcontentloaded' });
    logger.debug(`[ID:${id}] Navigated to Flow project URL`);

    // Step 2: Wait for prompt input
    await this.page.waitForSelector(FLOW_PROMPT_INPUT_SELECTOR, {
      timeout: ELEMENT_TIMEOUT,
    });

    // Step 3: Fill the prompt
    const promptInput = await this.page.$(FLOW_PROMPT_INPUT_SELECTOR);
    if (!promptInput) throw new Error(`[ID:${id}] Prompt input not found`);
    await promptInput.click();
    await promptInput.fill('');
    await promptInput.fill(imagePrompt);
    logger.debug(`[ID:${id}] Prompt typed: ${imagePrompt.slice(0, 60)}...`);

    // Step 4: Click Generate
    const generateBtn = await this.page.waitForSelector(
      FLOW_GENERATE_BTN_SELECTOR,
      { timeout: ELEMENT_TIMEOUT }
    );
    await generateBtn!.click();
    logger.info(`[ID:${id}] Generate clicked, waiting for result...`);

    // Step 5: Wait for generated image to appear
    await this.page.waitForSelector(FLOW_DONE_INDICATOR, {
      timeout: GENERATION_TIMEOUT,
    });
    logger.info(`[ID:${id}] Image generation complete`);

    // Step 6: Download latest image
    return await this.downloadLatestImage(id);
  }

  private async downloadLatestImage(id: number): Promise<string> {
    const downloadBtns = await this.page.$$(FLOW_DOWNLOAD_BTN_SELECTOR);
    if (!downloadBtns.length) {
      throw new Error(`[ID:${id}] No download button found after generation`);
    }
    // Last button = most recently generated image
    const latestBtn = downloadBtns[downloadBtns.length - 1];

    const [download] = await Promise.all([
      this.page.waitForEvent('download', { timeout: DOWNLOAD_TIMEOUT }),
      latestBtn.click(),
    ]);

    return await Downloader.saveImage(download, id);
  }
}
