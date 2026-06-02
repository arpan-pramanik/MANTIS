"""Behavioral analysis detector."""
import pandas as pd
import numpy as np
from . import BaseDetector, ThreatEvent
from ..models.features import (burstiness, timing_variance, session_length,
                                 fingerprint_variation, evasion_score, method_diversity,
                                 request_interval_regularity)


class BehavioralDetector(BaseDetector):
    name = "behavioral"
    weight = 1.5

    def detect(self, df: pd.DataFrame) -> list[ThreatEvent]:
        if df.empty:
            return []

        threats: list[ThreatEvent] = []
        ips = df['ip'].unique() if 'ip' in df.columns else []

        for ip in ips:
            group = df[df['ip'] == ip]
            if len(group) < 5:
                continue

            timestamps = group['timestamp'].tolist()
            uas = group['userAgent'].tolist() if 'userAgent' in group.columns else []
            methods = group['method'].tolist() if 'method' in group.columns else []
            paths = group['path'].tolist() if 'path' in group.columns else []
            tokens = group['token'].tolist() if 'token' in group.columns else []

            anomalies: list[str] = []
            score = 0.0

            # Bot detection: suspiciously regular intervals
            regularity = request_interval_regularity(timestamps)
            if regularity > 0.8:
                anomalies.append(f"bot_like_regularity={regularity:.2f}")
                score += 4

            # Timing variance extremes
            tv = timing_variance(timestamps)
            if tv < 0.01 and len(group) > 10:
                anomalies.append(f"machine_timing={tv:.4f}")
                score += 3

            # Burst detection
            burst = burstiness(timestamps)
            if burst > 5:
                anomalies.append(f"burst={burst:.2f}")
                score += 3

            # Session anomaly: very long persistent sessions
            sess = session_length(timestamps)
            if sess > 600 and len(group) > 50:
                anomalies.append(f"long_session={sess:.0f}s")
                score += 2

            # Fingerprint inconsistency (UA changes mid-session)
            fp_var = fingerprint_variation(uas, [ip] * len(uas))
            if fp_var > 0.5 and len(group) > 5:
                anomalies.append(f"fingerprint_drift={fp_var:.2f}")
                score += 3

            # Unusual method distribution
            md = method_diversity(methods)
            delete_ratio = sum(1 for m in methods if m == 'DELETE') / max(len(methods), 1)
            if delete_ratio > 0.3:
                anomalies.append(f"high_delete_ratio={delete_ratio:.2f}")
                score += 3

            # Endpoint scanning behavior
            unique_paths = len(set(str(p) for p in paths))
            if unique_paths > 10 and len(group) < unique_paths * 2:
                anomalies.append(f"endpoint_scanning={unique_paths}")
                score += 3

            # Evasion detection
            evasion = evasion_score(uas, tokens, paths)
            if evasion > 0.7:
                anomalies.append(f"evasion={evasion:.2f}")
                score += 3

            if score >= 6:
                confidence = min(score / 20, 0.9)
                severity = 'HIGH' if score >= 10 else 'MEDIUM'
                threat_type = 'BOTNET' if regularity > 0.8 else 'EVASION' if evasion > 0.7 else 'BEHAVIORAL_ANOMALY'

                threats.append(ThreatEvent(
                    source=self.name,
                    threat_type=threat_type,
                    severity=severity,
                    confidence=round(confidence, 3),
                    actor_ip=ip,
                    actor_token=str(tokens[0]) if tokens else '',
                    matched_patterns=anomalies,
                    feature_scores={
                        'regularity': round(regularity, 3),
                        'burst': round(burst, 3),
                        'session': round(sess, 1),
                        'fingerprint_var': round(fp_var, 3),
                        'evasion': round(evasion, 3),
                    },
                    mitigation_reason=f"Behavioral anomaly (score: {score:.1f})"
                ))

        return threats
