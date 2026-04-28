#!/usr/bin/env python3
"""
setup_auth.py  -  ONE-TIME manual login script.

Run this ONCE before using bot.py for the first time.
It opens a visible browser window so you can log into:
  1. Google (for Google Flow)
  2. Meta AI (for video generation)

The session is saved to user-data/ and reused by bot.py automatically.
You only need to re-run this if Google/Meta force a re-login (~30-90 days).

Usage:
    python setup_auth.py
"""

from playwright.sync_api import sync_playwright
from config import USER_DATA_DIR, FLOW_URL, META_AI_URL


def main():
    print("=" * 60)
    print("  IMAGE-VIDEO BOT  |  ONE-TIME AUTH SETUP")
    print("=" * 60)
    print(f"  Session will be saved to: {USER_DATA_DIR}/")
    print("")

    with sync_playwright() as p:
        context = p.chromium.launch_persistent_context(
            user_data_dir=USER_DATA_DIR,
            headless=False,       # MUST be visible for manual login
            slow_mo=100,
            viewport={"width": 1280, "height": 800},
        )
        page = context.new_page()

        # ---- Step 1: Google login (for Google Flow) ----
        print("[Step 1/2]  Opening Google Flow...")
        page.goto(FLOW_URL)
        print("  -> Please log into your Google account in the browser window.")
        print("  -> Press ENTER here once you are logged in and can see the Flow project.")
        input("  [ENTER to continue] ")
        print("  Google login saved.")
        print("")

        # ---- Step 2: Meta AI login ----
        print("[Step 2/2]  Opening Meta AI...")
        page.goto(META_AI_URL)
        print("  -> Please log into your Meta / Facebook account in the browser window.")
        print("  -> Press ENTER here once you are logged in and can see the Meta AI prompt.")
        input("  [ENTER to continue] ")
        print("  Meta AI login saved.")
        print("")

        context.close()

    print("=" * 60)
    print("  Auth setup complete!")
    print(f"  Session saved to: {USER_DATA_DIR}/")
    print("  You can now run: python bot.py")
    print("=" * 60)


if __name__ == "__main__":
    main()
