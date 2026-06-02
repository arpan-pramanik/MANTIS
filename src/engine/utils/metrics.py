"""Detection metrics tracker."""
import time
from collections import defaultdict
from prometheus_client import Counter, Histogram, Gauge

# Prometheus metrics
total_scans_metric = Counter('mantis_engine_scans_total', 'Total number of scan cycles completed')
total_detections_metric = Counter('mantis_engine_threats_detected_total', 'Total number of threats detected', ['threat_type', 'severity'])
total_blocks_metric = Counter('mantis_engine_blocks_total', 'Total number of blocks applied')
scan_duration_metric = Histogram('mantis_engine_scan_duration_seconds', 'Duration of scan cycles')
active_entities_metric = Gauge('mantis_engine_active_entities', 'Number of active entities analyzed in last scan')

class MetricsTracker:
    def __init__(self):
        self.total_scans = 0
        self.total_blocks = 0
        self.total_entities_analyzed = 0
        self.total_scan_time = 0.0
        self.detections_by_type = defaultdict(int)
        self.detections_by_severity = defaultdict(int)
        self._start_time = time.time()

    def record_scan(self, duration_s: float, entities: int) -> None:
        self.total_scans += 1
        self.total_scan_time += duration_s
        self.total_entities_analyzed += entities
        total_scans_metric.inc()
        scan_duration_metric.observe(duration_s)
        active_entities_metric.set(entities)

    def record_detection(self, threat_type: str, severity: str) -> None:
        self.detections_by_type[threat_type] += 1
        self.detections_by_severity[severity] += 1
        total_detections_metric.labels(threat_type=threat_type, severity=severity).inc()

    def record_block(self) -> None:
        self.total_blocks += 1
        total_blocks_metric.inc()

    def get_avg_scan_time(self) -> float:
        if self.total_scans == 0:
            return 0.0
        return self.total_scan_time / self.total_scans

    def export(self) -> dict:
        uptime = time.time() - self._start_time
        total_detections = sum(self.detections_by_type.values())
        return {
            "uptime_seconds": round(uptime, 1),
            "total_scans": self.total_scans,
            "total_detections": total_detections,
            "total_blocks": self.total_blocks,
            "total_entities_analyzed": self.total_entities_analyzed,
            "avg_scan_time_ms": round(self.get_avg_scan_time() * 1000, 2),
            "detections_per_minute": round(total_detections / max(uptime / 60, 1), 2),
            "detections_by_type": dict(self.detections_by_type),
            "detections_by_severity": dict(self.detections_by_severity),
        }
