'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config');
const { AuthenticationError, AuthorizationError } = require('../utils/errors');
const { logger } = require('../utils/logger');

/** Generate an admin JWT token */
function generateToken(payload = {}) {
  return jwt.sign(
    { role: 'admin', ...payload, iss: config.jwt.issuer },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

/** JWT authentication middleware */
function authenticate(req, res, next) {
  // Skip auth for health endpoints
  if (req.path.startsWith('/health')) return next();

  const authHeader = req.headers['authorization'];
  const apiKey = req.headers['x-api-key'];

  // API key auth
  if (apiKey) {
    if (apiKey === config.jwt.secret) {
      req.user = { role: 'admin', authMethod: 'api-key' };
      return next();
    }
    return next(new AuthenticationError('Invalid API key'));
  }

  // JWT auth
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AuthenticationError('Missing or malformed Authorization header'));
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AuthenticationError('Token expired'));
    }
    return next(new AuthenticationError('Invalid token'));
  }
}

/** Require admin role */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return next(new AuthorizationError());
  }
  next();
}

module.exports = { authenticate, requireAdmin, generateToken };
