# Contributing to MANTIS

First off, thanks for looking into MANTIS. I built this to solve a specific problem with inline WAFs, and I'm open to improvements.

## How to Contribute

I don't expect you to build massive features right away. If you find a bug, open an issue. If you want to fix it, open a PR.

### The Development Loop

1. **Fork the repo** and clone it locally.
2. **Install dependencies:**
   - Node: `npm install`
   - Python: `python -m venv venv && source venv/bin/activate && pip install -r requirements.txt`
3. **Run the test suite** before writing code to make sure your environment is sane:
   ```bash
   npm run test
   bash tests/integration/attack_simulation.sh
   ```
4. **Make your changes**. 
   - If you're touching the Node.js gateway, remember: *do not add blocking synchronous calls*. Every millisecond counts here.
   - If you're touching the Python ML engine, ensure you benchmark the Isolation Forest inference time. It must stay under 50ms per batch.
5. **Write a test** that proves your fix or feature works.
6. **Submit a Pull Request**. Keep it small. Explain *why* you made the change, not just what the change is.

## What I'm currently looking for:
- **Redis Adapter:** The SQLite WAL mode is great, but we need a Redis adapter for true horizontal scaling of the Node gateways.
- **IPv6 Normalization:** The current IP blocking middleware is heavily optimized for IPv4. IPv6 support is currently weak and needs a proper CIDR matching implementation.
- **More Integration Tests:** The `attack_simulation.sh` script is good, but it could use more mutated XSS payloads.

## Code Style
- **Node.js:** Standard ES6. Keep dependencies to an absolute minimum. We don't need `lodash` for a simple map function.
- **Python:** Black for formatting. Type hints are mandatory for any new functions in the `src/engine/` directory.
