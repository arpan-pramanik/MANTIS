# MANTIS: In-Depth Technical Overview

---

## 🧠 System Architecture & Workflow

MANTIS is a modular, real-time API threat detection and mitigation system. It consists of:
- **Express.js API Server**: Handles all API traffic, logs requests, enforces rate limits, and blocks malicious actors.
- **SQLite Database**: Stores all request logs and blocklist data for fast, reliable access.
- **Python Anomaly Engine**: Continuously analyzes traffic using machine learning and heuristics, updating the blocklist and threat logs.
- **Traffic Simulators**: Generate diverse, realistic, and evolving API traffic for stress-testing and validation.
- **Repeat Nuance Tester**: Replays blocked patterns to verify the effectiveness of mitigation.

---

## 🏗️ Why These Technologies?

### Express.js
- **Why?** Fast, lightweight, and widely adopted for API backends. Integrates easily with middleware (rate limiting, logging).
- **How?** Used to build the API server, manage endpoints, and enforce security policies.

### SQLite
- **Why?** Zero-setup, file-based, and highly performant for moderate data volumes. Ideal for self-hosted, portable solutions.
- **How?** Stores all request logs and blocklist entries, enabling fast queries for anomaly detection.

### Python (Anomaly Engine)
- **Why?** Python excels at data analysis, ML, and rapid prototyping. Rich ecosystem (pandas, scikit-learn) for advanced analytics.
- **How?** Implements feature extraction, ML models, heuristics, and blocklist/threat log management.

---

## 🔬 Detection Methodology

### Feature Extraction
- **What?** Extracts behavioral features from logs: request rate, endpoint diversity, token entropy, user-agent score, burstiness, endpoint switching, token rotation, botnet score.
- **Why?** These features capture both obvious and subtle attack patterns, including coordinated and polymorphic threats.

### Machine Learning
- **Isolation Forest**: Detects outliers in high-dimensional behavioral data. Chosen for its robustness and efficiency in unsupervised anomaly detection.
- **Local Outlier Factor (LOF)**: Identifies local density anomalies, catching attacks that blend in globally but stand out locally. Used in ensemble with Isolation Forest for higher accuracy.
- **Adaptive Thresholds**: Dynamically tune sensitivity based on recent traffic, reducing false positives and adapting to changing patterns.

### Heuristics
- **Why?** ML alone may miss certain attack types or produce false positives. Heuristics (rate > 100, entropy > 2, burstiness > 5, botnet score > 3, etc.) catch known and emerging threats reliably.
- **How?** Heuristic rules are combined with ML results to decide blocking actions.

---

## 🚦 Mitigation & Blocklist Management
- **Automated Blocking**: Detected threats (IPs/tokens) are instantly added to the blocklist, preventing further access.
- **Threat Logging**: Every mitigation action is logged with full feature context for audit and analysis.
- **Repeat Nuance Testing**: Blocked patterns are replayed to verify that mitigation is effective and robust.

---

## 🧩 Why This Approach?
- **Modularity**: Each component (server, engine, simulator) is independent, making the system extensible and maintainable.
- **Self-Hostable**: No cloud dependencies; everything runs locally for privacy and control.
- **Real-Time**: Continuous scanning and blocking ensure threats are mitigated instantly.
- **Explainability**: Threat logs include all features and decision context, supporting transparency and auditability.
- **Resilience**: Ensemble ML + heuristics catch both known and unknown attacks, including zero-days and coordinated botnets.

---

## 🏆 Achievements
- **Industry-Ready**: Combines best practices from enterprise security with open-source accessibility.
- **Infinite Diversity Simulation**: Traffic simulators generate never-repeating, evolving attack and benign patterns for robust testing.
- **Automated Verification**: Repeat nuance tester ensures blocklist effectiveness and system reliability.
- **Extensible**: Easy to add new features, detection methods, or visualization tools.

---

## 🎨 Visualization & Next Steps
- **Visualization**: Threat logs and blocklist data can be visualized for deeper insights (dashboard integration recommended).
- **Notifications**: Optional integration with alerting systems for real-time incident response.
- **Further Automation**: Scheduled reporting, accuracy metrics, and adaptive learning can be added as needed.

---

## 📚 References
- [Express.js](https://expressjs.com/)
- [SQLite](https://www.sqlite.org/index.html)
- [scikit-learn: Isolation Forest](https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.IsolationForest.html)
- [scikit-learn: Local Outlier Factor](https://scikit-learn.org/stable/modules/generated/sklearn.neighbors.LocalOutlierFactor.html)
- [pandas](https://pandas.pydata.org/)

---

*This document explains the rationale, design, and technical details behind MANTIS. For further questions or contributions, see the main README or contact the author.*
