#!/usr/bin/env python3
"""
Live Evaluation Harness for MANTIS ML Engine

Unlike the deterministic tests in `attack_simulation.sh`, this script 
tests the behavioral anomaly engine (IsolationForest + Heuristics) in a live setting.
It generates traffic that intentionally bypasses deterministic regex signatures
but creates a behavioral profile of a scanner or low-and-slow attacker.
We then wait for the asynchronous Python engine to poll the DB, run the ML ensemble, 
and push the IP to the blocklist.
"""

import time
import sys
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

API_URL = "http://localhost:3000"

def get_session():
    session = requests.Session()
    retries = Retry(total=3, backoff_factor=0.1)
    session.mount('http://', HTTPAdapter(max_retries=retries))
    return session

def wait_for_server():
    """Ensure the API gateway is reachable before running tests."""
    print("Waiting for MANTIS gateway to be ready...")
    for _ in range(15):
        try:
            r = requests.get(f"{API_URL}/health", timeout=2)
            if r.status_code == 200:
                print("Gateway is up!")
                return True
        except requests.exceptions.RequestException:
            pass
        time.sleep(1)
    print("Gateway failed to start or is unreachable.")
    sys.exit(1)

def run_behavioral_simulation():
    session = get_session()
    
    print("\n--- Phase 1: Baseline Legitimate Traffic ---")
    print("Sending normal traffic (should all be 200 OK)")
    for i in range(5):
        r = session.get(f"{API_URL}/api/v1/users")
        if r.status_code != 200:
            print(f"Unexpected status for legitimate traffic: {r.status_code}")
        time.sleep(0.5)
        
    print("\n--- Phase 2: Behavioral Anomaly Generation ---")
    print("Generating 'low-and-slow' 404 scanning traffic...")
    # This traffic doesn't trigger the inline WAF, but generates 
    # a high error_rate and reconnaissance_score in the logs.
    for i in range(40):
        try:
            # Randomizing paths to simulate directory brute forcing/scraping
            r = session.get(f"{API_URL}/api/v1/users/scan_test_{i}", headers={'User-Agent': 'python-requests/live-test'})
            # We expect 404s here, not 403s (yet)
        except requests.exceptions.RequestException:
            pass
        time.sleep(0.05) # fast enough to be anomalous, slow enough to avoid instant rate limiting

    print("\n--- Phase 3: Awaiting Async ML Processing ---")
    print("Waiting 12 seconds for the Python engine to poll SQLite and run the ML ensemble...")
    # config.detection.scanInterval is 10 seconds by default
    time.sleep(12)

    print("\n--- Phase 4: Validating ML Block ---")
    print("Sending followup request to see if the IP was dynamically blocked.")
    r = session.get(f"{API_URL}/api/v1/users")
    
    if r.status_code == 403:
        print("[PASS] IP successfully blocked by the ML anomaly engine.")
        sys.exit(0)
    else:
        print(f"[FAIL] Expected 403 Forbidden due to ML blocklist, got {r.status_code}.")
        sys.exit(1)

if __name__ == "__main__":
    wait_for_server()
    run_behavioral_simulation()
