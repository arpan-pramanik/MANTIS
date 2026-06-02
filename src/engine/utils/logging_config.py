"""Structured logging for the detection engine."""
import logging
import json
import sys
from pathlib import Path

LOG_DIR = Path(__file__).parent.parent.parent.parent / "logs"
LOG_DIR.mkdir(exist_ok=True)

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_entry = {
            "timestamp": self.formatTime(record),
            "level": record.levelname,
            "service": "mantis-engine",
            "message": record.getMessage(),
        }
        if hasattr(record, 'extra_data'):
            log_entry.update(record.extra_data)
        if record.exc_info and record.exc_info[1]:
            log_entry["exception"] = str(record.exc_info[1])
        return json.dumps(log_entry)

def setup_logging(level: str = "INFO") -> logging.Logger:
    logger = logging.getLogger("mantis.engine")
    if logger.handlers:
        return logger
    logger.setLevel(getattr(logging, level.upper(), logging.INFO))
    
    # Console handler
    ch = logging.StreamHandler(sys.stdout)
    ch.setFormatter(logging.Formatter(
        "%(asctime)s [%(levelname)s] %(message)s", datefmt="%H:%M:%S"
    ))
    logger.addHandler(ch)
    
    # File handler
    fh = logging.FileHandler(LOG_DIR / "engine.log")
    fh.setFormatter(JSONFormatter())
    logger.addHandler(fh)
    
    # Security event handler
    sh = logging.FileHandler(LOG_DIR / "engine_security.log")
    sh.setFormatter(JSONFormatter())
    security_logger = logging.getLogger("mantis.engine.security")
    security_logger.addHandler(sh)
    security_logger.setLevel(logging.INFO)
    
    return logger

def get_logger() -> logging.Logger:
    return setup_logging()

def get_security_logger() -> logging.Logger:
    setup_logging()
    return logging.getLogger("mantis.engine.security")
