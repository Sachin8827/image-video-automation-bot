# modules/status_tracker.py
# Reads and writes status fields in prompts.json atomically.

import json
import logging
from datetime import datetime
from typing import Optional
from config import PROMPTS_FILE, MAX_RETRIES

logger = logging.getLogger("bot")


class StatusTracker:
    """Thread-safe(ish) read/write of prompt statuses in prompts.json."""

    def __init__(self, filepath: str = PROMPTS_FILE):
        self.filepath = filepath

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------
    def _load(self):
        with open(self.filepath, "r", encoding="utf-8") as f:
            return json.load(f)

    def _save(self, data):
        with open(self.filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    def _find(self, data, prompt_id: int):
        for item in data:
            if item["id"] == prompt_id:
                return item
        return None

    # ------------------------------------------------------------------
    # Image status helpers
    # ------------------------------------------------------------------
    def set_image_in_progress(self, prompt_id: int):
        data = self._load()
        p = self._find(data, prompt_id)
        if p:
            p["image_status"]   = "in_progress"
            p["last_updated"]   = datetime.utcnow().isoformat()
            self._save(data)
            logger.debug(f"[ID:{prompt_id}] image_status -> in_progress")

    def set_image_success(self, prompt_id: int, image_path: str):
        data = self._load()
        p = self._find(data, prompt_id)
        if p:
            p["image_status"]  = "success"
            p["image_path"]    = image_path
            p["image_error"]   = None
            p["last_updated"]  = datetime.utcnow().isoformat()
            self._save(data)
            logger.info(f"[ID:{prompt_id}] image_status -> success  ({image_path})")

    def set_image_failed(self, prompt_id: int, error: str):
        data = self._load()
        p = self._find(data, prompt_id)
        if p:
            p["image_retries"] = p.get("image_retries", 0) + 1
            if p["image_retries"] >= MAX_RETRIES:
                p["image_status"] = "failed_permanent"
            else:
                p["image_status"] = "failed"
            p["image_error"]  = error
            p["last_updated"] = datetime.utcnow().isoformat()
            self._save(data)
            logger.warning(f"[ID:{prompt_id}] image_status -> {p['image_status']} (attempt {p['image_retries']})")

    # ------------------------------------------------------------------
    # Video status helpers
    # ------------------------------------------------------------------
    def set_video_in_progress(self, prompt_id: int):
        data = self._load()
        p = self._find(data, prompt_id)
        if p:
            p["video_status"]  = "in_progress"
            p["last_updated"]  = datetime.utcnow().isoformat()
            self._save(data)
            logger.debug(f"[ID:{prompt_id}] video_status -> in_progress")

    def set_video_success(self, prompt_id: int, video_path: str):
        data = self._load()
        p = self._find(data, prompt_id)
        if p:
            p["video_status"]  = "success"
            p["video_path"]    = video_path
            p["video_error"]   = None
            p["last_updated"]  = datetime.utcnow().isoformat()
            self._save(data)
            logger.info(f"[ID:{prompt_id}] video_status -> success  ({video_path})")

    def set_video_failed(self, prompt_id: int, error: str):
        data = self._load()
        p = self._find(data, prompt_id)
        if p:
            p["video_retries"] = p.get("video_retries", 0) + 1
            if p["video_retries"] >= MAX_RETRIES:
                p["video_status"] = "failed_permanent"
            else:
                p["video_status"] = "failed"
            p["video_error"]  = error
            p["last_updated"] = datetime.utcnow().isoformat()
            self._save(data)
            logger.warning(f"[ID:{prompt_id}] video_status -> {p['video_status']} (attempt {p['video_retries']})")

    # ------------------------------------------------------------------
    # Summary report
    # ------------------------------------------------------------------
    def print_summary(self):
        data = self._load()
        total = len(data)
        img_ok  = sum(1 for p in data if p.get("image_status") == "success")
        vid_ok  = sum(1 for p in data if p.get("video_status") == "success")
        img_fail= sum(1 for p in data if "failed" in p.get("image_status", ""))
        vid_fail= sum(1 for p in data if "failed" in p.get("video_status", ""))
        logger.info("=" * 50)
        logger.info(f"SUMMARY  |  Total prompts : {total}")
        logger.info(f"  Images : {img_ok} success / {img_fail} failed")
        logger.info(f"  Videos : {vid_ok} success / {vid_fail} failed")
        logger.info("=" * 50)
