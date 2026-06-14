# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-06-15

### Added
- Core Node.js API Gateway with inline signature-based validation.
- Background Python Threat Engine using Isolation Forest for behavioral anomaly detection.
- Soft-voting ensemble mechanism for dynamic IP throttling and blocking.
- Prometheus metrics endpoints and default Grafana dashboards.
- Docker-compose orchestration for zero-configuration setup.
- SQLite WAL mode event bus for high-performance IPC.

### Changed
- Refactored repository structure to completely isolate the backend from deprecated UI components.
- Rewrote documentation to focus on architecture decisions and core engine internals.

### Fixed
- Replaced verbose emoji-based logging with standard bracketed log tags for better parser compatibility.
