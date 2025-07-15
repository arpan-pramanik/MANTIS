import requests
import json
import time

THREATS_FILE = 'threats.json'
BLOCKLIST_FILE = 'blocklist.json'
RESULTS_FILE = 'repeat_results.json'
API_URL = 'http://localhost:3000/api/test'  # Change as needed

# Load blocked IPs and tokens
with open(BLOCKLIST_FILE) as f:
    blocklist = json.load(f)
blocked_ips = set(blocklist.get('ips', []))
blocked_tokens = set(blocklist.get('tokens', []))

# Load threat details
with open(THREATS_FILE) as f:
    threats = json.load(f)

# Collect all unique blocked nuances (IP, token, details)
blocked_nuances = []
for entry in threats:
    for detail in entry.get('details', []):
        blocked_nuances.append(detail)

results = []
for nuance in blocked_nuances:
    ip = nuance.get('ip', '')
    token = nuance.get('token', '')
    headers = {
        "X-Forwarded-For": ip,
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    payload = {"test": "repeat_nuance", "ip": ip, "token": token}
    try:
        r = requests.post(API_URL, headers=headers, json=payload, timeout=2)
        status = r.status_code
        success = status == 429 or status == 403  # Blocked
    except Exception as e:
        status = str(e)
        success = False
    results.append({
        "ip": ip,
        "token": token,
        "status": status,
        "blocked": success
    })
    time.sleep(0.1)

with open(RESULTS_FILE, 'w') as f:
    json.dump(results, f, indent=2)

print(f"Repeat nuance test complete. Results saved to {RESULTS_FILE}.")
