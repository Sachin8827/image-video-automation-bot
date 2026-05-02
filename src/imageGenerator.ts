// src/imageGenerator.ts
// Playwright automation for Google Flow image generation.

import { Page } from 'playwright';
import {
  FLOW_URL,
  FLOW_PROMPT_INPUT_SELECTOR,
  FLOW_GENERATE_BTN_SELECTOR,
  FLOW_DONE_INDICATOR,
  FLOW_DOWNLOAD_BTN_SELECTOR,
  FLOW_MODAL_DOWNLOAD_BTN,
  FLOW_QUALITY_1K_BTN,
  FLOW_BACK_BTN_SELECTOR,
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

    // Bring the tab to the foreground
    await this.page.bringToFront();

    // Step 1: Navigate to persistent project URL (only if not already there)
    if (this.page.url() !== FLOW_URL) {
      logger.debug(`[ID:${id}] Navigating to: ${FLOW_URL}`);
      await this.page.goto(FLOW_URL, { waitUntil: 'domcontentloaded' });
      logger.info(`[ID:${id}] Page loaded: ${this.page.url()}`);
    } else {
      logger.info(`[ID:${id}] Already on Flow page, skipping navigation.`);
    }


    // Step 2: Wait for prompt input
    logger.debug(`[ID:${id}] Waiting for prompt input: ${FLOW_PROMPT_INPUT_SELECTOR}`);
    await this.page.waitForSelector(FLOW_PROMPT_INPUT_SELECTOR, {
      timeout: ELEMENT_TIMEOUT,
    });
    logger.info(`[ID:${id}] Found prompt input!`);

    // Step 3: Fill the prompt
    const promptInput = await this.page.$(FLOW_PROMPT_INPUT_SELECTOR);
    if (!promptInput) throw new Error(`[ID:${id}] Prompt input selector failed to return element`);

    logger.info(`[ID:${id}] Clicking and typing into Slate editor...`);
    await promptInput.click();

    // Clear existing text first (Control+A + Backspace)
    await this.page.keyboard.press('Control+A');
    await this.page.keyboard.press('Backspace');

    // Type the new prompt with random human-like speed (40-120ms per char)
    const typingDelay = Math.random() * 80 + 40;
    await this.page.keyboard.type(imagePrompt, { delay: typingDelay });
    logger.info(`[ID:${id}] Success: Prompt typed with ${Math.round(typingDelay)}ms speed.`);



    // Step 4: Click Generate (but count images first!)
    const initialImageCount = (await this.page.$$(FLOW_DONE_INDICATOR)).length;
    logger.info(`[ID:${id}] Current image count: ${initialImageCount}. Waiting for a new one...`);

    logger.debug(`[ID:${id}] Waiting for Generate button: ${FLOW_GENERATE_BTN_SELECTOR}`);
    const generateBtn = await this.page.waitForSelector(
      FLOW_GENERATE_BTN_SELECTOR,
      { timeout: ELEMENT_TIMEOUT }
    );
    logger.info(`[ID:${id}] Found Generate button! Clicking now...`);
    await generateBtn!.click();

    // Step 5: Wait for a NEW generated image to appear
    logger.info(`[ID:${id}] Generate clicked. Waiting up to ${GENERATION_TIMEOUT / 1000}s for a new image...`);

    // Custom wait: Wait until the count of images increases
    await this.page.waitForFunction(
      "({ selector, initialCount }) => document.querySelectorAll(selector).length > initialCount",
      { selector: FLOW_DONE_INDICATOR, initialCount: initialImageCount },
      { timeout: GENERATION_TIMEOUT }
    );



    const finalImageCount = (await this.page.$$(FLOW_DONE_INDICATOR)).length;
    logger.info(`[ID:${id}] New image detected! (Total: ${finalImageCount}).`);

    logger.info(`[ID:${id}] Waiting 70 seconds for image to stabilize before download...`);
    await this.page.waitForTimeout(70_000); 
    logger.info(`[ID:${id}] Wait complete. Starting download.`);



    // Step 6: Download latest image
    return await this.downloadLatestImage(id);
  }



  private async downloadLatestImage(id: number): Promise<string> {
    logger.info(`[ID:${id}] Step 1: Clicking the newest image tile (index 0)...`);
    const tiles = await this.page.$$(FLOW_DONE_INDICATOR);
    if (!tiles.length) throw new Error(`[ID:${id}] No image tiles found to click.`);

    // Click the FIRST tile (newest generation appears at the top/start)
    await tiles[0].click();


    logger.info(`[ID:${id}] Step 2 & 3: Waiting for modal and clicking Download button...`);
    const modalDownloadBtn = await this.page.waitForSelector(FLOW_MODAL_DOWNLOAD_BTN, {
      timeout: ELEMENT_TIMEOUT,
    });
    await modalDownloadBtn!.click();

    logger.info(`[ID:${id}] Step 4 & 5: Selecting 1K quality...`);
    const qualityBtn = await this.page.waitForSelector(FLOW_QUALITY_1K_BTN, {
      timeout: ELEMENT_TIMEOUT,
    });

    logger.info(`[ID:${id}] Clicking 1K and starting actual download...`);
    const [download] = await Promise.all([
      this.page.waitForEvent('download', { timeout: DOWNLOAD_TIMEOUT }),
      qualityBtn!.click(),
    ]);

    const path = await Downloader.saveImage(download, id);
    logger.info(`[ID:${id}] SUCCESS: Image saved to: ${path}`);

    logger.info(`[ID:${id}] Clicking Back to return to project view...`);
    const backBtn = await this.page.waitForSelector(FLOW_BACK_BTN_SELECTOR, {
      timeout: ELEMENT_TIMEOUT,
    });
    await backBtn!.click();

    return path;

  }


}
