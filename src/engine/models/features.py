"""Feature engineering module for MANTIS detection engine."""
import hashlib
import re
from collections import Counter

import numpy as np
import pandas as pd

FEATURE_NAMES = [
    'rate', 'unique_endpoints', 'unique_tokens', 'post_ratio', 'entropy_tokens',
    'ua_score', 'burstiness', 'timing_variance', 'session_length',
    'endpoint_sequence_anomaly', 'payload_entropy', 'payload_similarity',
    'fingerprint_variation', 'geolocation_shift', 'error_rate',
    'auth_failure_rate', 'data_exfil_score', 'reconnaissance_score',
    'evasion_score', 'polymorphic_score', 'botnet_score', 'method_diversity',
    'body_size_variance', 'time_of_day_anomaly', 'request_interval_regularity',
    'unique_uas', 'get_ratio', 'delete_ratio', 'path_depth_avg', 'token_rotation_rate'
]


def entropy(data: list) -> float:
    """Calculate Shannon entropy."""
    if not data:
        return 0.0
    counts = pd.Series(data).value_counts(normalize=True)
    return float(-np.sum(counts * np.log2(counts + 1e-10)))


def payload_entropy(bodies: list) -> float:
    """Calculate entropy of payload characters."""
    text = ' '.join(str(b) for b in bodies if b)
    if not text:
        return 0.0
    return entropy(list(text))


def ua_score(uas: list) -> float:
    """Score user agents for bot likelihood."""
    if not uas:
        return 0.0
    score = 0.0
    unique_uas = set(str(u) for u in uas if u)
    bot_patterns = ['bot', 'curl', 'python', 'scrapy', 'wget', 'spider', 'scanner',
                    'nikto', 'sqlmap', 'nmap', 'burp', 'zap', 'nuclei', 'masscan']
    for ua in unique_uas:
        ua_lower = ua.lower()
        if any(p in ua_lower for p in bot_patterns):
            score += 1.0
        elif not any(b in ua_lower for b in ['chrome', 'firefox', 'safari', 'edge', 'opera']):
            score += 0.3
        if re.match(r'^mozilla/\d\.\d\s*$', ua_lower):
            score += 0.5
    return min(score / max(len(unique_uas), 1), 1.0)


def burstiness(timestamps: list) -> float:
    """Detect irregular timing patterns (coefficient of variation of intervals)."""
    if len(timestamps) < 3:
        return 0.0
    try:
        times = pd.to_datetime(timestamps)
        intervals = np.diff(times.astype(np.int64) / 1e9)
        if len(intervals) < 2:
            return 0.0
        mean_i = np.mean(intervals)
        std_i = np.std(intervals)
        return float(std_i / (mean_i + 1e-10))
    except (ValueError, TypeError):
        return 0.0


def timing_variance(timestamps: list) -> float:
    """Variance of request intervals."""
    if len(timestamps) < 3:
        return 0.0
    try:
        times = pd.to_datetime(timestamps)
        intervals = np.diff(times.astype(np.int64) / 1e9)
        return float(np.var(intervals))
    except (ValueError, TypeError):
        return 0.0


def session_length(timestamps: list) -> float:
    """Duration of session in seconds."""
    if len(timestamps) < 2:
        return 0.0
    try:
        times = pd.to_datetime(timestamps)
        return float((times.max() - times.min()).total_seconds())
    except (ValueError, TypeError):
        return 0.0


def endpoint_sequence_anomaly(paths: list) -> float:
    """Entropy of 3-gram endpoint sequences."""
    if len(paths) < 3:
        return 0.0
    trigrams = ['|'.join(str(p) for p in paths[i:i+3]) for i in range(len(paths) - 2)]
    return entropy(trigrams)


def fingerprint_variation(uas: list, ips: list) -> float:
    """Measure device/browser switching."""
    if len(uas) < 2:
        return 0.0
    hashes = [hashlib.md5(str(u).encode()).hexdigest()[:8] for u in uas if u]
    return len(set(hashes)) / max(len(hashes), 1)


def geolocation_shift(ips: list) -> float:
    """Simplified geo-shift via IP prefix diversity."""
    if not ips:
        return 0.0
    prefixes = [str(ip).split('.')[0] if '.' in str(ip) else str(ip)[:4] for ip in ips if ip]
    return len(set(prefixes)) / max(len(prefixes), 1)


def error_rate(paths: list) -> float:
    """Detect probing/fuzzing via suspicious path patterns."""
    error_patterns = ['admin', 'config', '.env', 'backup', 'test', 'debug', '..', 'passwd',
                      '.git', 'wp-admin', 'phpmyadmin', 'console', '.htaccess']
    count = sum(1 for p in paths if any(pat in str(p).lower() for pat in error_patterns))
    return count / max(len(paths), 1)


def auth_failure_rate(tokens: list, paths: list) -> float:
    """Detect brute force via auth endpoint frequency × token variety."""
    auth_eps = ['login', 'auth', 'signin', 'token', 'register']
    auth_reqs = sum(1 for p in paths if any(ep in str(p).lower() for ep in auth_eps))
    token_variety = len(set(str(t) for t in tokens if t))
    return (auth_reqs * max(token_variety, 1)) / max(len(paths), 1)


def data_exfil_score(methods: list, paths: list) -> float:
    """Detect data exfiltration patterns."""
    get_ratio = sum(1 for m in methods if m == 'GET') / max(len(methods), 1)
    data_eps = ['download', 'export', 'backup', 'dump', 'data', 'csv', 'json']
    data_reqs = sum(1 for p in paths if any(ep in str(p).lower() for ep in data_eps))
    return (get_ratio * 0.3 + data_reqs / max(len(paths), 1) * 0.7)


def reconnaissance_score(paths: list, methods: list) -> float:
    """Detect scanning/recon behavior."""
    recon_patterns = ['robots.txt', 'sitemap', '.well-known', 'swagger', 'api/v',
                      'health', 'status', 'info', 'debug', 'actuator', 'metrics']
    recon_count = sum(1 for p in paths if any(pat in str(p).lower() for pat in recon_patterns))
    options_count = sum(1 for m in methods if m == 'OPTIONS')
    return (recon_count + options_count) / max(len(paths), 1)


def evasion_score(uas: list, tokens: list, paths: list) -> float:
    """Detect evasion attempts (high rotation rates)."""
    ua_rot = len(set(str(u) for u in uas)) / max(len(uas), 1) if uas else 0
    tok_rot = len(set(str(t) for t in tokens)) / max(len(tokens), 1) if tokens else 0
    path_ent = min(entropy([str(p) for p in paths]) / 5, 1.0)
    return (ua_rot + tok_rot + path_ent) / 3


def polymorphic_score(bodies: list, uas: list, tokens: list) -> float:
    """Detect shape-shifting attacks."""
    body_var = len(set(str(b) for b in bodies)) / max(len(bodies), 1) if bodies else 0
    ua_var = len(set(str(u) for u in uas)) / max(len(uas), 1) if uas else 0
    tok_var = len(set(str(t) for t in tokens)) / max(len(tokens), 1) if tokens else 0
    return (body_var + ua_var + tok_var) / 3


def botnet_score(df: pd.DataFrame, token: str, ip: str) -> float:
    """Detect coordinated botnet behavior."""
    if not token:
        return 0.0
    same_token_ips = len(df[df['token'] == token]['ip'].unique()) if 'token' in df.columns else 0
    same_ip_tokens = len(df[df['ip'] == ip]['token'].unique()) if 'ip' in df.columns else 0
    return float(max(same_token_ips, same_ip_tokens))


def method_diversity(methods: list) -> float:
    """Diversity of HTTP methods used."""
    if not methods:
        return 0.0
    return len(set(methods)) / max(len(methods), 1)


def body_size_variance(bodies: list) -> float:
    """Variance in request body sizes."""
    sizes = [len(str(b)) for b in bodies if b]
    if len(sizes) < 2:
        return 0.0
    return float(np.var(sizes))


def time_of_day_anomaly(timestamps: list) -> float:
    """Detect requests at unusual hours (2AM-5AM)."""
    if not timestamps:
        return 0.0
    try:
        hours = [pd.to_datetime(t).hour for t in timestamps]
        unusual = sum(1 for h in hours if 2 <= h <= 5)
        return unusual / max(len(hours), 1)
    except (ValueError, TypeError):
        return 0.0


def request_interval_regularity(timestamps: list) -> float:
    """Detect suspiciously regular intervals (bot behavior)."""
    if len(timestamps) < 5:
        return 0.0
    try:
        times = pd.to_datetime(timestamps)
        intervals = np.diff(times.astype(np.int64) / 1e9)
        if len(intervals) < 2:
            return 0.0
        cv = np.std(intervals) / (np.mean(intervals) + 1e-10)
        # Low CV = very regular = likely bot
        return max(0, 1.0 - cv)
    except (ValueError, TypeError):
        return 0.0


def extract_ip_features(df: pd.DataFrame, ip: str, full_df: pd.DataFrame | None = None) -> dict:
    """Extract all features for a specific IP from the log DataFrame."""
    group = df[df['ip'] == ip] if 'ip' in df.columns else df
    
    tokens = group['token'].tolist() if 'token' in group.columns else []
    paths = group['path'].tolist() if 'path' in group.columns else []
    uas = group['userAgent'].tolist() if 'userAgent' in group.columns else []
    methods = group['method'].tolist() if 'method' in group.columns else []
    bodies = group['body'].tolist() if 'body' in group.columns else []
    timestamps = group['timestamp'].tolist() if 'timestamp' in group.columns else []
    
    full = full_df if full_df is not None else df
    
    return {
        'ip': ip,
        'token': tokens[0] if tokens else '',
        'rate': len(group),
        'unique_endpoints': len(set(str(p) for p in paths)),
        'unique_tokens': len(set(str(t) for t in tokens)),
        'post_ratio': sum(1 for m in methods if m == 'POST') / max(len(methods), 1),
        'entropy_tokens': entropy([str(t) for t in tokens]),
        'ua_score': ua_score(uas),
        'burstiness': burstiness(timestamps),
        'timing_variance': timing_variance(timestamps),
        'session_length': session_length(timestamps),
        'endpoint_sequence_anomaly': endpoint_sequence_anomaly(paths),
        'payload_entropy': payload_entropy(bodies),
        'payload_similarity': 0.0,  # Expensive, skip for performance
        'fingerprint_variation': fingerprint_variation(uas, [ip] * len(uas)),
        'geolocation_shift': geolocation_shift([ip] * len(group)),
        'error_rate': error_rate(paths),
        'auth_failure_rate': auth_failure_rate(tokens, paths),
        'data_exfil_score': data_exfil_score(methods, paths),
        'reconnaissance_score': reconnaissance_score(paths, methods),
        'evasion_score': evasion_score(uas, tokens, paths),
        'polymorphic_score': polymorphic_score(bodies, uas, tokens),
        'botnet_score': botnet_score(full, tokens[0] if tokens else '', ip),
        'method_diversity': method_diversity(methods),
        'body_size_variance': body_size_variance(bodies),
        'time_of_day_anomaly': time_of_day_anomaly(timestamps),
        'request_interval_regularity': request_interval_regularity(timestamps),
        'unique_uas': len(set(str(u) for u in uas)),
        'get_ratio': sum(1 for m in methods if m == 'GET') / max(len(methods), 1),
        'delete_ratio': sum(1 for m in methods if m == 'DELETE') / max(len(methods), 1),
        'path_depth_avg': np.mean([str(p).count('/') for p in paths]) if paths else 0,
        'token_rotation_rate': len(set(str(t) for t in tokens)) / max(len(tokens), 1),
    }
