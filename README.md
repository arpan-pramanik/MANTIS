# Mitigation of API-based Nuisances using Threat Intelligence System

MANTIS is an extremely advanced, production-ready API security gateway and threat detection engine. Designed for top-tier security infrastructure, it provides multi-layered protection against complex API attacks through a combination of inline signature-based validation and asynchronous Machine Learning/Heuristic behavioral analysis.

## Core Features
* **Node.js API Gateway**: High-performance reverse proxy that validates payloads inline.
* **Python Threat Engine**: Asynchronous engine utilizing ML and advanced heuristics for behavioral threat detection.
* **Ensemble Voting Mitigation**: Warn, throttle, and block malicious entities dynamically using a multi-detector consensus model.
* **Observability (Prometheus/Grafana)**: Fully instrumented metrics for real-time attack trend visualization.
* **AWS Ready**: Dockerized and ready for scalable deployment on AWS ECS/EKS.

## Threat Coverage
- SQL Injection (SQLi) (Advanced encodings, time-based, boolean-based)
- Cross-Site Scripting (XSS)
- Server-Side Request Forgery (SSRF)
- Path Traversal & Command Injection
- Automated Scanners & Reconnaissance

## Quickstart

### 1. Requirements
* Node.js v20+
* Python 3.10+
* Docker & Docker Compose (for Observability)

### 2. Setup
```bash
# Gateway Setup
npm install

# Engine Setup
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Running MANTIS
```bash
# Start the Gateway
node src/server/server.js

# Start the Detection Engine
source venv/bin/activate
python -m src.engine.main
```

### 4. Observability (Prometheus & Grafana)
```bash
docker-compose up -d
```
Access Grafana at `http://localhost:3002` (Login: admin / admin)

## Architecture
MANTIS separates the latency-critical traffic proxying from the computationally heavy ML detection. The Node.js gateway handles inline blocking of deterministic threats, while the Python engine constantly polls behavioral logs to detect sophisticated, distributed attacks, applying dynamic blocklists instantly.

## Testing
MANTIS includes an enterprise-grade attack simulation suite containing 47 rigorous penetration tests.
```bash
bash tests/integration/attack_simulation.sh
```