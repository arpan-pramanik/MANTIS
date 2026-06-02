"""Rule-based heuristic detection."""
import re
import pandas as pd
from . import BaseDetector, ThreatEvent
from ..models.features import extract_ip_features


KNOWN_BAD_UAS = [
    'bot', 'curl', 'scrapy', 'python-requests', 'wget', 'spider', 'scanner',
    'nikto', 'sqlmap', 'nmap', 'burp', 'zap', 'nuclei', 'masscan', 'gobuster',
    'dirbuster', 'wfuzz', 'hydra', 'medusa', 'w3af', 'arachni'
]

MITRE_MAP = {
    'DDOS': 'T1498', 'BRUTE_FORCE': 'T1110', 'CREDENTIAL_STUFFING': 'T1110.004',
    'RECONNAISSANCE': 'T1595', 'API_ABUSE': 'T1106', 'EVASION': 'T1036',
    'BOTNET': 'T1583.005', 'DATA_EXFILTRATION': 'T1041',
}


class HeuristicDetector(BaseDetector):
    name = "heuristic"
    weight = 1.5

    def __init__(self):
        self.thresholds = {
            'rate': 50, 'unique_endpoints': 8, 'entropy_tokens': 1.5,
            'ua_score': 0.3, 'burstiness': 3.0, 'botnet_score': 2.0,
            'error_rate': 0.3, 'auth_failure_rate': 0.5, 'data_exfil_score': 0.5,
            'reconnaissance_score': 0.3, 'evasion_score': 0.6, 'polymorphic_score': 0.7,
        }
        self.weights = {
            'rate': 3, 'unique_endpoints': 2, 'entropy_tokens': 2, 'ua_score': 2,
            'burstiness': 2, 'botnet_score': 3, 'error_rate': 3, 'auth_failure_rate': 4,
            'data_exfil_score': 4, 'reconnaissance_score': 3, 'evasion_score': 3,
            'polymorphic_score': 3,
        }

    def detect(self, df: pd.DataFrame) -> list[ThreatEvent]:
        if df.empty:
            return []

        threats: list[ThreatEvent] = []
        ips = df['ip'].unique() if 'ip' in df.columns else []

        for ip in ips:
            feat = extract_ip_features(df, ip, df)
            score = 0.0
            triggered_rules: list[str] = []

            for key, threshold in self.thresholds.items():
                val = feat.get(key, 0)
                if val > threshold:
                    weight = self.weights.get(key, 1)
                    score += weight
                    triggered_rules.append(f"{key}={val:.2f}>{threshold}")

            # Check for known bad user agents
            if 'userAgent' in df.columns:
                group_uas = df[df['ip'] == ip]['userAgent'].tolist()
                for ua in group_uas:
                    ua_lower = str(ua).lower()
                    for bad in KNOWN_BAD_UAS:
                        if bad in ua_lower:
                            score += 2
                            triggered_rules.append(f"bad_ua={bad}")
                            break

            if score >= 6:  # Threshold for heuristic detection
                threat_type = self._classify(feat)
                confidence = min(score / 30, 0.95)
                severity = 'CRITICAL' if score >= 20 else 'HIGH' if score >= 12 else 'MEDIUM'

                threats.append(ThreatEvent(
                    source=self.name,
                    threat_type=threat_type,
                    severity=severity,
                    confidence=round(confidence, 3),
                    mitre_tactic=MITRE_MAP.get(threat_type, ''),
                    actor_ip=ip,
                    actor_token=str(feat.get('token', '')),
                    matched_patterns=triggered_rules[:10],
                    heuristic_score=round(score, 2),
                    feature_scores={k: round(float(v), 4) for k, v in feat.items()
                                  if k not in ['ip', 'token'] and isinstance(v, (int, float))},
                    mitigation_reason=f"Heuristic rules triggered (score: {score:.1f})"
                ))

        return threats

    def _classify(self, feat: dict) -> str:
        if feat.get('rate', 0) > 100:
            return 'DDOS'
        if feat.get('auth_failure_rate', 0) > 0.5:
            return 'BRUTE_FORCE'
        if feat.get('botnet_score', 0) > 3:
            return 'BOTNET'
        if feat.get('reconnaissance_score', 0) > 0.3:
            return 'RECONNAISSANCE'
        if feat.get('data_exfil_score', 0) > 0.5:
            return 'DATA_EXFILTRATION'
        if feat.get('evasion_score', 0) > 0.6:
            return 'EVASION'
        return 'API_ABUSE'
