import sqlite3
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
import time
import json
import threading

DB_FILE = 'storage.db'
BLOCKLIST_FILE = 'blocklist.json'
THREAT_LOG_FILE = 'threats.json'
SCAN_INTERVAL = 10  # seconds

# Feature extraction from logs
FEATURES = [
    'ip', 'token', 'rate', 'unique_endpoints', 'unique_tokens', 'post_count', 'entropy_tokens', 'user_agent_score'
]

# Helper: entropy calculation
def entropy(tokens):
    if not tokens: return 0
    counts = pd.Series(tokens).value_counts(normalize=True)
    return -np.sum(counts * np.log2(counts))

# Helper: user-agent scoring
def ua_score(ua):
    if not ua: return 0
    ua = ua.lower()
    if any(x in ua for x in ['bot', 'curl', 'python', 'scrapy', 'wget', 'spider']):
        return 1
    return 0

# Scan and block function
def scan_and_block():
    while True:
        try:
            # Load logs from SQLite
            conn = sqlite3.connect(DB_FILE)
            df = pd.read_sql_query("SELECT * FROM logs WHERE timestamp >= ?", conn, params=[time.strftime('%Y-%m-%dT%H:%M:%S', time.gmtime(time.time()-60))])

            if df.empty:
                print('No logs found for analysis.')
                time.sleep(SCAN_INTERVAL)
                continue

            # Group by IP for feature extraction
            features = []
            for ip, group in df.groupby('ip'):
                tokens = group['token'].tolist()
                endpoints = group['path'].tolist()
                uas = group['userAgent'].tolist()
                post_count = (group['method'] == 'POST').sum()
                features.append({
                    'ip': ip,
                    'token': tokens[0] if tokens else '',
                    'rate': len(group),
                    'unique_endpoints': len(set(endpoints)),
                    'unique_tokens': len(set(tokens)),
                    'post_count': post_count,
                    'entropy_tokens': entropy(tokens),
                    'user_agent_score': np.mean([ua_score(ua) for ua in uas])
                })

            X = pd.DataFrame(features).fillna(0)

            # Check for valid features
            if X.empty or 'ip' not in X.columns or 'token' not in X.columns:
                print('No valid log features found for anomaly detection.')
                time.sleep(SCAN_INTERVAL)
                continue

            # Isolation Forest anomaly detection
            clf = IsolationForest(contamination=0.1, random_state=42)
            if len(X) > 1:
                preds = clf.fit_predict(X.drop(['ip','token'], axis=1))
                anomalous = X[preds == -1]
            else:
                anomalous = pd.DataFrame(columns=X.columns)

            # Heuristic: block if rate > 100, unique_endpoints > 10, entropy_tokens > 2, user_agent_score > 0.5
            heuristic = X[(X['rate'] > 100) | (X['unique_endpoints'] > 10) | (X['entropy_tokens'] > 2) | (X['user_agent_score'] > 0.5)]

            # Combine ML and heuristic results
            block_ips = set(anomalous.get('ip', pd.Series()).tolist()) | set(heuristic.get('ip', pd.Series()).tolist())
            block_tokens = set(anomalous.get('token', pd.Series()).tolist()) | set(heuristic.get('token', pd.Series()).tolist())

            # Update blocklist
            try:
                with open(BLOCKLIST_FILE) as f:
                    blocklist = json.load(f)
            except Exception:
                blocklist = {'ips': [], 'tokens': []}

            new_ips = [ip for ip in block_ips if ip and ip not in blocklist['ips']]
            new_tokens = [token for token in block_tokens if token and token not in blocklist['tokens']]

            # Log threats
            try:
                with open(THREAT_LOG_FILE) as f:
                    threat_log = json.load(f)
            except Exception:
                threat_log = []

            if new_ips or new_tokens:
                print('Blocking:', new_ips, new_tokens)
                blocklist['ips'].extend(new_ips)
                blocklist['tokens'].extend(new_tokens)
                with open(BLOCKLIST_FILE, 'w') as f:
                    json.dump(blocklist, f, indent=2)
                threat_log.append({
                    'timestamp': time.strftime('%Y-%m-%dT%H:%M:%S', time.gmtime()),
                    'blocked_ips': new_ips,
                    'blocked_tokens': new_tokens,
                    'details': X[X['ip'].isin(new_ips)].to_dict('records')
                })
                with open(THREAT_LOG_FILE, 'w') as f:
                    json.dump(threat_log, f, indent=2)
            else:
                print('No new anomalies detected.')
        except Exception as e:
            print('Error in anomaly engine:', e)
        time.sleep(SCAN_INTERVAL)

if __name__ == '__main__':
    print('Starting continuous anomaly detection...')
    scan_and_block()
