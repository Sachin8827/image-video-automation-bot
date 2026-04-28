#!/usr/bin/env python3
"""
bot.py  -  Main entry point for the Image & Video Automation Bot.

Usage:
    python bot.py              # Run the full pipeline
    python bot.py --help       # Show help

First time setup:
    python setup_auth.py       # Log in manually once to save session
    python bot.py              # All subsequent runs are fully automated
"""

import argparse
import sys
from modules.logger        import setup_logger
from modules.workflow_engine import WorkflowEngine


def parse_args():
    parser = argparse.ArgumentParser(
        description="Automates image (Google Flow) + video (Meta AI) generation pipeline"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Load and validate prompts.json without launching the browser"
    )
    return parser.parse_args()


def main():
    args   = parse_args()
    logger = setup_logger("bot")

    if args.dry_run:
        from modules.prompt_loader import PromptLoader
        loader  = PromptLoader()
        prompts = loader.load_all()
        logger.info(f"Dry run  --  {len(prompts)} prompt(s) loaded from prompts.json")
        for p in prompts:
            logger.info(
                f"  ID {p['id']:>3}  |  "
                f"img={p.get('image_status','?'):12}  "
                f"vid={p.get('video_status','?'):12}  "
                f"prompt={p['image_prompt'][:50]}..."
            )
        return

    # Full run
    try:
        engine = WorkflowEngine()
        engine.run()
    except KeyboardInterrupt:
        logger.warning("Bot interrupted by user (Ctrl+C)")
        sys.exit(0)
    except Exception as e:
        logger.critical(f"Unhandled error: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
