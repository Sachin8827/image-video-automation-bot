// src/downloader.ts
// Handles saving downloaded images and videos to disk.

import path from 'path';
import fs from 'fs';
import { IMAGES_DIR, VIDEOS_DIR } from './config';
import logger from './logger';
import { Download } from 'playwright';

export class Downloader {
  static getImagePath(id: number): string {
    return path.join(IMAGES_DIR, `${id}.png`);
  }

  static getVideoPath(id: number): string {
    return path.join(VIDEOS_DIR, `${id}.mp4`);
  }

  static imageExists(id: number): boolean {
    return fs.existsSync(Downloader.getImagePath(id));
  }

  static videoExists(id: number): boolean {
    return fs.existsSync(Downloader.getVideoPath(id));
  }

  static async saveImage(download: Download, id: number): Promise<string> {
    const dest = Downloader.getImagePath(id);
    await download.saveAs(dest);
    logger.info(`[ID:${id}] Image saved -> ${dest}`);
    return dest;
  }

  static async saveVideo(download: Download, id: number): Promise<string> {
    const dest = Downloader.getVideoPath(id);
    await download.saveAs(dest);
    logger.info(`[ID:${id}] Video saved -> ${dest}`);
    return dest;
  }

  static copyFile(src: string, dest: string): string {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    logger.info(`File copied: ${src} -> ${dest}`);
    return dest;
  }
}
