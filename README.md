# MANTIS: API Sentinel

![Status](https://img.shields.io/badge/status-active-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Python](https://img.shields.io/badge/python-3.13%2B-blue)
![Node.js](https://img.shields.io/badge/node.js-18%2B-green)

---

## 🚨 Overview
**MANTIS** is a free, self-hostable API runtime security tool for real-time threat detection and mitigation. It logs API traffic, detects anomalies (ML + heuristics), and blocks malicious users/IPs instantly.

---

## ✨ Features
- **Real-time request logging** (IP, token, endpoint, user-agent, POST body)
- **SQLite storage** for logs and blocklist
- **Advanced anomaly detection** (Isolation Forest + Local Outlier Factor + heuristics)
- **Automated blocking mechanism**
- **Rate limiting**
- **Health endpoint**
- **Traffic simulators** (basic & advanced)
- **Repeat nuance tester** for blocklist verification

---

## ⚡ Quickstart

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
- Basic:
  ```bash
  python simulate_traffic.py
  ```
- Advanced (infinite diversity):
  ```bash
  /home/arpan/Developments/MANTIS/venv/bin/python random_traffic_sim.py
  ```

### 4. Run anomaly detection
```bash
python anomaly_engine.py
```

### 5. View blocklist
```bash
cat blocklist.json
```

### 6. Verify blocking (repeat blocked nuances)
```bash
/home/arpan/Developments/MANTIS/venv/bin/python repeat_nuaunces.py
cat repeat_results.json
```

---

## 🏗️ Architecture
```
+-------------------+      +-------------------+      +-------------------+
|   Traffic Sim(s)  +----->|   API Server      +----->|   SQLite DB       |
+-------------------+      +-------------------+      +-------------------+
         |                        |                          |
         |                        v                          v
         |                +-------------------+      +-------------------+
         |                |  Anomaly Engine   |<-----+  Blocklist/Threats|
         |                +-------------------+      +-------------------+
         |                        |
         v                        v
+-------------------+      +-------------------+
| Repeat Nuance Test|      |  Visualization    |
+-------------------+      +-------------------+
```
- API server logs all requests to SQLite
- Anomaly engine analyzes logs and updates blocklist
- Blocked IPs/tokens are rejected by the API server
- Traffic simulators generate diverse and evolving API traffic
- Repeat nuance tester verifies blocklist effectiveness

---

## 🧑‍💻 Author
**Arpan Pramanik**

---

## 📄 License
MIT