# modules/image_generator.py
# Playwright automation for Google Flow image generation.

import logging
import time
from playwright.sync_api import Page, Download
from config import (
    FLOW_URL,
    FLOW_PROMPT_INPUT_SELECTOR,
    FLOW_GENERATE_BTN_SELECTOR,
    FLOW_DONE_INDICATOR,
    FLOW_DOWNLOAD_BTN_SELECTOR,
    ELEMENT_TIMEOUT,
    GENERATION_TIMEOUT,
    DOWNLOAD_TIMEOUT,
)
from .downloader import Downloader

logger = logging.getLogger("bot")


class ImageGenerator:
    """
    Controls the Google Flow tab to:
      1. Navigate to the persistent project URL
      2. Type the image prompt
      3. Click Generate
      4. Wait for completion
      5. Download the latest generated image
    """

    def __init__(self, page: Page):
        self.page = page

    def generate(self, prompt_id: int, image_prompt: str) -> str:
        """
        Run the full image generation flow.
        Returns the saved image file path on success.
        Raises an exception on failure.
        """
        logger.info(f"[ID:{prompt_id}] Starting image generation on Google Flow")

        # Step 1: Navigate to the project (persistent session reused)
        self.page.goto(FLOW_URL, wait_until="domcontentloaded")
        logger.debug(f"[ID:{prompt_id}] Navigated to Flow project URL")

        # Step 2: Wait for prompt input to appear
        self.page.wait_for_selector(
            FLOW_PROMPT_INPUT_SELECTOR,
            timeout=ELEMENT_TIMEOUT
        )

        # Step 3: Clear any existing text and type the prompt
        prompt_input = self.page.query_selector(FLOW_PROMPT_INPUT_SELECTOR)
        prompt_input.click()
        prompt_input.fill("")           # Clear existing
        prompt_input.fill(image_prompt) # Type prompt
        logger.debug(f"[ID:{prompt_id}] Prompt typed: {image_prompt[:60]}...")

        # Step 4: Click Generate
        generate_btn = self.page.wait_for_selector(
            FLOW_GENERATE_BTN_SELECTOR,
            timeout=ELEMENT_TIMEOUT
        )
        generate_btn.click()
        logger.info(f"[ID:{prompt_id}] Generate button clicked, waiting for result...")

        # Step 5: Wait for the generated image to appear
        self.page.wait_for_selector(
            FLOW_DONE_INDICATOR,
            timeout=GENERATION_TIMEOUT
        )
        logger.info(f"[ID:{prompt_id}] Image generation complete")

        # Step 6: Download the most recently generated image
        image_path = self._download_latest_image(prompt_id)
        return image_path

    def _download_latest_image(self, prompt_id: int) -> str:
        """
        Click the download button on the latest generated image and save it.
        Google Flow shows the most recent generation last in the grid.
        """
        # Get all download buttons and click the last one (most recent)
        download_btns = self.page.query_selector_all(FLOW_DOWNLOAD_BTN_SELECTOR)
        if not download_btns:
            raise RuntimeError(f"[ID:{prompt_id}] No download button found after generation")

        latest_btn = download_btns[-1]  # Last = most recently generated

        # Capture the download event
        with self.page.expect_download(timeout=DOWNLOAD_TIMEOUT) as download_info:
            latest_btn.click()

        download: Download = download_info.value
        image_path = Downloader.save_image(download, prompt_id)
        return image_path
