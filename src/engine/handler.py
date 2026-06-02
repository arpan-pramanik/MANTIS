"""MANTIS Detection Engine — AWS Lambda Entry Point."""
import time
import pandas as pd

from .config import get_config
from .utils.logging_config import get_logger, get_security_logger
from .utils.metrics import MetricsTracker
from .utils.db import fetch_recent_logs, insert_threat_event
from .detectors import register_detector
from .detectors.ml_detector import MLDetector
from .detectors.heuristic import HeuristicDetector
from .detectors.payload_analyzer import PayloadAnalyzer
from .detectors.behavioral import BehavioralDetector
from .detectors.signature import SignatureDetector
from .models.ensemble import run_ensemble
from .mitigations.blocker import apply_block

logger = get_logger()
metrics = MetricsTracker()

# Initialize once per cold start
def initialize():
    """Register all detectors."""
    register_detector(MLDetector())
    register_detector(HeuristicDetector())
    register_detector(PayloadAnalyzer())
    register_detector(BehavioralDetector())
    register_detector(SignatureDetector())
    logger.info("All detectors registered for AWS Lambda cold start")

initialize()

def lambda_handler(event, context):
    """AWS Lambda entry point for MANTIS Threat Engine."""
    cfg = get_config()
    start = time.time()
    logger.info(f"Lambda execution started. Window: {cfg.analysis_window}s")

    # Fetch recent logs from DynamoDB
    logs = fetch_recent_logs(cfg.analysis_window)
    if not logs:
        logger.info("No recent logs to analyze.")
        return {"statusCode": 200, "body": "No logs to analyze."}

    df = pd.DataFrame(logs)
    entity_count = df['ip'].nunique() if 'ip' in df.columns else 0

    # Run ensemble detection
    threats = run_ensemble(df)

    # Apply mitigations
    blocked_count = 0
    for threat in threats:
        action = apply_block(threat)
        threat.mitigation_action = action
        metrics.record_detection(threat.threat_type, threat.severity)

        if action in ('tempBlock', 'permBlock'):
            blocked_count += 1
            metrics.record_block()

        # Persist threat event to DynamoDB
        insert_threat_event(threat.to_dict())

    duration = time.time() - start
    metrics.record_scan(duration, entity_count)

    if threats:
        logger.warning(
            f"🚨 Detected {len(threats)} threats, blocked {blocked_count} "
            f"({entity_count} entities analyzed in {duration:.2f}s)"
        )
    else:
        logger.info(f"✅ Clean — {entity_count} entities analyzed in {duration:.2f}s")

    return {
        "statusCode": 200,
        "body": {
            "threats_detected": len(threats),
            "blocks_applied": blocked_count,
            "duration_sec": round(duration, 2)
        }
    }
