import sqlite3
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.neighbors import LocalOutlierFactor
import time
import json
import threading

DB_FILE = 'storage.db'
BLOCKLIST_FILE = 'blocklist.json'
THREAT_LOG_FILE = 'threats.json'
SCAN_INTERVAL = 0.01  # seconds

# Feature extraction from logs
FEATURES = [
    'ip', 'token', 'rate', 'unique_endpoints', 'unique_tokens', 'post_count', 'entropy_tokens', 'user_agent_score',
    'burstiness', 'endpoint_switches', 'token_rotations', 'botnet_score'
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

# Helper: burstiness (variance of timestamps)
def burstiness(timestamps):
    if len(timestamps) < 2: return 0
    times = pd.to_datetime(timestamps)
    diffs = (times - times.min()).total_seconds()
    return np.std(np.diff(diffs)) if len(diffs) > 1 else 0

# Helper: endpoint switching
def endpoint_switches(paths):
    return len(set(paths))

# Helper: token rotations
def token_rotations(tokens):
    return len(set(tokens))

# Helper: botnet score (multiple IPs using same token)
def botnet_score(df, token):
    if not token: return 0
    return len(df[df['token'] == token]['ip'].unique())

# Adaptive thresholding
def adaptive_threshold(values, base=0.1):
    if not values: return base
    return min(max(np.percentile(values, 90) * 0.5, base), 0.5)

# Scan and block function
def scan_and_block():
    recent_rates = []
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
                timestamps = group['timestamp'].tolist()
                burst = burstiness(timestamps)
                endpoint_sw = endpoint_switches(endpoints)
                token_rot = token_rotations(tokens)
                bot_score = botnet_score(df, tokens[0] if tokens else '')
                features.append({
                    'ip': ip,
                    'token': tokens[0] if tokens else '',
                    'rate': len(group),
                    'unique_endpoints': len(set(endpoints)),
                    'unique_tokens': len(set(tokens)),
                    'post_count': post_count,
                    'entropy_tokens': entropy(tokens),
                    'user_agent_score': np.mean([ua_score(ua) for ua in uas]),
                    'burstiness': burst,
                    'endpoint_switches': endpoint_sw,
                    'token_rotations': token_rot,
                    'botnet_score': bot_score
                })
                recent_rates.append(len(group))

            X = pd.DataFrame(features).fillna(0)

            # Check for valid features
            if X.empty or 'ip' not in X.columns or 'token' not in X.columns:
                print('No valid log features found for anomaly detection.')
                time.sleep(SCAN_INTERVAL)
                continue

            # Ensemble ML: Isolation Forest + Local Outlier Factor
            n_samples = len(X)
            n_neighbors = min(max(20, int(n_samples * 0.2)), n_samples - 1) if n_samples > 2 else 2
            clf_iso = IsolationForest(contamination=adaptive_threshold(recent_rates), random_state=42)
            clf_lof = LocalOutlierFactor(n_neighbors=n_neighbors, contamination=adaptive_threshold(recent_rates))
            if n_samples > 1:
                preds_iso = clf_iso.fit_predict(X.drop(['ip','token'], axis=1))
                preds_lof = clf_lof.fit_predict(X.drop(['ip','token'], axis=1))
                anomalous = X[(preds_iso == -1) | (preds_lof == -1)]
            else:
                anomalous = pd.DataFrame(columns=X.columns)

            # Heuristic: block if rate > 100, unique_endpoints > 10, entropy_tokens > 2, user_agent_score > 0.5, burstiness > 5, botnet_score > 3
            heuristic = X[(X['rate'] > 100) | (X['unique_endpoints'] > 10) | (X['entropy_tokens'] > 2) |
                          (X['user_agent_score'] > 0.5) | (X['burstiness'] > 5) | (X['botnet_score'] > 3)]

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

            # Log threats with advanced details
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
                    'details': X[X['ip'].isin(new_ips)].to_dict('records'),
                    'ensemble_features': X[X['ip'].isin(new_ips)].to_dict('records'),
                    'heuristic_features': heuristic[heuristic['ip'].isin(new_ips)].to_dict('records')
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
