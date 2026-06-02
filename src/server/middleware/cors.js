'use strict';

const cors = require('cors');
const helmet = require('helmet');

function createSecurityMiddleware() {
  const corsMiddleware = cors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Token', 'X-API-Key', 'X-Correlation-ID'],
    exposedHeaders: ['X-Correlation-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset', 'Retry-After'],
    credentials: true,
    maxAge: 86400
  });

  const helmetMiddleware = helmet({
    contentSecurityPolicy: false, // Allow dashboard to load
    crossOriginEmbedderPolicy: false
  });

  return { corsMiddleware, helmetMiddleware };
}

module.exports = { createSecurityMiddleware };
