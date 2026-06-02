'use strict';

const { Router } = require('express');
const os = require('os');
const router = Router();

let requestCount = 0;
const startTime = Date.now();

// Count requests
router.use((req, res, next) => { requestCount++; next(); });

/** GET /health — basic health check */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'mantis-api-sentinel',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000)
  });
});

/** GET /health/ready — readiness probe */
router.get('/health/ready', (req, res) => {
  try {
    const db = require('../utils/database');
    db.getDb().prepare('SELECT 1').get();
    res.json({
      status: 'ready',
      database: 'connected',
      uptime: Math.floor((Date.now() - startTime) / 1000),
      requestsServed: requestCount,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB',
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB'
      },
      system: {
        cpus: os.cpus().length,
        loadAvg: os.loadavg().map(l => Math.round(l * 100) / 100),
        freeMemory: Math.round(os.freemem() / 1024 / 1024) + 'MB',
        totalMemory: Math.round(os.totalmem() / 1024 / 1024) + 'MB',
        platform: os.platform(),
        nodeVersion: process.version
      }
    });
  } catch (err) {
    res.status(503).json({ status: 'not_ready', error: err.message });
  }
});

/** GET /health/live — liveness probe */
router.get('/health/live', (req, res) => {
  res.json({ status: 'alive', timestamp: new Date().toISOString() });
});

module.exports = router;
