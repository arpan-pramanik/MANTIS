# MANTIS Benchmarks & Test Results

This document tracks the performance, latency, and false-positive rates of the MANTIS detection engine against synthetic attack traffic.

## 47/47 Penetration Tests
We simulate 47 distinct attack variations spanning 7 threat classes. These are evaluated using the `tests/synthetic_eval.py` harness which injects these payloads into a 10,000-event legitimate traffic baseline.

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

- **Throughput:** ~5,200 events/sec processed by the Python ML ensemble.
- **Latency (Gateway):** 4ms p99 overhead added to the critical proxy path (this is the time it takes Node.js to match deterministic signatures and asynchronously flush to SQLite).
- **False Positive Rate (FPR):** `1.22%` on a strict 10k-event baseline. 
- **F1 Score (Anomalies):** `0.89` (boosted by the multi-method IsolationForest + LOF ensemble).

## Running the Evaluation
To reproduce these metrics locally:

```bash
# Generate 10k synthetic events and calculate precision/recall
python -m tests.synthetic_eval
```
