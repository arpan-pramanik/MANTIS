"""Detector registry and base classes."""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import ClassVar
import uuid
import time

import pandas as pd


@dataclass
class ThreatEvent:
    """Standardized threat event."""
    event_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: str = field(default_factory=lambda: time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()))
    source: str = ""
    threat_type: str = "UNKNOWN"
    severity: str = "MEDIUM"
    confidence: float = 0.0
    mitre_tactic: str = ""
    actor_ip: str = ""
    actor_token: str = ""
    actor_user_agent: str = ""
    actor_fingerprint: str = ""
    request_method: str = ""
    request_path: str = ""
    matched_patterns: list = field(default_factory=list)
    feature_scores: dict = field(default_factory=dict)
    ml_score: float = 0.0
    heuristic_score: float = 0.0
    ensemble_score: float = 0.0
    mitigation_action: str = "none"
    mitigation_duration: int = 0
    mitigation_reason: str = ""
    context: dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {
            "eventId": self.event_id,
            "timestamp": self.timestamp,
            "source": self.source,
            "threatType": self.threat_type,
            "severity": self.severity,
            "confidence": self.confidence,
            "mitreTactic": self.mitre_tactic,
            "actorIp": self.actor_ip,
            "actorToken": self.actor_token,
            "actorUserAgent": self.actor_user_agent,
            "actorFingerprint": self.actor_fingerprint,
            "requestMethod": self.request_method,
            "requestPath": self.request_path,
            "matchedPatterns": self.matched_patterns,
            "featureScores": self.feature_scores,
            "mlScore": self.ml_score,
            "heuristicScore": self.heuristic_score,
            "ensembleScore": self.ensemble_score,
            "mitigationAction": self.mitigation_action,
            "mitigationDuration": self.mitigation_duration,
            "mitigationReason": self.mitigation_reason,
            "context": self.context,
        }


class BaseDetector(ABC):
    """Abstract base class for all detectors."""
    name: str = "base"
    weight: float = 1.0

    @abstractmethod
    def detect(self, df: pd.DataFrame) -> list[ThreatEvent]:
        """Run detection on a DataFrame of request logs. Returns threat events."""
        ...


# Detector registry
_registry: dict[str, BaseDetector] = {}

def register_detector(detector: BaseDetector) -> None:
    _registry[detector.name] = detector

def get_detector(name: str) -> BaseDetector | None:
    return _registry.get(name)

def get_all_detectors() -> list[BaseDetector]:
    return list(_registry.values())
