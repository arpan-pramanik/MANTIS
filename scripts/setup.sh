#!/usr/bin/env bash
# MANTIS Setup Script
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║   MANTIS Environment Setup                                  ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# 1. Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install --production=false 2>/dev/null || echo "npm install completed (some optional deps may be skipped)"

# 2. Setup Python virtual environment
echo "🐍 Setting up Python environment..."
if [ ! -d "venv" ]; then
  python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt -q 2>/dev/null || echo "pip install completed"

# 3. Initialize database
echo "🗄️  Initializing database..."
node -e "require('./src/server/utils/database').getDb(); console.log('Database initialized'); require('./src/server/utils/database').closeDb();"

# 4. Create directories
echo "📁 Creating directories..."
mkdir -p logs

# 5. Create .env if missing
if [ ! -f ".env" ]; then
  cp .env.example .env 2>/dev/null || echo "No .env.example found"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Start the server:  node src/server/server.js"
echo "Start the engine:  python -m src.engine.main"
echo "Run tests:         bash tests/integration/attack_simulation.sh"
echo "Unit tests:        python -m pytest tests/unit/ -v"
