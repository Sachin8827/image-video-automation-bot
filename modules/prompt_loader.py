# modules/prompt_loader.py
# Loads prompts from prompts.json and filters those that still need work.

import json
import logging
from typing import List, Dict, Any
from config import PROMPTS_FILE, MAX_RETRIES

logger = logging.getLogger("bot")


class PromptLoader:
    """Reads prompts.json and returns prompts that are actionable."""

    def __init__(self, filepath: str = PROMPTS_FILE):
        self.filepath = filepath

    def load_all(self) -> List[Dict[str, Any]]:
        """Load all prompts from the JSON file."""
        try:
            with open(self.filepath, "r", encoding="utf-8") as f:
                data = json.load(f)
            logger.debug(f"Loaded {len(data)} prompts from {self.filepath}")
            return data
        except FileNotFoundError:
            logger.error(f"prompts.json not found at: {self.filepath}")
            return []
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in {self.filepath}: {e}")
            return []

    def get_pending_prompts(self) -> List[Dict[str, Any]]:
        """
        Return prompts that need image generation:
          - image_status is 'pending' or 'failed' (with retries left)
        """
        all_prompts = self.load_all()
        pending = []
        for p in all_prompts:
            status  = p.get("image_status", "pending")
            retries = p.get("image_retries", 0)
            if status in ("pending", "in_progress"):
                pending.append(p)
            elif status == "failed" and retries < MAX_RETRIES:
                pending.append(p)
        logger.info(f"Pending image tasks: {len(pending)} / {len(all_prompts)}")
        return pending

    def get_video_pending_prompts(self) -> List[Dict[str, Any]]:
        """
        Return prompts whose image is done but video still needs generation.
        """
        all_prompts = self.load_all()
        pending = []
        for p in all_prompts:
            image_ok     = p.get("image_status") == "success"
            video_status = p.get("video_status", "pending")
            video_retries= p.get("video_retries", 0)
            if not image_ok:
                continue
            if video_status in ("pending", "in_progress"):
                pending.append(p)
            elif video_status == "failed" and video_retries < MAX_RETRIES:
                pending.append(p)
        logger.info(f"Pending video tasks: {len(pending)} / {len(all_prompts)}")
        return pending
