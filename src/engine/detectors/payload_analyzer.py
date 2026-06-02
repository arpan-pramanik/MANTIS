"""Deep payload inspection detector."""
import json
import re
import base64
import math
from pathlib import Path

import pandas as pd

from . import BaseDetector, ThreatEvent
from ..config import get_config

MITRE_MAP = {
    'sql_injection': 'T1190', 'xss': 'T1059.007', 'path_traversal': 'T1083',
    'command_injection': 'T1059', 'ssrf': 'T1090', 'reconnaissance': 'T1595',
}


class PayloadAnalyzer(BaseDetector):
    name = "payload_analyzer"
    weight = 2.5

    def __init__(self):
        self.compiled_patterns: dict[str, list[re.Pattern]] = {}
        self.risk_weights: dict[str, int] = {}
        self._load_signatures()

    def _load_signatures(self) -> None:
        cfg = get_config()
        if not cfg.signatures_file:
            return
        try:
            with open(cfg.signatures_file) as f:
                sigs = json.load(f)
            self.risk_weights = sigs.get('risk_weights', {})
            for category, patterns in sigs.get('patterns', {}).items():
                compiled = []
                for p in patterns:
                    try:
                        compiled.append(re.compile(p, re.IGNORECASE))
                    except re.error:
                        pass
                self.compiled_patterns[category] = compiled
        except (FileNotFoundError, json.JSONDecodeError) as e:
            pass

    def _scan_text(self, text: str) -> dict[str, list[str]]:
        """Scan text against all compiled patterns."""
        results: dict[str, list[str]] = {}
        for category, regexes in self.compiled_patterns.items():
            for regex in regexes:
                if regex.search(text):
                    results.setdefault(category, []).append(regex.pattern[:60])
        return results

    def _decode_layers(self, text: str) -> list[str]:
        """Try multi-layer decoding to detect evasion."""
        layers = [text]
        # URL decoding
        from urllib.parse import unquote
        decoded = unquote(text)
        if decoded != text:
            layers.append(decoded)
            double = unquote(decoded)
            if double != decoded:
                layers.append(double)
        # Base64
        try:
            b64 = base64.b64decode(text.encode(), validate=True).decode('utf-8', errors='ignore')
            if len(b64) > 4:
                layers.append(b64)
        except Exception:
            pass
        return layers

    def _char_entropy(self, text: str) -> float:
        """Calculate character-level entropy."""
        if not text:
            return 0.0
        freq: dict[str, int] = {}
        for c in text:
            freq[c] = freq.get(c, 0) + 1
        length = len(text)
        return -sum((count / length) * math.log2(count / length) for count in freq.values())

    def detect(self, df: pd.DataFrame) -> list[ThreatEvent]:
        if df.empty or not self.compiled_patterns:
            return []

        threats: list[ThreatEvent] = []
        
        for _, row in df.iterrows():
            all_matches: dict[str, list[str]] = {}
            texts_to_scan: list[str] = []

            # Collect scannable text
            path = str(row.get('path', ''))
            body = str(row.get('body', ''))
            query = str(row.get('queryParams', ''))
            
            texts_to_scan.extend(self._decode_layers(path))
            if body and body != '{}' and body != '':
                texts_to_scan.extend(self._decode_layers(body))
            if query and query != '{}':
                texts_to_scan.extend(self._decode_layers(query))

            for text in texts_to_scan:
                matches = self._scan_text(text)
                for cat, pats in matches.items():
                    all_matches.setdefault(cat, []).extend(pats)

            if not all_matches:
                continue

            # Calculate threat score
            score = 0
            for cat, pats in all_matches.items():
                weight = self.risk_weights.get(cat, 1)
                score += len(set(pats)) * weight

            if score < 5:
                continue

            # Check for encoded payload evasion
            entropy = self._char_entropy(body)
            if entropy > 5.5:
                all_matches.setdefault('evasion', []).append('high_entropy_payload')
                score += 5

            primary_cat = max(all_matches, key=lambda c: len(all_matches[c]) * self.risk_weights.get(c, 1))
            threat_type = primary_cat.upper()
            confidence = min(score / 40, 0.95)
            severity = 'CRITICAL' if score >= 30 else 'HIGH' if score >= 15 else 'MEDIUM'

            threats.append(ThreatEvent(
                source=self.name,
                threat_type=threat_type,
                severity=severity,
                confidence=round(confidence, 3),
                mitre_tactic=MITRE_MAP.get(primary_cat, ''),
                actor_ip=str(row.get('ip', '')),
                actor_token=str(row.get('token', '')),
                actor_user_agent=str(row.get('userAgent', '')),
                request_method=str(row.get('method', '')),
                request_path=path,
                matched_patterns=[f"{cat}:{','.join(set(pats)[:3])}" for cat, pats in all_matches.items()],
                mitigation_reason=f"Payload analysis: {primary_cat} (score: {score})"
            ))

        return threats
