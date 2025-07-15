import requests
import random
import string
import time
import uuid
import json
from faker import Faker

# Advanced API Traffic Simulator: Infinite Diversity, Realism, and Adaptation

API_URL = "http://localhost:3000/api/test"  # Change as needed
fake = Faker()

# Dynamic pools for simulation
user_agents = [fake.user_agent() for _ in range(100)]
endpoints = ["/api/test", "/api/data", "/api/user", "/api/item", "/api/search", "/api/login", "/api/logout", "/api/update", "/api/delete", "/api/submit"]
methods = ["GET", "POST", "PUT", "DELETE", "PATCH"]

# Infinite generator for unique IPs
used_ips = set()
def unique_ip():
    while True:
        ip = fake.ipv4() if random.random() > 0.2 else fake.ipv6()
        if ip not in used_ips:
            used_ips.add(ip)
            return ip

# Infinite generator for unique tokens
used_tokens = set()
def unique_token():
    while True:
        token = uuid.uuid4().hex + ''.join(random.choices(string.ascii_letters + string.digits, k=8))
        if token not in used_tokens:
            used_tokens.add(token)
            return token

# Generate polymorphic payloads
payload_templates = [
    lambda: {"data": fake.text(max_nb_chars=50), "id": random.randint(1, 10000)},
    lambda: {"user": fake.name(), "email": fake.email(), "action": random.choice(["create", "update", "delete"])},
    lambda: {"search": fake.word(), "filters": [fake.word() for _ in range(random.randint(1, 5))]},
    lambda: {"items": [random.randint(1, 1000) for _ in range(random.randint(1, 10))]},
    lambda: {"malformed": ''.join(random.choices(string.printable, k=random.randint(10, 100)))},
    lambda: {"json": None},
    lambda: {"payload": fake.sentence(), "extra": fake.paragraph()},
]

def random_payload():
    # Occasionally invent a new template
    if random.random() < 0.1:
        return {fake.word(): fake.sentence(), fake.word(): random.randint(1, 10000)}
    return random.choice(payload_templates)()

# Adaptive attack/benign pattern generator
attack_types = [
    "normal", "burst", "brute-force", "scraping", "malformed", "rapid-switch", "botnet", "zero-day", "polymorphic", "slowloris", "random-delay", "timing-attack", "header-flood", "token-abuse", "endpoint-spam"
]

def invent_attack():
    # Always invent new nuances
    base = random.choice(attack_types)
    nuances = [fake.word() for _ in range(random.randint(1, 3))]
    return base + "-" + "-".join(nuances)

# Main loop: never repeat, always adapt
request_history = set()
def make_request():
    ip = unique_ip()
    token = unique_token()
    user_agent = random.choice(user_agents)
    endpoint = random.choice(endpoints)
    method = random.choice(methods)
    payload = random_payload()
    attack_pattern = invent_attack()
    headers = {
        "User-Agent": user_agent,
        "Authorization": f"Bearer {token}",
        "X-Forwarded-For": ip,
        "X-Attack-Pattern": attack_pattern,
        "X-Request-ID": str(uuid.uuid4()),
        "Content-Type": "application/json"
    }
    req_signature = json.dumps({"ip": ip, "token": token, "endpoint": endpoint, "method": method, "payload": payload, "attack": attack_pattern})
    if req_signature in request_history:
        # Mutate until unique
        return make_request()
    request_history.add(req_signature)
    url = f"http://localhost:3000{endpoint}" if endpoint.startswith("/") else f"http://localhost:3000/{endpoint}"
    try:
        if method == "GET":
            r = requests.get(url, headers=headers, timeout=random.uniform(0.5, 3))
        elif method == "POST":
            r = requests.post(url, headers=headers, json=payload, timeout=random.uniform(0.5, 3))
        elif method == "PUT":
            r = requests.put(url, headers=headers, json=payload, timeout=random.uniform(0.5, 3))
        elif method == "DELETE":
            r = requests.delete(url, headers=headers, json=payload, timeout=random.uniform(0.5, 3))
        elif method == "PATCH":
            r = requests.patch(url, headers=headers, json=payload, timeout=random.uniform(0.5, 3))
        print(f"[{method}] {url} | IP: {ip} | Token: {token} | Attack: {attack_pattern} | Status: {r.status_code}")
    except Exception as e:
        print(f"[{method}] {url} | IP: {ip} | Token: {token} | Attack: {attack_pattern} | ERROR: {e}")

if __name__ == "__main__":
    print("Starting advanced API traffic simulation...")
    while True:
        make_request()
        # Randomize timing, mimic human/bot delays, bursts, slowdowns
        time.sleep(random.uniform(0.1, 2.5) * random.uniform(0.5, 2.5))
        # Occasionally clear history to allow infinite run
        if len(request_history) > 100000:
            request_history.clear()
