"""Adaptive throttling recommendations."""
from collections import defaultdict
import time


class ThrottleManager:
    """Track and recommend throttle levels per IP."""

    def __init__(self):
        self.levels: dict[str, float] = defaultdict(float)
        self.last_update: dict[str, float] = {}
        self.decay_rate: float = 0.95  # Per-minute decay

    def escalate(self, ip: str, amount: float = 1.0) -> float:
        """Increase throttle level for an IP."""
        self._apply_decay(ip)
        self.levels[ip] = min(self.levels[ip] + amount, 10.0)
        self.last_update[ip] = time.time()
        return self.levels[ip]

    def get_level(self, ip: str) -> float:
        """Get current throttle level (0 = none, 10 = max)."""
        self._apply_decay(ip)
        return self.levels[ip]

    def _apply_decay(self, ip: str) -> None:
        if ip in self.last_update:
            elapsed_min = (time.time() - self.last_update[ip]) / 60
            self.levels[ip] *= self.decay_rate ** elapsed_min

    def recommend_delay_ms(self, ip: str) -> int:
        """Recommend delay in ms based on throttle level."""
        level = self.get_level(ip)
        if level < 1:
            return 0
        return int(min(level * 500, 5000))

    def cleanup(self, threshold: float = 0.1) -> None:
        """Remove IPs below threshold."""
        to_remove = [ip for ip, lvl in self.levels.items() if lvl < threshold]
        for ip in to_remove:
            del self.levels[ip]
            self.last_update.pop(ip, None)
