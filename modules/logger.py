# modules/logger.py
# Sets up a consistent logger that writes to console AND a timestamped log file.

import logging
import os
from datetime import datetime
from config import LOGS_DIR


def setup_logger(name: str = "bot") -> logging.Logger:
    """
    Create and return a logger that:
      - Prints INFO+ messages to stdout
      - Writes DEBUG+ messages to logs/run_<timestamp>.log
    """
    logger = logging.getLogger(name)

    # Avoid adding duplicate handlers if called multiple times
    if logger.handlers:
        return logger

    logger.setLevel(logging.DEBUG)

    formatter = logging.Formatter(
        fmt="[%(asctime)s] [%(levelname)-8s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )

    # --- Console handler (INFO and above) ---
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(formatter)

    # --- File handler (DEBUG and above) ---
    log_filename = os.path.join(
        LOGS_DIR,
        f"run_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
    )
    file_handler = logging.FileHandler(log_filename, encoding="utf-8")
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(formatter)

    logger.addHandler(console_handler)
    logger.addHandler(file_handler)

    logger.info(f"Logger initialised  →  {log_filename}")
    return logger
