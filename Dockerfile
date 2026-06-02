# MANTIS Production Dockerfile
# Multi-stage build for optimized image size

FROM node:20-alpine AS node-builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --production
COPY src/server/ src/server/
COPY config/ config/

FROM python:3.12-slim AS python-builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY src/engine/ src/engine/
COPY config/ config/

FROM node:20-alpine AS runtime
RUN apk add --no-cache python3 py3-pip py3-numpy py3-scipy py3-pandas
WORKDIR /app

# Copy Node.js application
COPY --from=node-builder /app/node_modules ./node_modules
COPY --from=node-builder /app/src/server ./src/server
COPY --from=node-builder /app/config ./config
COPY package.json .

# Copy Python engine
COPY --from=python-builder /usr/local/lib/python3.12/site-packages /usr/lib/python3.12/site-packages
COPY --from=python-builder /app/src/engine ./src/engine

# Copy shared schemas
COPY src/shared/ src/shared/

# Copy dashboard
COPY dashboard/ dashboard/

# Create directories
RUN mkdir -p logs data

# Environment
ENV NODE_ENV=production
ENV MANTIS_PORT=3000
ENV MANTIS_WS_PORT=3001
ENV MANTIS_LOG_LEVEL=info

EXPOSE 3000 3001 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start both Node.js server and Python engine
CMD ["sh", "-c", "node src/server/server.js & python3 -m src.engine.main & wait"]
