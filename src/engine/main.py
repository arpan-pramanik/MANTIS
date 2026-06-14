"""MANTIS Detection Engine — Main Entry Point."""
import signal
import sys
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
from .mitigations.blocker import apply_block, sync_to_json
from prometheus_client import start_http_server

logger = get_logger()
sec_logger = get_security_logger()
metrics = MetricsTracker()
running = True


def shutdown_handler(signum, frame):
    global running
    logger.info(f"Signal {signum} received. Shutting down engine...")
    running = False


def initialize():
    """Register all detectors."""
    register_detector(MLDetector())
    register_detector(HeuristicDetector())
    register_detector(PayloadAnalyzer())
    register_detector(BehavioralDetector())
    register_detector(SignatureDetector())
    logger.info("All detectors registered")


def scan_cycle():
    """Execute one detection cycle."""
    cfg = get_config()
    start = time.time()

    # Fetch recent logs
    logs = fetch_recent_logs(cfg.analysis_window)
    if not logs:
        return

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

        # Persist threat event
        insert_threat_event(threat.to_dict())

    # Sync blocklist JSON
    if blocked_count > 0:
        sync_to_json()

    duration = time.time() - start
    metrics.record_scan(duration, entity_count)

    if threats:
        logger.warning(
            f"Detected {len(threats)} threats, blocked {blocked_count} "
            f"({entity_count} entities analyzed in {duration:.2f}s)"
        )
        for t in threats[:5]:
            logger.warning(
                f"  → {t.severity} {t.threat_type} from {t.actor_ip} "
                f"(confidence: {t.confidence:.2f}, action: {t.mitigation_action})"
            )
    else:
        logger.info(f"✅ Clean — {entity_count} entities analyzed in {duration:.2f}s")


def main():
    """Main engine loop."""
    cfg = get_config()

    signal.signal(signal.SIGTERM, shutdown_handler)
    signal.signal(signal.SIGINT, shutdown_handler)

    print('')
    print('╔══════════════════════════════════════════════════════════════╗')
    print('║   MANTIS Detection Engine                                  ║')
    print('║   Multi-Layer Threat Detection & Mitigation                 ║')
    print('╚══════════════════════════════════════════════════════════════╝')
    print('')

    logger.info(f"Engine starting (interval: {cfg.scan_interval}s, window: {cfg.analysis_window}s)")
    logger.info(f"Database: {cfg.db_file}")
    logger.info(f"ML contamination: {cfg.ml_contamination}")
    logger.info(f"Block TTL: {cfg.block_ttl}s, Perm threshold: {cfg.perm_block_threshold} strikes")

    try:
        start_http_server(8000)
        logger.info("Prometheus metrics server started on port 8000")
    except Exception as e:
        logger.error(f"Failed to start metrics server: {e}")

    initialize()

    scan_count = 0
    while running:
        try:
            scan_cycle()
            scan_count += 1

            # Periodic metrics report
            if scan_count % 30 == 0:
                m = metrics.export()
                logger.info(f"📊 Metrics: {m['total_detections']} detections, "
                           f"{m['total_blocks']} blocks, "
                           f"{m['avg_scan_time_ms']:.1f}ms avg scan")

        except KeyboardInterrupt:
            break
        except Exception as e:
            logger.error(f"Scan cycle error: {e}", exc_info=True)

        time.sleep(cfg.scan_interval)

    logger.info("Engine shutdown complete")
    final = metrics.export()
    logger.info(f"Final metrics: {final}")


if __name__ == '__main__':
    main()
