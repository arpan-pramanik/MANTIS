"""MANTIS Detection Engine Unit Tests."""
import sys
import os
import time
import json
import sqlite3
import tempfile
import unittest
from unittest.mock import patch, MagicMock
from pathlib import Path

# Add project root to path
PROJECT_ROOT = Path(__file__).parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

import pandas as pd
import numpy as np


class TestFeatureEngineering(unittest.TestCase):
    """Test feature extraction functions."""

    def test_entropy_empty(self):
        from src.engine.models.features import entropy
        self.assertEqual(entropy([]), 0.0)

    def test_entropy_uniform(self):
        from src.engine.models.features import entropy
        result = entropy(['a', 'b', 'c', 'd'])
        self.assertAlmostEqual(result, 2.0, places=1)

    def test_entropy_single(self):
        from src.engine.models.features import entropy
        result = entropy(['a', 'a', 'a'])
        self.assertAlmostEqual(result, 0.0, places=1)

    def test_ua_score_bot(self):
        from src.engine.models.features import ua_score
        score = ua_score(['sqlmap/1.4', 'nikto/2.1'])
        self.assertGreater(score, 0.5)

    def test_ua_score_browser(self):
        from src.engine.models.features import ua_score
        score = ua_score(['Mozilla/5.0 Chrome/91.0'])
        self.assertEqual(score, 0.0)

    def test_burstiness_regular(self):
        from src.engine.models.features import burstiness
        timestamps = [f"2024-01-01T00:00:{i:02d}Z" for i in range(10)]
        result = burstiness(timestamps)
        self.assertLess(result, 1.0)  # Regular intervals = low burstiness

    def test_session_length(self):
        from src.engine.models.features import session_length
        timestamps = ["2024-01-01T00:00:00Z", "2024-01-01T00:10:00Z"]
        result = session_length(timestamps)
        self.assertAlmostEqual(result, 600.0, places=0)

    def test_error_rate(self):
        from src.engine.models.features import error_rate
        paths = ['/admin', '/config', '/api/v1/users', '/.env']
        rate = error_rate(paths)
        self.assertAlmostEqual(rate, 0.75, places=2)

    def test_reconnaissance_score(self):
        from src.engine.models.features import reconnaissance_score
        paths = ['/robots.txt', '/sitemap.xml', '/api/v1/health', '/.well-known/openid']
        methods = ['GET'] * 4
        score = reconnaissance_score(paths, methods)
        self.assertGreater(score, 0.5)

    def test_extract_ip_features(self):
        from src.engine.models.features import extract_ip_features, FEATURE_NAMES
        df = pd.DataFrame({
            'ip': ['1.2.3.4'] * 10,
            'token': ['tok1'] * 10,
            'path': ['/api/v1/users'] * 10,
            'method': ['GET'] * 10,
            'userAgent': ['Chrome/91'] * 10,
            'body': [''] * 10,
            'timestamp': [f"2024-01-01T00:00:{i:02d}Z" for i in range(10)]
        })
        features = extract_ip_features(df, '1.2.3.4')
        self.assertEqual(features['rate'], 10)
        self.assertEqual(features['unique_endpoints'], 1)


class TestDetectors(unittest.TestCase):
    """Test individual detectors."""

    def _make_df(self, n=20, ip='192.168.1.100', paths=None, uas=None, methods=None, bodies=None):
        """Create a test DataFrame."""
        return pd.DataFrame({
            'ip': [ip] * n,
            'token': [f'tok_{i}' for i in range(n)],
            'path': (paths or ['/api/v1/users']) * n if not paths else paths[:n] + ['/api/v1/users'] * max(0, n - len(paths)),
            'method': (methods or ['GET']) * n if not methods else methods[:n] + ['GET'] * max(0, n - len(methods)),
            'userAgent': (uas or ['Chrome/91']) * n if not uas else uas[:n] + ['Chrome/91'] * max(0, n - len(uas)),
            'body': (bodies or ['']) * n if not bodies else bodies[:n] + [''] * max(0, n - len(bodies)),
            'timestamp': [f"2024-01-01T00:00:{i:02d}Z" for i in range(n)],
            'queryParams': ['{}'] * n,
        })

    def test_heuristic_clean(self):
        """Clean traffic should not trigger heuristic detector."""
        from src.engine.detectors.heuristic import HeuristicDetector
        detector = HeuristicDetector()
        df = self._make_df(5)
        threats = detector.detect(df)
        self.assertEqual(len(threats), 0)

    def test_heuristic_scanner(self):
        """Scanner UAs should trigger heuristic detector."""
        from src.engine.detectors.heuristic import HeuristicDetector
        detector = HeuristicDetector()
        df = self._make_df(20, uas=['sqlmap/1.4'] * 20,
                          paths=[f'/admin{i}' for i in range(20)])
        threats = detector.detect(df)
        self.assertGreater(len(threats), 0)

    def test_signature_scanner_ua(self):
        """Known scanner UAs should be detected by signature detector."""
        from src.engine.detectors.signature import SignatureDetector
        detector = SignatureDetector()
        df = self._make_df(5, uas=['Nikto/2.1.6'] * 5)
        threats = detector.detect(df)
        scanner_threats = [t for t in threats if 'scanner' in str(t.matched_patterns).lower()]
        self.assertGreater(len(scanner_threats), 0)

    def test_behavioral_clean(self):
        """Clean traffic should not trigger behavioral detector."""
        from src.engine.detectors.behavioral import BehavioralDetector
        detector = BehavioralDetector()
        df = self._make_df(3)
        threats = detector.detect(df)
        self.assertEqual(len(threats), 0)

    def test_payload_analyzer_sqli(self):
        """SQL injection payloads should be detected."""
        from src.engine.detectors.payload_analyzer import PayloadAnalyzer
        detector = PayloadAnalyzer()
        if not detector.compiled_patterns:
            self.skipTest("Signatures not loaded")
        df = self._make_df(5, bodies=["' OR 1=1 --"] * 5,
                          paths=["/api/v1/users?id=1' OR 1=1--"] * 5)
        threats = detector.detect(df)
        self.assertGreater(len(threats), 0)


class TestThreatEvent(unittest.TestCase):
    """Test ThreatEvent dataclass."""

    def test_to_dict(self):
        from src.engine.detectors import ThreatEvent
        event = ThreatEvent(
            source='test',
            threat_type='SQL_INJECTION',
            severity='HIGH',
            confidence=0.85,
            actor_ip='192.168.1.1'
        )
        d = event.to_dict()
        self.assertEqual(d['source'], 'test')
        self.assertEqual(d['threatType'], 'SQL_INJECTION')
        self.assertEqual(d['severity'], 'HIGH')
        self.assertEqual(d['actorIp'], '192.168.1.1')


class TestMetrics(unittest.TestCase):
    """Test metrics tracker."""

    def test_record_detection(self):
        from src.engine.utils.metrics import MetricsTracker
        m = MetricsTracker()
        m.record_detection('SQL_INJECTION', 'HIGH')
        m.record_detection('XSS', 'MEDIUM')
        self.assertEqual(m.total_detections, 2)
        self.assertEqual(m.detections_by_type['SQL_INJECTION'], 1)

    def test_export(self):
        from src.engine.utils.metrics import MetricsTracker
        m = MetricsTracker()
        m.record_scan(0.5, 10)
        exported = m.export()
        self.assertEqual(exported['total_scans'], 1)
        self.assertGreater(exported['avg_scan_time_ms'], 0)


class TestMitigations(unittest.TestCase):
    """Test mitigation components."""

    def test_throttle_escalate(self):
        from src.engine.mitigations.throttler import ThrottleManager
        tm = ThrottleManager()
        tm.escalate('1.2.3.4', 2.0)
        self.assertGreater(tm.get_level('1.2.3.4'), 0)

    def test_throttle_delay(self):
        from src.engine.mitigations.throttler import ThrottleManager
        tm = ThrottleManager()
        tm.escalate('1.2.3.4', 5.0)
        delay = tm.recommend_delay_ms('1.2.3.4')
        self.assertGreater(delay, 0)

    def test_quarantine_promote(self):
        from src.engine.mitigations.quarantine import QuarantineManager
        qm = QuarantineManager(promote_threshold=3)
        self.assertFalse(qm.add_suspicion('1.2.3.4'))
        self.assertFalse(qm.add_suspicion('1.2.3.4'))
        self.assertTrue(qm.add_suspicion('1.2.3.4'))


if __name__ == '__main__':
    unittest.main(verbosity=2)
