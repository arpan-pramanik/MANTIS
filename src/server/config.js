'use strict';

const path = require('path');
const fs = require('fs');

function loadConfig() {
  const defaultPath = path.join(__dirname, '..', '..', 'config', 'default.json');
  const config = JSON.parse(fs.readFileSync(defaultPath, 'utf8'));

  // Environment variable overrides
  const env = process.env;
  if (env.MANTIS_PORT) config.port = parseInt(env.MANTIS_PORT, 10);
  if (env.MANTIS_HOST) config.host = env.MANTIS_HOST;
  if (env.MANTIS_ENV) config.environment = env.MANTIS_ENV;
  if (env.MANTIS_JWT_SECRET) config.jwt.secret = env.MANTIS_JWT_SECRET;
  if (env.MANTIS_JWT_EXPIRES_IN) config.jwt.expiresIn = env.MANTIS_JWT_EXPIRES_IN;
  if (env.MANTIS_REDIS_ENABLED) config.redis.enabled = env.MANTIS_REDIS_ENABLED === 'true';
  if (env.MANTIS_REDIS_HOST) config.redis.host = env.MANTIS_REDIS_HOST;
  if (env.MANTIS_REDIS_PORT) config.redis.port = parseInt(env.MANTIS_REDIS_PORT, 10);
  if (env.MANTIS_REDIS_PASSWORD) config.redis.password = env.MANTIS_REDIS_PASSWORD;
  if (env.MANTIS_DB_FILE) config.database.file = env.MANTIS_DB_FILE;
  if (env.MANTIS_LOG_LEVEL) config.logging.level = env.MANTIS_LOG_LEVEL;
  if (env.MANTIS_SCAN_INTERVAL) config.detection.scanInterval = parseInt(env.MANTIS_SCAN_INTERVAL, 10);
  if (env.MANTIS_WS_ENABLED) config.websocket.enabled = env.MANTIS_WS_ENABLED === 'true';
  if (env.MANTIS_WS_PORT) config.websocket.port = parseInt(env.MANTIS_WS_PORT, 10);

  return Object.freeze(config);
}

module.exports = loadConfig();
