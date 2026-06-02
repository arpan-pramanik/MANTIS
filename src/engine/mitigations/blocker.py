"""IP/token blocking with graduated response."""
import json
from ..utils.db import add_to_blocklist, is_blocked, is_allowlisted, get_strike_count, sync_blocklist_json
from ..utils.logging_config import get_logger, get_security_logger
from ..config import get_config
from ..detectors import ThreatEvent

logger = get_logger()
sec_logger = get_security_logger()

SEVERITY_TTL = {
    'CRITICAL': 0,       # Permanent
    'HIGH': 7200,        # 2 hours
    'MEDIUM': 3600,      # 1 hour
    'LOW': 1800,         # 30 minutes
}


def apply_block(threat: ThreatEvent) -> str:
    """Apply blocking based on threat severity and strike history."""
    cfg = get_config()
    ip = threat.actor_ip
    token = threat.actor_token

    if not ip and not token:
        return 'skipped'

    # Check allowlist
    if is_allowlisted(ip, token):
        logger.info(f"Skipping block for allowlisted entity: {ip}")
        return 'allowlisted'

    # Check existing blocks
    if is_blocked(ip, token):
        strikes = get_strike_count(ip, token)
        if strikes >= cfg.perm_block_threshold:
            add_to_blocklist(
                ip=ip, token=token,
                reason=threat.mitigation_reason,
                severity=threat.severity,
                detected_by=threat.source,
                mitre_tactic=threat.mitre_tactic,
                ttl_seconds=0  # Permanent
            )
            sec_logger.info("PERMANENT_BLOCK", extra={'extra_data': {
                'ip': ip, 'strikes': strikes + 1, 'severity': threat.severity
            }})
            return 'permBlock'
        else:
            add_to_blocklist(
                ip=ip, token=token,
                reason=threat.mitigation_reason,
                severity=threat.severity,
                detected_by=threat.source,
                mitre_tactic=threat.mitre_tactic,
                ttl_seconds=SEVERITY_TTL.get(threat.severity, 3600)
            )
            return 'strikeAdded'

    # New block
    ttl = SEVERITY_TTL.get(threat.severity, cfg.block_ttl)
    add_to_blocklist(
        ip=ip, token=token,
        reason=threat.mitigation_reason,
        severity=threat.severity,
        detected_by=threat.source,
        mitre_tactic=threat.mitre_tactic,
        ttl_seconds=ttl
    )

    sec_logger.info("NEW_BLOCK", extra={'extra_data': {
        'ip': ip, 'severity': threat.severity,
        'threat_type': threat.threat_type, 'ttl': ttl
    }})

    return 'tempBlock' if ttl > 0 else 'permBlock'


def sync_to_json() -> None:
    """Sync the blocklist to JSON for the Node.js gateway."""
    try:
        sync_blocklist_json()
    except Exception as e:
        logger.error(f"Failed to sync blocklist JSON: {e}")
