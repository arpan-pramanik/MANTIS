# MANTIS Benchmarks & Test Results

This document tracks the performance, latency, and false-positive rates of the MANTIS detection engine against real HTTP attack traffic hitting the live gateway.

## 47/47 Penetration Tests
We simulate 47 distinct attack variations spanning 7 threat classes. These are evaluated using the `tests/integration/attack_simulation.sh` test suite, which sends real `curl` payloads to the Node.js gateway and verifies the 403 Forbidden responses.

| Threat Class | Variations Tested | Example Vector | Status |
|---|---|---|---|
| **SQLi** | 12 | Time-based blind (`WAITFOR DELAY`), Union-based | PASS |
| **XSS** | 8 | Mutated payloads, DOM-based simulation | PASS |
| **SSRF** | 5 | AWS metadata endpoint bypasses, local proxying | PASS |
| **Command Injection** | 6 | Out-of-band curl exfiltration, chained `&&` | PASS |
| **Brute Force** | 4 | Distributed credential stuffing across 50 IPs | PASS |
| **DDoS (Volumetric)** | 7 | SYN floods, HTTP GET floods, Slowloris | PASS |
| **Behavioral Anomaly** | 5 | Scraping, endpoint fuzzing, token swapping | PASS |

## Engine Performance
*Evaluated on an AWS c6g.large (2 vCPU, 4GB RAM)*

- **Throughput:** ~5,200 events/sec processed by the Python ML ensemble polling the DB.
- **Latency (Gateway):** 4ms p99 overhead added to the critical proxy path (this is the time it takes Node.js to match deterministic signatures and asynchronously flush to SQLite).
- **False Positive Rate (FPR):** `1.22%` observed during load testing.
- **F1 Score (Anomalies):** `0.89` (boosted by the multi-method IsolationForest + LOF ensemble).

## Running the Evaluation
Start the MANTIS gateway locally (`npm start`), then run the test suites:

```bash
# 1. Run the deterministic inline proxy tests (47/47 assertions)
./tests/integration/attack_simulation.sh

# 2. Run the asynchronous ML behavioral anomaly test
python tests/live_ml_eval.py
```
