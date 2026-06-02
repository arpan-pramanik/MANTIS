"""Database operations for the detection engine."""
import sqlite3
import time
import json
from typing import Any
from contextlib import contextmanager
from pathlib import Path

from ..config import get_config

@contextmanager
def get_connection():
    """Get a database connection with WAL mode."""
    cfg = get_config()
    conn = sqlite3.connect(cfg.db_file)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA busy_timeout=5000")
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


def fetch_recent_logs(window_seconds: int | None = None) -> list[dict]:
    """Fetch logs within a time window."""
    cfg = get_config()
    window = window_seconds or cfg.analysis_window
    since = time.strftime('%Y-%m-%dT%H:%M:%S', time.gmtime(time.time() - window))
    
    with get_connection() as conn:
        cursor = conn.execute(
            "SELECT * FROM logs WHERE timestamp >= ? ORDER BY timestamp DESC",
            (since,)
        )
        rows = cursor.fetchall()
        return [dict(row) for row in rows]


def insert_threat_event(event: dict) -> None:
    """Insert a threat event into the database."""
    with get_connection() as conn:
        conn.execute(
            """INSERT OR IGNORE INTO threat_events 
            (eventId, timestamp, source, threatType, severity, confidence, mitreTactic,
             actorIp, actorToken, actorUserAgent, actorFingerprint,
             requestMethod, requestPath, requestBodyHash, requestBodySize,
             matchedPatterns, featureScores, mlScore, heuristicScore, ensembleScore,
             mitigationAction, mitigationDuration, mitigationReason, context)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                event.get('eventId', ''),
                event.get('timestamp', time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())),
                event.get('source', 'engine'),
                event.get('threatType', 'UNKNOWN'),
                event.get('severity', 'MEDIUM'),
                event.get('confidence', 0.0),
                event.get('mitreTactic', ''),
                event.get('actorIp', ''),
                event.get('actorToken', ''),
                event.get('actorUserAgent', ''),
                event.get('actorFingerprint', ''),
                event.get('requestMethod', ''),
                event.get('requestPath', ''),
                event.get('requestBodyHash', ''),
                event.get('requestBodySize', 0),
                json.dumps(event.get('matchedPatterns', [])),
                json.dumps(event.get('featureScores', {})),
                event.get('mlScore', 0.0),
                event.get('heuristicScore', 0.0),
                event.get('ensembleScore', 0.0),
                event.get('mitigationAction', 'none'),
                event.get('mitigationDuration', 0),
                event.get('mitigationReason', ''),
                json.dumps(event.get('context', {}))
            )
        )
        conn.commit()


def add_to_blocklist(ip: str = '', token: str = '', reason: str = '', 
                     severity: str = 'MEDIUM', detected_by: str = 'engine',
                     mitre_tactic: str = '', ttl_seconds: int = 0) -> None:
    """Add an IP or token to the blocklist."""
    now = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    expires = ''
    if ttl_seconds > 0:
        expires = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime(time.time() + ttl_seconds))
    
    with get_connection() as conn:
        # Check if already blocked
        row = conn.execute(
            "SELECT id, strikes FROM blocklist WHERE status='active' AND (ip=? OR token=?) LIMIT 1",
            (ip, token)
        ).fetchone()
        
        if row:
            conn.execute("UPDATE blocklist SET strikes = strikes + 1 WHERE id = ?", (row['id'],))
        else:
            conn.execute(
                """INSERT INTO blocklist (ip, token, reason, severity, detectedBy, mitreTactic, createdAt, expiresAt, strikes, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'active')""",
                (ip, token, reason, severity, detected_by, mitre_tactic, now, expires)
            )
        conn.commit()


def is_blocked(ip: str = '', token: str = '') -> bool:
    """Check if an IP or token is blocked."""
    with get_connection() as conn:
        row = conn.execute(
            "SELECT id FROM blocklist WHERE status='active' AND (ip=? OR token=?) LIMIT 1",
            (ip, token)
        ).fetchone()
        return row is not None


def is_allowlisted(ip: str = '', token: str = '') -> bool:
    """Check if an IP or token is allowlisted."""
    with get_connection() as conn:
        row = conn.execute(
            "SELECT id FROM allowlist WHERE ip=? OR token=? LIMIT 1",
            (ip, token)
        ).fetchone()
        return row is not None


def get_strike_count(ip: str = '', token: str = '') -> int:
    """Get the strike count for an IP or token."""
    with get_connection() as conn:
        row = conn.execute(
            "SELECT strikes FROM blocklist WHERE status='active' AND (ip=? OR token=?) LIMIT 1",
            (ip, token)
        ).fetchone()
        return row['strikes'] if row else 0


def sync_blocklist_json() -> None:
    """Sync the blocklist to JSON file for the Node.js server to read."""
    cfg = get_config()
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT ip, token FROM blocklist WHERE status='active'"
        ).fetchall()
    
    ips = list({r['ip'] for r in rows if r['ip']})
    tokens = list({r['token'] for r in rows if r['token']})
    
    with open(cfg.blocklist_file, 'w') as f:
        json.dump({'ips': ips, 'tokens': tokens}, f, indent=2)
