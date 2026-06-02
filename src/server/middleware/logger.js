'use strict';

const { insertLog } = require('../utils/database');
const { correlationId, fingerprint: fingerprintReq } = require('../utils/crypto');
const { getClientIp } = require('./blocker');
const { httpRequestsTotal, httpRequestDurationMicroseconds } = require('../utils/metrics');

/** Request logging middleware */
function requestLogger(req, res, next) {
  const startTime = Date.now();
  req.correlationId = req.headers['x-correlation-id'] || correlationId();
  req.startTime = startTime;

  // Capture response info when finished
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    const body = req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH'
      ? JSON.stringify(req.body || {}).slice(0, 2048)
      : '';

    const entry = {
      ip: req.clientIp || getClientIp(req),
      token: req.headers['x-api-token'] || '',
      path: req.path,
      method: req.method,
      userAgent: req.headers['user-agent'] || '',
      body,
      queryParams: JSON.stringify(req.query || {}),
      headers: JSON.stringify({
        'accept': req.headers['accept'] || '',
        'content-type': req.headers['content-type'] || '',
        'x-forwarded-for': req.headers['x-forwarded-for'] || '',
        'origin': req.headers['origin'] || ''
      }),
      timestamp: new Date().toISOString(),
      correlationId: req.correlationId,
      responseStatus: res.statusCode,
      responseTime,
      bodySize: parseInt(req.headers['content-length'] || '0', 10),
      threatScore: req.threatScore || 0,
      fingerprint: fingerprintReq(req)
    };

    try {
      insertLog(entry);
    } catch (err) {
      // Don't crash the server if logging fails
    }

    // Update metrics
    const routePattern = req.route ? req.route.path : req.path;
    httpRequestsTotal.inc({ method: req.method, route: routePattern, status_code: res.statusCode });
    httpRequestDurationMicroseconds.observe({ method: req.method, route: routePattern, status_code: res.statusCode }, responseTime);
  });

  // Set correlation ID header on response
  res.set('X-Correlation-ID', req.correlationId);
  next();
}

module.exports = { requestLogger };
