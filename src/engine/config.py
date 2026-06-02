"""MANTIS Engine Configuration."""
import json
import os
from dataclasses import dataclass, field
from pathlib import Path

CONFIG_DIR = Path(__file__).parent.parent.parent / "config"

@dataclass
class EngineConfig:
    db_file: str = "storage.db"
    scan_interval: int = 10
    analysis_window: int = 300
    ml_contamination: float = 0.1
    min_samples_for_ml: int = 5
    block_ttl: int = 3600
    perm_block_threshold: int = 5
    log_level: str = "info"
    blocklist_file: str = "blocklist.json"
    threat_log_file: str = "threats.json"
    signatures_file: str = ""
    
    # Threat level thresholds
    critical_threshold: float = 0.9
    high_threshold: float = 0.7
    medium_threshold: float = 0.5
    low_threshold: float = 0.3

_instance: EngineConfig | None = None

def get_config() -> EngineConfig:
    global _instance
    if _instance is not None:
        return _instance
    
    cfg = EngineConfig()
    
    # Load from config/default.json
    config_path = CONFIG_DIR / "default.json"
    if config_path.exists():
        with open(config_path) as f:
            data = json.load(f)
        det = data.get("detection", {})
        cfg.scan_interval = det.get("scanInterval", cfg.scan_interval)
        cfg.analysis_window = det.get("analysisWindowSeconds", cfg.analysis_window)
        cfg.ml_contamination = det.get("mlContamination", cfg.ml_contamination)
        cfg.min_samples_for_ml = det.get("minSamplesForML", cfg.min_samples_for_ml)
        cfg.block_ttl = det.get("blockTTLSeconds", cfg.block_ttl)
        cfg.perm_block_threshold = det.get("permanentBlockThreshold", cfg.perm_block_threshold)
        cfg.log_level = data.get("logging", {}).get("level", cfg.log_level)
        cfg.db_file = data.get("database", {}).get("file", cfg.db_file)
        levels = det.get("threatLevels", {})
        cfg.critical_threshold = levels.get("critical", cfg.critical_threshold)
        cfg.high_threshold = levels.get("high", cfg.high_threshold)
        cfg.medium_threshold = levels.get("medium", cfg.medium_threshold)
        cfg.low_threshold = levels.get("low", cfg.low_threshold)
    
    sigs = CONFIG_DIR / "signatures.json"
    if sigs.exists():
        cfg.signatures_file = str(sigs)
    
    # Resolve db_file relative to project root
    project_root = Path(__file__).parent.parent.parent
    if not os.path.isabs(cfg.db_file):
        cfg.db_file = str(project_root / cfg.db_file)
    if not os.path.isabs(cfg.blocklist_file):
        cfg.blocklist_file = str(project_root / cfg.blocklist_file)
    if not os.path.isabs(cfg.threat_log_file):
        cfg.threat_log_file = str(project_root / cfg.threat_log_file)
    
    # Env overrides
    if os.environ.get("MANTIS_SCAN_INTERVAL"):
        cfg.scan_interval = int(os.environ["MANTIS_SCAN_INTERVAL"])
    if os.environ.get("MANTIS_DB_FILE"):
        cfg.db_file = os.environ["MANTIS_DB_FILE"]
    
    _instance = cfg
    return cfg
