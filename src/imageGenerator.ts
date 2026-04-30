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

    // Bring the tab to the foreground
    await this.page.bringToFront();

    // Step 1: Navigate to persistent project URL

    logger.debug(`[ID:${id}] Navigating to: ${FLOW_URL}`);
    await this.page.goto(FLOW_URL, { waitUntil: 'domcontentloaded' });
    logger.info(`[ID:${id}] Page loaded: ${this.page.url()}`);

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
    
    // Type the new prompt
    await this.page.keyboard.type(imagePrompt, { delay: 20 });
    logger.info(`[ID:${id}] Success: Prompt typed via keyboard.`);


    // Step 4: Click Generate
    logger.debug(`[ID:${id}] Waiting for Generate button: ${FLOW_GENERATE_BTN_SELECTOR}`);
    const generateBtn = await this.page.waitForSelector(
      FLOW_GENERATE_BTN_SELECTOR,
      { timeout: ELEMENT_TIMEOUT }
    );
    logger.info(`[ID:${id}] Found Generate button! Clicking now...`);
    await generateBtn!.click();

    // Step 5: Wait for generated image to appear
    logger.info(`[ID:${id}] Generate clicked. Waiting up to ${GENERATION_TIMEOUT/1000}s for image...`);
    await this.page.waitForSelector(FLOW_DONE_INDICATOR, {
      timeout: GENERATION_TIMEOUT,
    });
    logger.info(`[ID:${id}] Image appeared! generation complete.`);

    // Step 6: Download latest image
    return await this.downloadLatestImage(id);
  }


  private async downloadLatestImage(id: number): Promise<string> {
    logger.debug(`[ID:${id}] Searching for download buttons: ${FLOW_DOWNLOAD_BTN_SELECTOR}`);
    const downloadBtns = await this.page.$$(FLOW_DOWNLOAD_BTN_SELECTOR);
    
    if (!downloadBtns.length) {
      throw new Error(`[ID:${id}] No download button found after generation. Selector: ${FLOW_DOWNLOAD_BTN_SELECTOR}`);
    }
    
    logger.info(`[ID:${id}] Found ${downloadBtns.length} download button(s). Choosing the last one...`);
    const latestBtn = downloadBtns[downloadBtns.length - 1];

    logger.info(`[ID:${id}] Clicking download...`);
    const [download] = await Promise.all([
      this.page.waitForEvent('download', { timeout: DOWNLOAD_TIMEOUT }),
      latestBtn.click(),
    ]);

    const path = await Downloader.saveImage(download, id);
    logger.info(`[ID:${id}] Image saved to: ${path}`);
    return path;
  }

}
