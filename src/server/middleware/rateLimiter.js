'use strict';

const rateLimit = require('express-rate-limit');
const { logSecurityEvent } = require('../utils/logger');

/** Create multi-tier rate limiters */
function createRateLimiters(config) {
  const handler = (req, res) => {
    logSecurityEvent({
      type: 'RATE_LIMIT_EXCEEDED',
      ip: req.clientIp || req.ip,
      path: req.path,
      method: req.method,
      limit: res.getHeader('X-RateLimit-Limit')
    });
    res.status(429).json({
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please slow down.',
      retryAfter: Math.ceil(config.rateLimit.global.windowMs / 1000)
    });
  };

  const globalLimiter = rateLimit({
    windowMs: config.rateLimit.global.windowMs,
    max: config.rateLimit.global.maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    handler,
    keyGenerator: (req) => req.clientIp || req.ip,
    skip: (req) => req.path.startsWith('/health')
  });

  const authLimiter = rateLimit({
    windowMs: config.rateLimit.auth.windowMs,
    max: config.rateLimit.auth.maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logSecurityEvent({
        type: 'AUTH_RATE_LIMIT_EXCEEDED',
        ip: req.clientIp || req.ip,
        path: req.path,
        severity: 'HIGH'
      });
      res.status(429).json({
        error: 'AUTH_RATE_LIMIT_EXCEEDED',
        message: 'Too many authentication attempts.',
        retryAfter: Math.ceil(config.rateLimit.auth.windowMs / 1000)
      });
    },
    keyGenerator: (req) => req.clientIp || req.ip
  });

  const adminLimiter = rateLimit({
    windowMs: config.rateLimit.admin.windowMs,
    max: config.rateLimit.admin.maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    handler,
    keyGenerator: (req) => req.clientIp || req.ip
  });

  return { globalLimiter, authLimiter, adminLimiter };
}

module.exports = { createRateLimiters };
