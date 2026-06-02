'use strict';

const express = require('express');
const config = require('./config');
const { logger } = require('./utils/logger');
const { getDb } = require('./utils/database');
const { createSecurityMiddleware } = require('./middleware/cors');
const { blocker } = require('./middleware/blocker');
const { inputValidator } = require('./middleware/inputValidator');
const { requestLogger } = require('./middleware/logger');
const { createRateLimiters } = require('./middleware/rateLimiter');
const healthRoutes = require('./routes/health');
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');
const { getMetrics } = require('./utils/metrics');

function createApp() {
  const app = express();

  // Trust proxy
  app.set('trust proxy', config.ipIntelligence?.trustProxy || ['127.0.0.1', '::1']);

  // Security middleware
  const { corsMiddleware, helmetMiddleware } = createSecurityMiddleware();
  app.use(corsMiddleware);
  app.use(helmetMiddleware);

  // Body parsing with size limits
  app.use(express.json({ limit: config.inputValidation?.maxBodySize || '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: config.inputValidation?.maxBodySize || '1mb' }));

  // Initialize database
  getDb();

  // Rate limiting
  const { globalLimiter, authLimiter } = createRateLimiters(config);
  app.use(globalLimiter);
  app.use('/api/v1/auth', authLimiter);

  // Threat blocking
  app.use(blocker);

  // Deep request inspection
  app.use(inputValidator);

  // Request logging
  app.use(requestLogger);

  // Metrics endpoint
  app.get('/metrics', async (req, res) => {
    try {
      res.set('Content-Type', 'text/plain');
      res.send(await getMetrics());
    } catch (ex) {
      res.status(500).send(ex.message);
    }
  });

  // Routes
  app.use('/', healthRoutes);
  app.use('/', apiRoutes);
  app.use('/admin', adminRoutes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      error: 'NOT_FOUND',
      message: `Endpoint ${req.method} ${req.path} not found`,
      timestamp: new Date().toISOString()
    });
  });

  // Global error handler
  app.use((err, req, res, _next) => {
    const statusCode = err.statusCode || 500;
    const errorCode = err.errorCode || 'INTERNAL_ERROR';

    if (statusCode >= 500) {
      logger.error('Unhandled error', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        correlationId: req.correlationId
      });
    }

    res.status(statusCode).json({
      error: errorCode,
      message: err.isOperational ? err.message : 'Internal server error',
      ...(err.details ? { details: err.details } : {}),
      ...(err.patterns ? { patterns: err.patterns } : {}),
      ...(err.retryAfter ? { retryAfter: err.retryAfter } : {}),
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    });
  });

  return app;
}

module.exports = { createApp };
