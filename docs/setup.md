# Local Development Setup

If you don't want to use Docker, here is how you run MANTIS on bare metal. I usually do this when debugging the ML engine so I can attach a local debugger.

## 1. Gateway (Node.js)

The gateway requires Node 20+. 

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Run the server
npm run dev
```
By default, the gateway will spin up on port 3000 and proxy traffic to whatever `UPSTREAM_API_URL` you defined in your `.env`.

## 2. Threat Engine (Python)

The engine requires Python 3.10+. I highly recommend using a virtual environment.

```bash
# Create and activate venv
python3 -m venv venv
source venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Run the engine
python3 -m src.engine.main
```

## 3. Simulating Attacks

Once both are running, you can test the setup using the included simulation script.

```bash
# This will fire 47 different attack vectors at localhost:3000
bash tests/integration/attack_simulation.sh
```
Watch the output in the Python terminal. You should see the Isolation Forest detect the anomaly and issue a strike against your local IP, followed by a hard block.
