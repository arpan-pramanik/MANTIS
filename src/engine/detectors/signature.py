"""Known attack signature matching detector."""
import json
import re
from pathlib import Path

import pandas as pd

from . import BaseDetector, ThreatEvent
from ..config import get_config

SCANNER_UAS = [
    'nikto', 'nmap', 'sqlmap', 'burp', 'zap', 'nuclei', 'masscan', 'gobuster',
    'dirbuster', 'wfuzz', 'hydra', 'medusa', 'w3af', 'arachni', 'acunetix',
    'nessus', 'openvas', 'qualys', 'skipfish', 'wapiti', 'whatweb', 'joomscan',
    'wpscan', 'droopescan', 'cmsmap', 'xsstrike', 'commix', 'tplmap'
]


class SignatureDetector(BaseDetector):
    name = "signature"
    weight = 2.0

    def __init__(self):
        self.patterns: dict[str, list[re.Pattern]] = {}
        self.risk_weights: dict[str, int] = {}
        self.mitre_map: dict[str, str] = {}
        self._load()

    def _load(self) -> None:
        cfg = get_config()
        if not cfg.signatures_file:
            return
        try:
            with open(cfg.signatures_file) as f:
                sigs = json.load(f)
            self.risk_weights = sigs.get('risk_weights', {})
            self.mitre_map = sigs.get('mitre_mapping', {})
            for cat, pats in sigs.get('patterns', {}).items():
                compiled = []
                for p in pats:
                    try:
                        compiled.append(re.compile(p, re.IGNORECASE))
                    except re.error:
                        pass
                self.patterns[cat] = compiled
        except (FileNotFoundError, json.JSONDecodeError):
            pass

    def detect(self, df: pd.DataFrame) -> list[ThreatEvent]:
        if df.empty:
            return []

        threats: list[ThreatEvent] = []

        for _, row in df.iterrows():
            ua = str(row.get('userAgent', '')).lower()
            path = str(row.get('path', ''))
            body = str(row.get('body', ''))

            # Known scanner detection
            for scanner in SCANNER_UAS:
                if scanner in ua:
                    threats.append(ThreatEvent(
                        source=self.name,
                        threat_type='RECONNAISSANCE',
                        severity='HIGH',
                        confidence=0.9,
                        mitre_tactic='T1595.002',
                        actor_ip=str(row.get('ip', '')),
                        actor_user_agent=ua,
                        request_path=path,
                        matched_patterns=[f'scanner_ua:{scanner}'],
                        mitigation_reason=f"Known scanner detected: {scanner}"
                    ))
                    break

            # Signature matching against path and body
            text = f"{path} {body}"
            matched: dict[str, list[str]] = {}
            for cat, regexes in self.patterns.items():
                for regex in regexes:
                    if regex.search(text):
                        matched.setdefault(cat, []).append(regex.pattern[:40])

            if matched:
                primary = max(matched, key=lambda c: len(matched[c]) * self.risk_weights.get(c, 1))
                score = sum(len(pats) * self.risk_weights.get(cat, 1) for cat, pats in matched.items())

                if score >= 5:
                    threats.append(ThreatEvent(
                        source=self.name,
                        threat_type=primary.upper(),
                        severity='CRITICAL' if score >= 20 else 'HIGH' if score >= 10 else 'MEDIUM',
                        confidence=min(score / 30, 0.95),
                        mitre_tactic=self.mitre_map.get(primary, ''),
                        actor_ip=str(row.get('ip', '')),
                        actor_token=str(row.get('token', '')),
                        request_method=str(row.get('method', '')),
                        request_path=path,
                        matched_patterns=[f"{c}:{len(p)}_matches" for c, p in matched.items()],
                        mitigation_reason=f"Signature match: {primary} (score: {score})"
                    ))

        return threats
