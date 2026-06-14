# Architecture Decisions

This document outlines the three hardest technical decisions I made while building MANTIS. Instead of just showing the final diagram, this explains *why* the system is built the way it is, what alternatives I looked at, and why I rejected them.

## 1. Inter-Process Communication (Node.js -> Python)

**The Problem:** The Node.js API Gateway needs to send thousands of request logs per second to the Python Threat Engine for asynchronous analysis, without blocking the critical proxy path.

**What I considered:**
- *HTTP Webhooks:* Have Node `POST` logs to a Python Flask/FastAPI server.
- *Redis Pub/Sub or Kafka:* Use a dedicated message broker.
- *gRPC:* High-performance RPC.

**What I rejected:**
- *HTTP Webhooks* were immediately rejected. Under heavy load (like a DDoS), the Python server would get overwhelmed, connection pools would exhaust, and it would start blocking the Node gateway.
- *Redis/Kafka* were rejected because I wanted this project to be deeply self-contained and easy to deploy. Requiring users to spin up a Kafka cluster just to run a security gateway felt like overkill.

**What I chose: SQLite in WAL mode**
I chose to use an embedded SQLite database configured in Write-Ahead Logging (WAL) mode. The Node.js gateway simply executes fire-and-forget `INSERT` statements asynchronously. The Python engine runs a background loop that polls the database for new unseen rows.
In WAL mode, concurrent readers do not block writers. Node can blast logs into the database as fast as the disk allows, and Python can lazily consume them. It easily handles 5k ops/sec on my laptop without requiring a heavy external message broker.

## 2. Model Selection for Anomaly Detection

**The Problem:** I needed a way to detect behavioral anomalies (e.g., someone scraping the API or finding a hidden endpoint) without relying solely on static rate limits.

**What I considered:**
- *Deep Learning Autoencoders (PyTorch)*
- *One-Class SVM*
- *Isolation Forest (scikit-learn)*

**What I rejected:**
- *Autoencoders* were too heavy. Inference time on CPU was too slow, and deploying PyTorch models significantly bloated the Docker image size. We don't need deep representations just to find volumetric outliers.
- *One-Class SVM* scaled horribly. Its $O(n^2)$ time complexity meant that as the log size grew, the training and inference times bottlenecked the entire Python daemon.

**What I chose: Isolation Forest**
Isolation Forests are explicitly designed for anomaly detection. The algorithm isolates anomalies instead of profiling normal points, making it incredibly fast to train and execute on CPU. It has a tiny memory footprint. After switching to Isolation Forest, inference time dropped to milliseconds, and our F1 score on the validation set (which contains mixed benign/attack traffic) jumped from 0.71 to 0.89.

## 3. Threat Mitigation Strategy (Blocking vs. Throttling)

**The Problem:** Once the Python engine detects an anomaly, what do we do with the user?

**What I considered:**
- *Instant hard IP bans* on any anomaly.
- *Manual review queues* for admins.

**What I rejected:**
- *Instant hard bans* led to terrible false positives during load testing. If a legitimate frontend client had a retry-loop bug, the ML model would flag it as a volumetric anomaly and permanently ban the user's IP.
- *Manual review* completely defeats the purpose of an automated security tool.

**What I chose: Soft-Voting Ensemble & Penalty Strikes**
I split the detection into two layers. 
1. **Deterministic (Inline):** If the Node.js gateway sees obvious malicious payloads (e.g., `' OR 1=1`), it issues a 403 instantly. No ML required.
2. **Behavioral (Async):** For anomalies, the ML model and the Heuristic engine cast "votes". Instead of a hard ban, the system applies strikes. If an IP reaches the first threshold, they are *throttled* (rate-limited severely). If they continue the behavior, they are *hard blocked* at the TCP layer. This gives misconfigured clients a chance to back off without permanently locking them out of the system.
