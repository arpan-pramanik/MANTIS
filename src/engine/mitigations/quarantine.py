"""Request quarantine for suspicious-but-unconfirmed actors."""
from collections import defaultdict
import time


class QuarantineManager:
    """Track suspicious actors and promote to blocked after threshold."""

    def __init__(self, promote_threshold: int = 3, decay_rate: float = 0.9):
        self.scores: dict[str, float] = defaultdict(float)
        self.detections: dict[str, int] = defaultdict(int)
        self.last_update: dict[str, float] = {}
        self.promote_threshold = promote_threshold
        self.decay_rate = decay_rate

    def add_suspicion(self, ip: str, score: float = 1.0) -> bool:
        """Add suspicion. Returns True if IP should be promoted to blocked."""
        self._decay(ip)
        self.scores[ip] += score
        self.detections[ip] += 1
        self.last_update[ip] = time.time()
        return self.detections[ip] >= self.promote_threshold

    def get_status(self, ip: str) -> dict:
        self._decay(ip)
        return {
            'ip': ip,
            'score': round(self.scores.get(ip, 0), 3),
            'detections': self.detections.get(ip, 0),
            'quarantined': self.detections.get(ip, 0) > 0,
            'should_block': self.detections.get(ip, 0) >= self.promote_threshold
        }

    def _decay(self, ip: str) -> None:
        if ip in self.last_update:
            elapsed_min = (time.time() - self.last_update[ip]) / 60
            self.scores[ip] *= self.decay_rate ** elapsed_min

    def cleanup(self) -> None:
        to_remove = [ip for ip, s in self.scores.items() if s < 0.1]
        for ip in to_remove:
            del self.scores[ip]
            self.detections.pop(ip, None)
            self.last_update.pop(ip, None)
