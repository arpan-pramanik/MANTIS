"""Database operations for the detection engine."""
import time
import json
import os
import boto3
from boto3.dynamodb.conditions import Key, Attr
from typing import Any

from ..config import get_config

dynamodb = boto3.resource('dynamodb')

LOGS_TABLE = os.environ.get('LOGS_TABLE', 'mantis-logs')
BLOCKLIST_TABLE = os.environ.get('BLOCKLIST_TABLE', 'mantis-blocklist')

logs_table = dynamodb.Table(LOGS_TABLE)
blocklist_table = dynamodb.Table(BLOCKLIST_TABLE)

def fetch_recent_logs(window_seconds: int | None = None) -> list[dict]:
    """Fetch logs within a time window from DynamoDB."""
    cfg = get_config()
    window = window_seconds or cfg.analysis_window
    since = time.time() - window
    
    # In DynamoDB, scanning the entire table for a timestamp is inefficient, but for this conversion:
    # A GSI on type='log' and timestamp range would be best. Assuming scan for simplicity in serverless demo.
    response = logs_table.scan(
        FilterExpression=Attr('type').eq('log') & Attr('timestamp').gte(time.strftime('%Y-%m-%dT%H:%M:%S', time.gmtime(since)))
    )
    return response.get('Items', [])


def insert_threat_event(event: dict) -> None:
    """Insert a threat event into DynamoDB."""
    event['request_id'] = event.get('eventId', str(time.time()))
    event['type'] = 'threat'
    
    # Clean up floats for DynamoDB Decimal conversion issues
    import decimal
    item = json.loads(json.dumps(event), parse_float=decimal.Decimal)
    
    try:
        logs_table.put_item(Item=item)
    except Exception as e:
        print(f"DynamoDB threat insert error: {e}")


def add_to_blocklist(ip: str = '', token: str = '', reason: str = '', 
                     severity: str = 'MEDIUM', detected_by: str = 'engine',
                     mitre_tactic: str = '', ttl_seconds: int = 0) -> None:
    """Add an IP or token to the blocklist in DynamoDB."""
    now = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    expires = ''
    if ttl_seconds > 0:
        expires = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime(time.time() + ttl_seconds))
    
    if ip:
        try:
            # Atomic update of strikes, or insert if not exists
            blocklist_table.update_item(
                Key={'ip': ip},
                UpdateExpression="SET #s = if_not_exists(#s, :zero) + :one, #stat = :active, #rsn = :rsn, #sev = :sev, #exp = :exp",
                ExpressionAttributeNames={
                    '#s': 'strikes',
                    '#stat': 'status',
                    '#rsn': 'reason',
                    '#sev': 'severity',
                    '#exp': 'expiresAt'
                },
                ExpressionAttributeValues={
                    ':zero': 0,
                    ':one': 1,
                    ':active': 'active',
                    ':rsn': reason,
                    ':sev': severity,
                    ':exp': expires
                }
            )
        except Exception as e:
            print(f"DynamoDB blocklist update error: {e}")


def is_blocked(ip: str = '', token: str = '') -> bool:
    if ip:
        res = blocklist_table.get_item(Key={'ip': ip})
        if 'Item' in res and res['Item'].get('status') == 'active':
            return True
    return False


def is_allowlisted(ip: str = '', token: str = '') -> bool:
    return False


def get_strike_count(ip: str = '', token: str = '') -> int:
    if ip:
        res = blocklist_table.get_item(Key={'ip': ip})
        if 'Item' in res:
            return int(res['Item'].get('strikes', 0))
    return 0


def sync_blocklist_json() -> None:
    """No longer needed in serverless. Handled by DynamoDB."""
    pass

