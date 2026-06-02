"""ML-based anomaly detection using ensemble methods."""
import warnings
warnings.filterwarnings('ignore')

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.neighbors import LocalOutlierFactor
from sklearn.cluster import DBSCAN
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler

from . import BaseDetector, ThreatEvent
from ..models.features import extract_ip_features, FEATURE_NAMES
from ..config import get_config


class MLDetector(BaseDetector):
    name = "ml_detector"
    weight = 2.0

    def detect(self, df: pd.DataFrame) -> list[ThreatEvent]:
        if df.empty or len(df) < 5:
            return []

        cfg = get_config()
        features_list = []
        ips = df['ip'].unique() if 'ip' in df.columns else []

        for ip in ips:
            feat = extract_ip_features(df, ip, df)
            features_list.append(feat)

        if not features_list:
            return []

        X = pd.DataFrame(features_list).fillna(0)
        numeric_cols = [c for c in X.select_dtypes(include=[np.number]).columns if c not in ['ip', 'token']]

        if not numeric_cols:
            return []

        X_num = X[numeric_cols].fillna(0)
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X_num)

        anomaly_indices: set[int] = set()

        # 1. Isolation Forest
        iso = IsolationForest(
            contamination=cfg.ml_contamination,
            n_estimators=200,
            random_state=42,
            max_samples='auto'
        )
        iso_preds = iso.fit_predict(X_scaled)
        iso_scores = iso.decision_function(X_scaled)
        anomaly_indices.update(np.where(iso_preds == -1)[0])

        # 2. Local Outlier Factor
        n_neighbors = min(20, len(X) - 1)
        if n_neighbors > 1:
            lof = LocalOutlierFactor(n_neighbors=n_neighbors, contamination=cfg.ml_contamination)
            lof_preds = lof.fit_predict(X_scaled)
            anomaly_indices.update(np.where(lof_preds == -1)[0])

        # 3. DBSCAN clustering (noise points = -1 = anomalies)
        if len(X) > 10:
            dbscan = DBSCAN(eps=1.5, min_samples=3)
            clusters = dbscan.fit_predict(X_scaled)
            anomaly_indices.update(np.where(clusters == -1)[0])

        # 4. PCA reconstruction error
        if len(X) > 10 and X_scaled.shape[1] > 2:
            n_components = min(5, X_scaled.shape[1])
            pca = PCA(n_components=n_components)
            X_pca = pca.fit_transform(X_scaled)
            recon = pca.inverse_transform(X_pca)
            recon_err = np.mean((X_scaled - recon) ** 2, axis=1)
            threshold = np.percentile(recon_err, 90)
            anomaly_indices.update(np.where(recon_err > threshold)[0])

        # Build threat events
        threats: list[ThreatEvent] = []
        for idx in anomaly_indices:
            row = X.iloc[idx]
            ip = str(row.get('ip', ''))
            token = str(row.get('token', ''))

            # Calculate confidence from anomaly score
            iso_score = float(iso_scores[idx]) if idx < len(iso_scores) else 0
            confidence = min(max(0.5 - iso_score, 0.3), 0.95)

            # Determine threat type from dominant features
            threat_type = self._classify_threat(row)
            severity = self._severity_from_confidence(confidence)

            threats.append(ThreatEvent(
                source=self.name,
                threat_type=threat_type,
                severity=severity,
                confidence=round(confidence, 3),
                actor_ip=ip,
                actor_token=token,
                feature_scores={k: round(float(v), 4) for k, v in row.items() if k not in ['ip', 'token'] and isinstance(v, (int, float, np.floating))},
                ml_score=round(confidence, 3),
                mitigation_reason=f"ML anomaly detected (score: {confidence:.2f})"
            ))

        return threats

    def _classify_threat(self, row: pd.Series) -> str:
        """Classify threat type from feature values."""
        if row.get('botnet_score', 0) > 3:
            return 'BOTNET'
        if row.get('auth_failure_rate', 0) > 0.5:
            return 'BRUTE_FORCE'
        if row.get('rate', 0) > 100:
            return 'DDOS'
        if row.get('reconnaissance_score', 0) > 0.3:
            return 'RECONNAISSANCE'
        if row.get('data_exfil_score', 0) > 0.5:
            return 'DATA_EXFILTRATION'
        if row.get('evasion_score', 0) > 0.6:
            return 'EVASION'
        if row.get('error_rate', 0) > 0.3:
            return 'API_ABUSE'
        return 'BEHAVIORAL_ANOMALY'

    def _severity_from_confidence(self, confidence: float) -> str:
        cfg = get_config()
        if confidence >= cfg.critical_threshold:
            return 'CRITICAL'
        if confidence >= cfg.high_threshold:
            return 'HIGH'
        if confidence >= cfg.medium_threshold:
            return 'MEDIUM'
        return 'LOW'
