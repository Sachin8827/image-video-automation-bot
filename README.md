# Image & Video Automation Bot

> **Author:** Sachin | **Stack:** Python · Playwright · JSON | **Year:** 2026

Automates the full image + video generation pipeline across Google Flow and Meta AI — eliminating manual tab switching, copy-pasting, and repetitive actions.

---

## Problem It Solves

The original workflow required manually:
1. Copying a prompt from Perplexity
2. Switching to Google Flow → pasting → generating → waiting → downloading
3. Switching to Meta AI → uploading image → pasting animation prompt → generating → waiting
4. Repeating for every single prompt

This bot automates **all of the above** with retry logic, status tracking, and resume capability.

---

## Project Structure

```
image-video-automation-bot/
├── bot.py                    # Main entry point
├── setup_auth.py             # ONE-TIME login script (run before first use)
├── config.py                 # All settings, URLs, selectors, timeouts
├── prompts.json              # Prompt dataset + live status tracking
├── requirements.txt          # pip dependencies
├── modules/
│   ├── __init__.py
│   ├── logger.py             # Timestamped log files
│   ├── prompt_loader.py      # Load & filter pending prompts
│   ├── status_tracker.py     # Read/write status in prompts.json
│   ├── image_generator.py    # Playwright → Google Flow
│   ├── video_generator.py    # Playwright → Meta AI
│   ├── workflow_engine.py    # Orchestrates the full pipeline
│   └── downloader.py         # Save images and videos to disk
├── images/                   # Generated images (auto-created)
├── videos/                   # Generated videos (auto-created)
├── logs/                     # Per-run log files (auto-created)
└── user-data/                # Saved browser session (gitignored)
```

---

## Quick Start

### 1. Install dependencies
```bash
pip install -r requirements.txt
playwright install chromium
```

### 2. One-time login (saves your Google + Meta session)
```bash
python setup_auth.py
```
A browser window opens. Log into Google (for Flow) and Meta AI. Press Enter after each. Done — never needs to be repeated unless you're forced to re-login.

### 3. Add your prompts to `prompts.json`
Edit the sample entries or add new ones following this schema:
```json
{
  "id": 1,
  "image_prompt": "Your image generation prompt here",
  "animation_prompt": "Your animation/video prompt here",
  "image_status": "pending",
  "video_status": "pending",
  "image_retries": 0,
  "video_retries": 0,
  "image_path": null,
  "video_path": null,
  "image_error": null,
  "video_error": null,
  "last_updated": null
}
```

### 4. Run the bot
```bash
python bot.py
```

### Dry run (validate prompts without opening browser)
```bash
python bot.py --dry-run
```

---

## Key Features

| Feature | Detail |
|---|---|
| **Persistent login** | Uses `launch_persistent_context` — login once, runs forever |
| **Your exact URLs** | Uses your specific Google Flow project + Meta AI prompt template URLs |
| **Fresh conversations** | Meta AI `/prompt/` URL opens a clean conversation every time |
| **Status tracking** | Every prompt tracked: `pending` → `in_progress` → `success` / `failed` |
| **Auto retry** | Failed steps retried up to 3 times before marking `failed_permanent` |
| **Resume capability** | Re-run `bot.py` anytime — skips already successful prompts |
| **Timestamped logs** | Full debug logs saved to `logs/run_YYYYMMDD_HHMMSS.log` |
| **Two-tab architecture** | Google Flow tab + Meta AI tab open simultaneously |

---

## Configuration (`config.py`)

Key settings you may want to adjust:

```python
HEADLESS = False           # Set True to hide the browser window
MAX_RETRIES = 3            # Retry attempts before giving up
GENERATION_TIMEOUT = 180000  # ms to wait for generation (3 min default)

# Your exact project URLs (already pre-configured)
FLOW_URL    = "https://labs.google/fx/tools/flow/project/..."
META_AI_URL = "https://www.meta.ai/prompt/..."
```

---

## Status Values

| Status | Meaning |
|---|---|
| `pending` | Not yet processed |
| `in_progress` | Currently being processed |
| `success` | Completed successfully |
| `failed` | Failed, will be retried |
| `failed_permanent` | Failed all retry attempts, skipped |

---

## Notes

- `user-data/` is gitignored — it contains your login session tokens
- If Google or Meta force a re-login, just re-run `setup_auth.py`
- If the UI of Flow or Meta AI changes, update the selectors in `config.py`
- Generated images save as `images/{id}.png`, videos as `videos/{id}.mp4`
