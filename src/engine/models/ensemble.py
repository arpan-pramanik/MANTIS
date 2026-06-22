"""Ensemble model orchestration — aggregates all detectors."""
import pandas as pd
from collections import defaultdict

from ..detectors import ThreatEvent, get_all_detectors
from ..utils.logging_config import get_logger

logger = get_logger()


def run_ensemble(df: pd.DataFrame) -> list[ThreatEvent]:
    """Run all registered detectors and aggregate results."""
    all_threats: list[ThreatEvent] = []
    detectors = get_all_detectors()

    for detector in detectors:
        try:
            threats = detector.detect(df)
            for t in threats:
                t.ensemble_score = t.confidence * detector.weight
            all_threats.extend(threats)
        except Exception as e:
            logger.error(f"Detector {detector.name} failed: {e}")

    # Deduplicate by actor IP — merge multiple detections for same IP
    deduped = deduplicate_threats(all_threats)

    # Calibrate confidence based on number of detectors agreeing
    calibrate_confidence(deduped)

    return deduped


def deduplicate_threats(threats: list[ThreatEvent]) -> list[ThreatEvent]:
    """Merge threats for the same actor IP, keeping highest severity."""
    by_ip: dict[str, list[ThreatEvent]] = defaultdict(list)
    for t in threats:
        key = t.actor_ip or t.actor_token or t.event_id
        by_ip[key].append(t)

    merged: list[ThreatEvent] = []
    severity_order = {'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1, 'INFO': 0}

    for key, group in by_ip.items():
        if len(group) == 1:
            merged.append(group[0])
            continue

        # Take the highest severity detection
        best = max(group, key=lambda t: (severity_order.get(t.severity, 0), t.confidence))
        # Merge info from all detections
        all_sources = list(set(t.source for t in group))
        all_types = list(set(t.threat_type for t in group))
        all_patterns = []
        for t in group:
            all_patterns.extend(t.matched_patterns)

        best.matched_patterns = list(set(all_patterns))[:20]
        best.context = {
            'detecting_engines': all_sources,
            'threat_types_detected': all_types,
            'detection_count': len(group),
        }
        best.ensemble_score = sum(t.ensemble_score for t in group) / len(group)
        merged.append(best)

    return merged


def calibrate_confidence(threats: list[ThreatEvent]) -> None:
    """
    Boost confidence when multiple independent engines (ML, Deterministic, Heuristic) agree.
    
    Note: The 1.3x and 1.15x multipliers are heuristic calibrations based on 
    validation set tuning. When 3+ orthogonal detectors flag the same actor, 
    the probability of a true positive approaches 1.0, so we heavily weight consensus.
    """
    for t in threats:
        detection_count = t.context.get('detection_count', 1)
        if detection_count >= 3:
            t.confidence = min(t.confidence * 1.3, 0.99)
            t.severity = 'CRITICAL' if t.severity in ('HIGH', 'CRITICAL') else t.severity
        elif detection_count >= 2:
            t.confidence = min(t.confidence * 1.15, 0.95)
