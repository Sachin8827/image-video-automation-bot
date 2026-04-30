// src/promptLoader.ts
// Loads prompts from prompts.json and filters those that need processing.

import fs from 'fs';
import { PROMPTS_FILE, MAX_RETRIES } from './config';
import logger from './logger';

export interface Prompt {
  id: number;
  image_prompt: string;
  animation_prompt: string;
  image_status: string;
  video_status: string;
  image_retries: number;
  video_retries: number;
  image_path: string | null;
  video_path: string | null;
  image_error: string | null;
  video_error: string | null;
  last_updated: string | null;
}

export class PromptLoader {
  private filepath: string;

  constructor(filepath: string = PROMPTS_FILE) {
    this.filepath = filepath;
  }

  loadAll(): Prompt[] {
    try {
      const raw = fs.readFileSync(this.filepath, 'utf-8');
      const data: Prompt[] = JSON.parse(raw);
      logger.debug(`Loaded ${data.length} prompts from ${this.filepath}`);
      return data;
    } catch (err) {
      logger.error(`Failed to load prompts: ${err}`);
      return [];
    }
  }

  getPendingImagePrompts(): Prompt[] {
    const all = this.loadAll();
    const pending = all.filter((p) => {
      const status = p.image_status || 'pending';
      const retries = p.image_retries || 0;
      if (['pending', 'in_progress'].includes(status)) return true;
      if (status === 'failed' && retries < MAX_RETRIES) return true;
      return false;
    });
    logger.info(`Pending image tasks: ${pending.length} / ${all.length}`);
    return pending;
  }

  getPendingVideoPrompts(): Prompt[] {
    const all = this.loadAll();
    const pending = all.filter((p) => {
      if (p.image_status !== 'success') return false;
      const status = p.video_status || 'pending';
      const retries = p.video_retries || 0;
      if (['pending', 'in_progress'].includes(status)) return true;
      if (status === 'failed' && retries < MAX_RETRIES) return true;
      return false;
    });
    logger.info(`Pending video tasks: ${pending.length} / ${all.length}`);
    return pending;
  }
}
