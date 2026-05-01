// src/videoGenerator.ts
// Playwright automation for Meta AI video generation.

import fs from 'fs';
import { Page } from 'playwright';
import {
  META_AI_URL,
  META_PROMPT_INPUT_SELECTOR,
  META_SEND_BTN_SELECTOR,
  META_VIDEO_DONE_SELECTOR,
  META_VIDEO_DOWNLOAD_SELECTOR,
  ELEMENT_TIMEOUT,
  GENERATION_TIMEOUT,
  DOWNLOAD_TIMEOUT,
} from './config';
import { Downloader } from './downloader';
import logger from './logger';

export class VideoGenerator {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async generate(
    id: number,
    imagePath: string,
    animationPrompt: string
  ): Promise<string> {
    logger.info(`[ID:${id}] Starting video generation on Meta AI`);

    if (!fs.existsSync(imagePath)) {
      throw new Error(`[ID:${id}] Image not found: ${imagePath}`);
    }

    // Bring the Meta AI tab to the foreground
    await this.page.bringToFront();

    // Step 1: Navigate to /prompt/ URL (fresh conversation every time)
    await this.page.goto(META_AI_URL, { waitUntil: 'domcontentloaded' });
    logger.debug(`[ID:${id}] Navigated to Meta AI prompt URL`);

    // Step 2: Wait for input area
    await this.page.waitForSelector(META_PROMPT_INPUT_SELECTOR, {
      timeout: ELEMENT_TIMEOUT,
    });

    // Step 3: Upload the image
    await this.uploadImage(id, imagePath);

    // Step 4: Type animation prompt with random human speed
    const promptInput = await this.page.$(META_PROMPT_INPUT_SELECTOR);
    if (!promptInput) throw new Error(`[ID:${id}] Prompt input not found`);
    
    logger.info(`[ID:${id}] Typing animation prompt...`);
    await promptInput.click();
    
    const typingDelay = Math.random() * 80 + 40;
    await this.page.keyboard.type(animationPrompt, { delay: typingDelay });
    logger.info(`[ID:${id}] Success: Prompt typed at ${Math.round(typingDelay)}ms.`);


    // Step 5: Send the message (Hit Enter)
    logger.info(`[ID:${id}] Hitting Enter to generate video...`);
    await this.page.keyboard.press('Enter');
    logger.info(`[ID:${id}] Message sent, waiting for video generation...`);


    // Step 6: Wait for video element to appear
    await this.page.waitForSelector(META_VIDEO_DONE_SELECTOR, {
      timeout: GENERATION_TIMEOUT,
    });
    logger.info(`[ID:${id}] Video generation complete`);

    // Step 7: Download the video
    return await this.downloadVideo(id);
  }

  private async uploadImage(id: number, imagePath: string): Promise<void> {
    // Try clicking upload button if present
    const uploadBtn = await this.page.$(
      "button[aria-label*='attach'], button[aria-label*='image'], button[aria-label*='upload']"
    );
    if (uploadBtn) {
      await uploadBtn.click();
      await this.page.waitForTimeout(500);
    }

    // Set file on the hidden file input
    const fileInput = await this.page.$(`input[type='file']`);
    if (fileInput) {
      await fileInput.setInputFiles(imagePath);
      logger.info(`[ID:${id}] Image uploaded: ${imagePath}`);
    } else {
      logger.warn(`[ID:${id}] No file input found - image upload may fail`);
    }
    await this.page.waitForTimeout(1000);
  }

  private async downloadVideo(id: number): Promise<string> {
    const downloadBtn = await this.page.waitForSelector(
      META_VIDEO_DOWNLOAD_SELECTOR,
      { timeout: ELEMENT_TIMEOUT }
    );

    const [download] = await Promise.all([
      this.page.waitForEvent('download', { timeout: DOWNLOAD_TIMEOUT }),
      downloadBtn!.click(),
    ]);

    return await Downloader.saveVideo(download, id);
  }
}
