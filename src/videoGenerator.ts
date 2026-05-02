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

    // Step 1: Navigate to /prompt/ URL (only if not already there)
    if (this.page.url() !== META_AI_URL) {
      logger.debug(`[ID:${id}] Navigating to Meta AI prompt URL...`);
      await this.page.goto(META_AI_URL, { waitUntil: 'domcontentloaded' });
    } else {
      logger.info(`[ID:${id}] Already on Meta AI, skipping navigation.`);
    }

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
    
    logger.info(`[ID:${id}] Typing animation prompt with human-like rhythm...`);
    await this.humanType(animationPrompt);
    logger.info(`[ID:${id}] Success: Prompt typed.`);



    // Step 5: Send the message (Hit Enter)
    logger.info(`[ID:${id}] Hitting Enter to generate video...`);
    await this.page.keyboard.press('Enter');
    
    // Wait 20s before scrolling
    logger.info(`[ID:${id}] Waiting 20s before scrolling...`);
    await this.page.waitForTimeout(20_000);

    // Scroll to bottom human-style
    logger.info(`[ID:${id}] Scrolling to bottom human-style and finishing stabilization wait (50s)...`);
    await this.humanScroll();
    await this.page.waitForTimeout(50_000);


    logger.info(`[ID:${id}] Wait complete. Checking for video...`);




    // Step 6: Wait for video element to appear
    await this.page.waitForSelector(META_VIDEO_DONE_SELECTOR, {
      timeout: GENERATION_TIMEOUT,
    });
    logger.info(`[ID:${id}] Video generation complete`);

    // Step 7: Download the video
    return await this.downloadVideo(id);
  }

  private async uploadImage(id: number, imagePath: string): Promise<void> {
    // Set file directly on the hidden file input without clicking the button
    // This prevents the OS-level file picker dialog from opening.
    const fileInput = await this.page.$(`input[type='file']`);
    if (fileInput) {
      await fileInput.setInputFiles(imagePath);
      logger.info(`[ID:${id}] Image uploaded directly to file input: ${imagePath}`);
    } else {
      logger.warn(`[ID:${id}] No file input found - trying fallback click...`);
      // Fallback: only click if no input is found (rare)
      const uploadBtn = await this.page.$(
        "button[aria-label*='attach'], button[aria-label*='image'], button[aria-label*='upload']"
      );
      if (uploadBtn) await uploadBtn.click();
    }
    await this.page.waitForTimeout(1000);
  }


  private async downloadVideo(id: number): Promise<string> {
    logger.info(`[ID:${id}] Step 7: Downloading video...`);

    // Find all media items/videos
    const videos = await this.page.$$(META_VIDEO_DONE_SELECTOR);
    if (!videos.length) {
      throw new Error(`[ID:${id}] No video elements found for download.`);
    }

    // Hover over the last one to show the download button
    const latestVideo = videos[videos.length - 1];
    logger.info(`[ID:${id}] Scrolling video into view and hovering...`);
    await latestVideo.scrollIntoViewIfNeeded();
    await latestVideo.hover();

    
    // Small wait for UI to respond to hover
    await this.page.waitForTimeout(1000);

    // Find and click the download button (pick the last one if multiple exist)
    const downloadBtns = await this.page.$$(META_VIDEO_DOWNLOAD_SELECTOR);
    if (!downloadBtns.length) {
      throw new Error(`[ID:${id}] Download button did not appear after hover.`);
    }

    const latestDownloadBtn = downloadBtns[downloadBtns.length - 1];
    logger.info(`[ID:${id}] Clicking download button...`);

    const [download] = await Promise.all([
      this.page.waitForEvent('download', { timeout: DOWNLOAD_TIMEOUT }),
      latestDownloadBtn.click(),
    ]);

    const path = await Downloader.saveVideo(download, id);
    logger.info(`[ID:${id}] SUCCESS: Video saved to: ${path}`);
    return path;
  }

  private async humanType(text: string): Promise<void> {
    for (const char of text) {
      await this.page.keyboard.type(char, { delay: 0 });
      // Rhythmic typing: longer pause for punctuation/spaces
      const pause = [' ', '.', ',', '!'].includes(char)
        ? Math.random() * 300 + 150
        : Math.random() * 80 + 30;
      await this.page.waitForTimeout(pause);
    }
  }

  private async humanMoveAndClick(selector: string): Promise<void> {
    const element = await this.page.waitForSelector(selector);
    const box = await element.boundingBox();
    if (box) {
      const centerX = box.x + box.width / 2;
      const centerY = box.y + box.height / 2;
      
      // Perform 2-3 random jitter movements near the target
      const jitters = Math.floor(Math.random() * 2) + 2;
      for (let i = 0; i < jitters; i++) {
        await this.page.mouse.move(
          centerX + (Math.random() * 40 - 20),
          centerY + (Math.random() * 40 - 20),
          { steps: 5 }
        );
        await this.page.waitForTimeout(Math.random() * 150 + 50);
      }
      
      await this.page.mouse.click(centerX, centerY);
    } else {
      await element.click();
    }
  }

  private async humanScroll(): Promise<void> {
    const scrollHeight = (await this.page.evaluate("document.body.scrollHeight")) as number;
    let current = 0;

    while (current < scrollHeight) {
      const step = Math.floor(Math.random() * 300) + 100;
      current += step;
      await this.page.evaluate(`window.scrollTo(0, ${current})`);
      await this.page.waitForTimeout(Math.random() * 500 + 200);
    }
  }

}

