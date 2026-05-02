// src/config.ts
// Central configuration for image-video-automation-bot (TypeScript)

import path from 'path';
import fs from 'fs';

// ------------------------------------------------------------------
// Browser / Playwright settings
// ------------------------------------------------------------------
export const HEADLESS: boolean = false;
export const SLOW_MO_MS: number = 50;

// Local folder to store your bot's login session
// This keeps the bot separate from your personal Chrome so it won't crash!
export const USER_DATA_DIR: string = path.resolve(process.cwd(), 'user-data');
export const BROWSER_CHANNEL: string = 'chrome';



// ------------------------------------------------------------------
// Target URLs (your exact project/prompt URLs)
// ------------------------------------------------------------------
export const FLOW_URL: string =
  'https://labs.google/fx/tools/flow/project/35e24640-8b62-415e-955b-d1643edd62d5';
export const META_AI_URL: string =
  'https://www.meta.ai/prompt/bd583c98-586e-4f30-8b60-c3cf6cd4de9e';

//535bbc8e-1e32-4542-ba0e-93cc266a9f3d flow
//ebb2627f-c66c-4aca-b946-2f6075ef9804 meta

// ------------------------------------------------------------------


// File & folder paths
// ------------------------------------------------------------------
export const PROMPTS_FILE: string = 'prompts.json';
export const IMAGES_DIR: string = 'images';
export const VIDEOS_DIR: string = 'videos';
export const LOGS_DIR: string = 'logs';

// ------------------------------------------------------------------
// Retry & timeout settings
// ------------------------------------------------------------------
export const MAX_RETRIES: number = 3;
export const RETRY_DELAY_MS: number = 5000;
export const ELEMENT_TIMEOUT: number = 30_000;
export const GENERATION_TIMEOUT: number = 180_000;
export const DOWNLOAD_TIMEOUT: number = 60_000;

// ------------------------------------------------------------------
// Google Flow selectors (update if UI changes)
// ------------------------------------------------------------------
export const FLOW_PROMPT_INPUT_SELECTOR: string =
  'div[data-slate-editor="true"], div[role="textbox"]';

export const FLOW_GENERATE_BTN_SELECTOR: string =
  "button:has(i:has-text('arrow_forward'))";

export const FLOW_DONE_INDICATOR: string =
  "div[data-tile-id] img[alt='Generated image']";

export const FLOW_MODAL_DOWNLOAD_BTN: string =
  "button:has-text('Download'), button:has(i:has-text('download'))";

export const FLOW_QUALITY_1K_BTN: string =
  "button[role='menuitem']:has-text('1K')";

export const FLOW_BACK_BTN_SELECTOR: string =
  "button:has-text('Back'), button:has(i:has-text('arrow_back'))";

export const FLOW_DOWNLOAD_BTN_SELECTOR: string =

  "button[aria-label*='Download'], button[title*='Download']";


// ------------------------------------------------------------------
// Meta AI selectors (update if UI changes)
// ------------------------------------------------------------------
export const META_PROMPT_INPUT_SELECTOR: string =
  "[data-testid='composer-input']:visible, div[contenteditable='true']:visible, [placeholder*='Describe']:visible";



export const META_UPLOAD_BTN_SELECTOR: string =
  "input[type='file'], button[aria-label*='attach']";
export const META_SEND_BTN_SELECTOR: string =
  "button[aria-label*='Send'], button[type='submit']";
export const META_VIDEO_DONE_SELECTOR: string =
  "a[aria-label='View media'], div[data-testid='generated-video'], div.group\\/media-item";

export const META_VIDEO_DOWNLOAD_SELECTOR: string =
  "button[aria-label='Download']";


// ------------------------------------------------------------------
// Ensure output directories exist at import time
// ------------------------------------------------------------------
for (const dir of [IMAGES_DIR, VIDEOS_DIR, LOGS_DIR, USER_DATA_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}
