# MANTIS: API Sentinel – Free Runtime API Threat Detection & Mitigation

## Overview
MANTIS is a free, self-hostable API runtime security tool for real-time threat detection and mitigation. It logs API traffic, detects anomalies (ML + heuristics), and blocks malicious users/IPs instantly.

## Features
- Real-time request logging (IP, token, endpoint, user-agent, POST body)
- SQLite storage for logs and blocklist
- Advanced anomaly detection (Isolation Forest + heuristics)
- Automated blocking mechanism
- Rate limiting
- Health endpoint
- Traffic simulator for testing

## Setup & Run
### 1. Install dependencies
```bash
npm install express sqlite3 express-rate-limit
pip install -r requirements.txt
```

### 2. Start API server
```bash
node api_server.js
```

### 3. Simulate traffic
```bash
python simulate_traffic.py
```

### 4. Run anomaly detection
```bash
python anomaly_engine.py
```

### 5. View blocklist
```bash
cat blocklist.json
```

## Architecture
- API server logs all requests to SQLite
- Anomaly engine analyzes logs and updates blocklist
- Blocked IPs/tokens are rejected by the API server

## Author
Arpan Pramanik
