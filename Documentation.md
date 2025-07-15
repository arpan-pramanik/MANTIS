Project Code Name: API Sentinel – Free Runtime API Threat Detection & Mitigation
Project Name  : MANTIS  - Mitigation of API-based Nuisances using Threat Intelligence System

🌍 Introduction
In an era where APIs power almost every modern web and mobile application, securing them is mission-critical. While most companies focus on static or rule-based API security, runtime threats like abuse, scraping, brute-forcing, and abnormal traffic often go undetected until damage is done. MANTIS solves this problem using a lightweight, free, and fully self-hostable system that detects abnormal API behavior and mitigates threats instantly without any paid services or infrastructure dependencies.

📄 About the Project
MANTIS is a real-time API runtime security monitoring and threat mitigation tool that integrates directly into your backend application (Express.js or Flask) to monitor and detect:
High-frequency endpoint access


Abnormal IP/token behavior


Suspicious API patterns (e.g., unknown endpoints, 403/404 bursts)


Upon detection, it automatically blocks malicious users/IPs, logs the event, and (optionally) visualizes activity through a simple dashboard. The project is designed to be:
Completely free (no cloud costs, uses local storage)


Easy to integrate into any backend system


Lightweight and fast (1-week build time)


Developer- and company-friendly



✅ Why This Project?
Current cloud-based API security solutions (e.g., AWS WAF, Cloudflare API Shield, etc.) are expensive, require paid tiers, and can be overkill for startups, internal apps, or early-stage companies.
Problems Solved:
Real-time detection of API abuse or brute-force


Blocking without relying on third-party or paid tools


Logs and visualizes threats for analysis


Empowers developers with security insights without complex setups



🤖 How It Works
Core Modules:
Middleware Logger


Captures every incoming request: IP, token, path, method, timestamp


Stores data in lightweight storage (JSON or SQLite)


Anomaly Detector


Profiles normal traffic per endpoint/token


Flags traffic anomalies like burst access, unknown endpoints, etc.


Auto-Blocker


Adds flagged IPs/tokens to a local blocklist or updates NGINX rules


Middleware rejects requests from blocked entities


(Optional) Web Dashboard


Displays active threats, logs, and blocked entities


Built using Flask or React (optional based on timeline)


Traffic Simulator


Simulates normal vs. abnormal traffic to test detection logic



⚖️ Technical Stack
Component
Technology
Purpose
API Server
Express.js
Log and handle API traffic
Anomaly Engine
Python + Pandas
Analyze traffic & detect threats
Storage
SQLite or JSON
Store request logs & blocklists
Dashboard (Opt)
Flask + Chart.js or React.js
Display data
Mitigation
Python / NGINX
Block access via script/config
Simulation
Locust or Python
Simulate traffic for testing
Hosting
Localhost / Free-tier platforms
Zero-cost deployment


🔄 Flowchart
graph TD
    A[API Request] --> B[Middleware Logger]
    B --> C[Log Request Details]
    C --> D[Anomaly Detector]
    D -->|Normal| E[Allow Request]
    D -->|Abnormal| F[Auto Block]
    F --> G[Add IP/Token to Blocklist]
    G --> H[Future Request Blocked]


🔎 Real-World Use Case Example
Scenario:
A company exposes /api/user and /api/product endpoints. Suddenly, a bot starts hammering /api/admin and /api/login with random credentials.
What MANTIS Does:
Logs all traffic


Notices /api/admin does not exist and has 100 requests in 1 minute


Flags IP/token as anomalous


Automatically blocks IP and logs incident


Shows it on the dashboard (if enabled)



📊 Key Features (MVP)
✉ Real-time request logging (IP, token, endpoint)


⚡ Behavior profiling and anomaly detection


❌ Automated blocking mechanism


🔍 Dashboard for manual review (optional)


⚖ Free to deploy, lightweight footprint


⚒ Compatible with any backend or container



📚 Deliverables
GitHub repo with full code (backend, anomaly engine, block logic)


README with setup instructions


Optional hosted demo (Replit or local demo recording)


Sample anomaly logs and screenshots


Flowchart and architecture diagram (Markdown + Mermaid)



🚀 Future Enhancements
JWT introspection & signature check


Adaptive learning using unsupervised ML (e.g., isolation forests)


Slack/Webhook notifications for alerts


Multi-instance sync (for microservice scale)


Integration with NGINX+ModSecurity or Envoy Proxy



📆 Timeline (1-Week MVP Build)
Day
Task
1
Set up API server + middleware logger
2
Add SQLite/JSON logging and analysis script
3
Implement basic anomaly detection rules
4
Add IP/token blocklist logic
5
Test with simulated normal vs. attack traffic
6
Build minimal dashboard (optional)
7
Polish, document, record demo


🔧 Setup & Run (CLI Based)
# Clone repo
git clone https://github.com/yourusername/api-sentinel.git
cd api-sentinel

# Start API server
python api_server.py  # or `node index.js`

# Send test requests
python simulate_traffic.py

# View logs
cat logs.json

# View dashboard (optional)
python dashboard.py  # or run React dev server


💼 Final Words
MANTIS proves that API runtime protection doesn't need to be expensive or complex. This project reflects your ability to combine real-world problem solving, system design, and cybersecurity skills with developer pragmatism — a strong highlight for any cloud/cybersecurity role.
Author: Arpan Pramanik
 Project Type: Lightweight Cloud Security Tool
 Use Case: Free, deployable API protection

