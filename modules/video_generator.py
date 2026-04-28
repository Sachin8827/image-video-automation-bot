# modules/video_generator.py
# Playwright automation for Meta AI video generation.

import logging
import os
from playwright.sync_api import Page, Download
from config import (
    META_AI_URL,
    META_PROMPT_INPUT_SELECTOR,
    META_UPLOAD_BTN_SELECTOR,
    META_SEND_BTN_SELECTOR,
    META_VIDEO_DONE_SELECTOR,
    META_VIDEO_DOWNLOAD_SELECTOR,
    ELEMENT_TIMEOUT,
    GENERATION_TIMEOUT,
    DOWNLOAD_TIMEOUT,
)
from .downloader import Downloader

logger = logging.getLogger("bot")


class VideoGenerator:
    """
    Controls the Meta AI tab to:
      1. Navigate to the /prompt/ URL  (always opens a fresh conversation)
      2. Upload the generated image
      3. Type the animation prompt
      4. Send the message
      5. Wait for video generation to complete
      6. Download the generated video
    """

    def __init__(self, page: Page):
        self.page = page

    def generate(self, prompt_id: int, image_path: str, animation_prompt: str) -> str:
        """
        Run the full video generation flow.
        Returns the saved video file path on success.
        Raises an exception on failure.
        """
        logger.info(f"[ID:{prompt_id}] Starting video generation on Meta AI")

        if not os.path.exists(image_path):
            raise FileNotFoundError(f"[ID:{prompt_id}] Image not found: {image_path}")

        # Step 1: Navigate to the /prompt/ URL  (fresh conversation every time)
        self.page.goto(META_AI_URL, wait_until="domcontentloaded")
        logger.debug(f"[ID:{prompt_id}] Navigated to Meta AI prompt URL")

        # Step 2: Wait for the input area
        self.page.wait_for_selector(
            META_PROMPT_INPUT_SELECTOR,
            timeout=ELEMENT_TIMEOUT
        )

        # Step 3: Upload the image via the file input
        self._upload_image(prompt_id, image_path)

        # Step 4: Type the animation prompt
        prompt_input = self.page.query_selector(META_PROMPT_INPUT_SELECTOR)
        prompt_input.click()
        prompt_input.type(animation_prompt)  # Use .type() for contenteditable divs
        logger.debug(f"[ID:{prompt_id}] Animation prompt typed: {animation_prompt[:60]}...")

        # Step 5: Send the message
        send_btn = self.page.wait_for_selector(
            META_SEND_BTN_SELECTOR,
            timeout=ELEMENT_TIMEOUT
        )
        send_btn.click()
        logger.info(f"[ID:{prompt_id}] Message sent, waiting for video generation...")

        # Step 6: Wait for the video element to appear
        self.page.wait_for_selector(
            META_VIDEO_DONE_SELECTOR,
            timeout=GENERATION_TIMEOUT
        )
        logger.info(f"[ID:{prompt_id}] Video generation complete")

        # Step 7: Download the video
        video_path = self._download_video(prompt_id)
        return video_path

    def _upload_image(self, prompt_id: int, image_path: str):
        """
        Trigger Meta AI's file upload for the generated image.
        Tries visible upload button first, then falls back to hidden file input.
        """
        # Try clicking an upload button if present
        upload_btn = self.page.query_selector(
            "button[aria-label*='attach'], button[aria-label*='image'], button[aria-label*='upload']"
        )
        if upload_btn:
            upload_btn.click()
            self.page.wait_for_timeout(500)

        # Set file on the hidden file input
        file_input = self.page.query_selector("input[type='file']")
        if file_input:
            file_input.set_input_files(image_path)
            logger.info(f"[ID:{prompt_id}] Image uploaded: {image_path}")
        else:
            logger.warning(f"[ID:{prompt_id}] No file input found — image upload may fail")

        self.page.wait_for_timeout(1000)  # Let the upload register

    def _download_video(self, prompt_id: int) -> str:
        """
        Click the video download button and save the file.
        """
        download_btn = self.page.wait_for_selector(
            META_VIDEO_DOWNLOAD_SELECTOR,
            timeout=ELEMENT_TIMEOUT
        )

        with self.page.expect_download(timeout=DOWNLOAD_TIMEOUT) as download_info:
            download_btn.click()

        download: Download = download_info.value
        video_path = Downloader.save_video(download, prompt_id)
        return video_path
