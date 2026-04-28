# =============================================================
# config.py  —  Central configuration for image-video-automation-bot
# =============================================================

import os

# ------------------------------------------------------------------
# Browser / Playwright settings
# ------------------------------------------------------------------
HEADLESS      = False          # Set True to run browser in background
SLOW_MO_MS    = 50             # Milliseconds between each Playwright action
USER_DATA_DIR = "user-data"    # Persistent browser profile (keeps login alive)

# ------------------------------------------------------------------
# Target URLs  (your exact project/prompt URLs)
# ------------------------------------------------------------------
FLOW_URL    = "https://labs.google/fx/tools/flow/project/35e24640-8b62-415e-955b-d1643edd62d5"
META_AI_URL = "https://www.meta.ai/prompt/ebb2627f-c66c-4aca-b946-2f6075ef9804"

# ------------------------------------------------------------------
# File & folder paths
# ------------------------------------------------------------------
PROMPTS_FILE = "prompts.json"
IMAGES_DIR   = "images"
VIDEOS_DIR   = "videos"
LOGS_DIR     = "logs"

# ------------------------------------------------------------------
# Retry & timeout settings
# ------------------------------------------------------------------
MAX_RETRIES       = 3           # Max attempts per step before marking failed_permanent
RETRY_DELAY_SEC   = 5           # Seconds to wait between retries

ELEMENT_TIMEOUT   = 30_000      # ms — max wait for a DOM element to appear
GENERATION_TIMEOUT = 180_000    # ms — max wait for image/video generation to finish
DOWNLOAD_TIMEOUT  = 60_000      # ms — max wait for file download

# ------------------------------------------------------------------
# Google Flow selectors  (update if the UI changes)
# ------------------------------------------------------------------
FLOW_PROMPT_INPUT_SELECTOR  = "textarea[placeholder*='prompt'], textarea[aria-label*='prompt']"
FLOW_GENERATE_BTN_SELECTOR  = "button[aria-label*='Generate'], button:has-text('Generate')"
FLOW_DONE_INDICATOR         = "img[alt*='generated'], div[data-testid*='image-result']"
FLOW_DOWNLOAD_BTN_SELECTOR  = "button[aria-label*='Download'], button[title*='Download']"

# ------------------------------------------------------------------
# Meta AI selectors  (update if the UI changes)
# ------------------------------------------------------------------
META_PROMPT_INPUT_SELECTOR  = "div[contenteditable='true'], textarea[placeholder*='message']"
META_UPLOAD_BTN_SELECTOR    = "input[type='file'], button[aria-label*='attach']"
META_SEND_BTN_SELECTOR      = "button[aria-label*='Send'], button[type='submit']"
META_VIDEO_DONE_SELECTOR    = "video, div[data-testid*='video-result']"
META_VIDEO_DOWNLOAD_SELECTOR= "button[aria-label*='Download'], a[download]"

# ------------------------------------------------------------------
# Ensure output directories exist at import time
# ------------------------------------------------------------------
for _dir in (IMAGES_DIR, VIDEOS_DIR, LOGS_DIR, USER_DATA_DIR):
    os.makedirs(_dir, exist_ok=True)
