# modules/downloader.py
# Handles saving downloaded images and videos to disk with unique filenames.

import os
import shutil
import logging
from pathlib import Path
from config import IMAGES_DIR, VIDEOS_DIR

logger = logging.getLogger("bot")


class Downloader:
    """
    Saves files that Playwright downloads to the correct output folder.
    Also handles copying an already-downloaded temp file to its final path.
    """

    @staticmethod
    def save_image(download, prompt_id: int) -> str:
        """
        Accept a Playwright Download object, save it to images/<id>.png.
        Returns the saved file path.
        """
        filename = f"{prompt_id}.png"
        dest     = os.path.join(IMAGES_DIR, filename)
        download.save_as(dest)
        logger.info(f"[ID:{prompt_id}] Image saved  ->  {dest}")
        return dest

    @staticmethod
    def save_video(download, prompt_id: int) -> str:
        """
        Accept a Playwright Download object, save it to videos/<id>.mp4.
        Returns the saved file path.
        """
        filename = f"{prompt_id}.mp4"
        dest     = os.path.join(VIDEOS_DIR, filename)
        download.save_as(dest)
        logger.info(f"[ID:{prompt_id}] Video saved  ->  {dest}")
        return dest

    @staticmethod
    def copy_file(src: str, dest: str) -> str:
        """
        Copy an existing file from src to dest.
        Used when the browser saves to a temp location.
        """
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        shutil.copy2(src, dest)
        logger.info(f"File copied  {src}  ->  {dest}")
        return dest

    @staticmethod
    def get_image_path(prompt_id: int) -> str:
        return os.path.join(IMAGES_DIR, f"{prompt_id}.png")

    @staticmethod
    def get_video_path(prompt_id: int) -> str:
        return os.path.join(VIDEOS_DIR, f"{prompt_id}.mp4")

    @staticmethod
    def image_exists(prompt_id: int) -> bool:
        return Path(Downloader.get_image_path(prompt_id)).exists()

    @staticmethod
    def video_exists(prompt_id: int) -> bool:
        return Path(Downloader.get_video_path(prompt_id)).exists()
