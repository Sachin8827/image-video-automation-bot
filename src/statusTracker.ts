// src/statusTracker.ts
// Reads and writes prompt statuses in prompts.json.

import fs from 'fs';
import { PROMPTS_FILE, MAX_RETRIES } from './config';
import { Prompt } from './promptLoader';
import logger from './logger';

export class StatusTracker {
  private filepath: string;

  constructor(filepath: string = PROMPTS_FILE) {
    this.filepath = filepath;
  }

  private load(): Prompt[] {
    const raw = fs.readFileSync(this.filepath, 'utf-8');
    return JSON.parse(raw) as Prompt[];
  }

  private save(data: Prompt[]): void {
    fs.writeFileSync(this.filepath, JSON.stringify(data, null, 2), 'utf-8');
  }

  private find(data: Prompt[], id: number): Prompt | undefined {
    return data.find((p) => p.id === id);
  }

  private now(): string {
    return new Date().toISOString();
  }

  // ---- Image ----
  setImageInProgress(id: number): void {
    const data = this.load();
    const p = this.find(data, id);
    if (p) { p.image_status = 'in_progress'; p.last_updated = this.now(); this.save(data); }
  }

  setImageSuccess(id: number, imagePath: string): void {
    const data = this.load();
    const p = this.find(data, id);
    if (p) {
      p.image_status = 'success';
      p.image_path   = imagePath;
      p.image_error  = null;
      p.last_updated = this.now();
      this.save(data);
      logger.info(`[ID:${id}] image_status -> success (${imagePath})`);
    }
  }

  setImageFailed(id: number, error: string): void {
    const data = this.load();
    const p = this.find(data, id);
    if (p) {
      p.image_retries = (p.image_retries || 0) + 1;
      p.image_status  = p.image_retries >= MAX_RETRIES ? 'failed_permanent' : 'failed';
      p.image_error   = error;
      p.last_updated  = this.now();
      this.save(data);
      logger.warn(`[ID:${id}] image_status -> ${p.image_status} (attempt ${p.image_retries})`);
    }
  }

  // ---- Video ----
  setVideoInProgress(id: number): void {
    const data = this.load();
    const p = this.find(data, id);
    if (p) { p.video_status = 'in_progress'; p.last_updated = this.now(); this.save(data); }
  }

  setVideoSuccess(id: number, videoPath: string): void {
    const data = this.load();
    const p = this.find(data, id);
    if (p) {
      p.video_status = 'success';
      p.video_path   = videoPath;
      p.video_error  = null;
      p.last_updated = this.now();
      this.save(data);
      logger.info(`[ID:${id}] video_status -> success (${videoPath})`);
    }
  }

  setVideoFailed(id: number, error: string): void {
    const data = this.load();
    const p = this.find(data, id);
    if (p) {
      p.video_retries = (p.video_retries || 0) + 1;
      p.video_status  = p.video_retries >= MAX_RETRIES ? 'failed_permanent' : 'failed';
      p.video_error   = error;
      p.last_updated  = this.now();
      this.save(data);
      logger.warn(`[ID:${id}] video_status -> ${p.video_status} (attempt ${p.video_retries})`);
    }
  }

  // ---- Summary ----
  printSummary(): void {
    const data = this.load();
    const imgOk   = data.filter((p) => p.image_status === 'success').length;
    const vidOk   = data.filter((p) => p.video_status === 'success').length;
    const imgFail = data.filter((p) => p.image_status?.includes('failed')).length;
    const vidFail = data.filter((p) => p.video_status?.includes('failed')).length;
    logger.info('='.repeat(50));
    logger.info(`SUMMARY  |  Total: ${data.length}`);
    logger.info(`  Images : ${imgOk} success / ${imgFail} failed`);
    logger.info(`  Videos : ${vidOk} success / ${vidFail} failed`);
    logger.info('='.repeat(50));
  }
}
