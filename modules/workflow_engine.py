# modules/workflow_engine.py
# Orchestrates the full image -> video pipeline using Playwright.

import time
import logging
from playwright.sync_api import sync_playwright, BrowserContext, Page
from config import USER_DATA_DIR, HEADLESS, SLOW_MO_MS, RETRY_DELAY_SEC
from .prompt_loader   import PromptLoader
from .status_tracker  import StatusTracker
from .image_generator import ImageGenerator
from .video_generator import VideoGenerator
from .downloader      import Downloader

logger = logging.getLogger("bot")


class WorkflowEngine:
    """
    Main orchestrator.  Call run() to start the full pipeline.
    It will:
      - Launch one persistent browser session (reuses saved login)
      - Open two tabs (Google Flow + Meta AI)
      - Process every pending prompt
      - Track success / failure with automatic retry
    """

    def __init__(self):
        self.context:     BrowserContext = None
        self.flow_page:   Page = None
        self.meta_page:   Page = None
        self.loader       = PromptLoader()
        self.tracker      = StatusTracker()

    # ------------------------------------------------------------------
    # Browser lifecycle
    # ------------------------------------------------------------------
    def _start_browser(self, playwright):
        """Launch a persistent browser context that reuses saved login session."""
        self.context = playwright.chromium.launch_persistent_context(
            user_data_dir=USER_DATA_DIR,
            headless=HEADLESS,
            slow_mo=SLOW_MO_MS,
            accept_downloads=True,
            viewport={"width": 1280, "height": 800},
        )
        # Open dedicated tabs for each service
        self.flow_page = self.context.new_page()
        self.meta_page = self.context.new_page()
        logger.info("Browser launched with persistent session (user-data/)")

    def _stop_browser(self):
        """Close the browser context cleanly."""
        if self.context:
            self.context.close()
            logger.info("Browser closed")

    # ------------------------------------------------------------------
    # Step runners with retry
    # ------------------------------------------------------------------
    def _run_image_step(self, prompt: dict):
        """Run image generation with retry on failure."""
        pid          = prompt["id"]
        image_prompt = prompt["image_prompt"]
        generator    = ImageGenerator(self.flow_page)

        self.tracker.set_image_in_progress(pid)
        try:
            image_path = generator.generate(pid, image_prompt)
            self.tracker.set_image_success(pid, image_path)
            return image_path
        except Exception as e:
            error_msg = str(e)
            logger.error(f"[ID:{pid}] Image generation error: {error_msg}")
            self.tracker.set_image_failed(pid, error_msg)
            raise

    def _run_video_step(self, prompt: dict, image_path: str):
        """Run video generation with retry on failure."""
        pid              = prompt["id"]
        animation_prompt = prompt["animation_prompt"]
        generator        = VideoGenerator(self.meta_page)

        self.tracker.set_video_in_progress(pid)
        try:
            video_path = generator.generate(pid, image_path, animation_prompt)
            self.tracker.set_video_success(pid, video_path)
            return video_path
        except Exception as e:
            error_msg = str(e)
            logger.error(f"[ID:{pid}] Video generation error: {error_msg}")
            self.tracker.set_video_failed(pid, error_msg)
            raise

    # ------------------------------------------------------------------
    # Main pipeline
    # ------------------------------------------------------------------
    def run(self):
        """Entry point.  Runs the full pipeline for all pending prompts."""
        logger.info("=" * 60)
        logger.info("IMAGE-VIDEO AUTOMATION BOT  |  Starting...")
        logger.info("=" * 60)

        with sync_playwright() as playwright:
            self._start_browser(playwright)
            try:
                self._process_all()
            finally:
                self._stop_browser()

        self.tracker.print_summary()

    def _process_all(self):
        """Process image then video steps for all applicable prompts."""
        # --- Phase 1: Image generation ---
        image_prompts = self.loader.get_pending_prompts()
        if image_prompts:
            logger.info(f"Phase 1: {len(image_prompts)} image(s) to generate")
            for prompt in image_prompts:
                pid = prompt["id"]
                try:
                    self._run_image_step(prompt)
                except Exception:
                    logger.warning(f"[ID:{pid}] Skipping video step (image failed)")
                    continue
                time.sleep(RETRY_DELAY_SEC)  # Brief pause between prompts
        else:
            logger.info("Phase 1: No pending image tasks")

        # --- Phase 2: Video generation ---
        video_prompts = self.loader.get_video_pending_prompts()
        if video_prompts:
            logger.info(f"Phase 2: {len(video_prompts)} video(s) to generate")
            for prompt in video_prompts:
                pid        = prompt["id"]
                image_path = prompt.get("image_path") or Downloader.get_image_path(pid)
                try:
                    self._run_video_step(prompt, image_path)
                except Exception:
                    logger.warning(f"[ID:{pid}] Video step failed, moving to next")
                    continue
                time.sleep(RETRY_DELAY_SEC)
        else:
            logger.info("Phase 2: No pending video tasks")
