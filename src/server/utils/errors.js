'use strict';

class MantisError extends Error {
  constructor(message, statusCode = 500, errorCode = 'INTERNAL_ERROR', isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
  toJSON() {
    return { error: this.errorCode, message: this.message, statusCode: this.statusCode };
  }
}

class BlockedError extends MantisError {
  constructor(reason = 'Blocked by MANTIS', details = {}) {
    super(reason, 403, 'BLOCKED');
    this.details = details;
  }
}

class RateLimitError extends MantisError {
  constructor(retryAfter = 60) {
    super('Rate limit exceeded', 429, 'RATE_LIMIT_EXCEEDED');
    this.retryAfter = retryAfter;
  }
}

class ValidationError extends MantisError {
  constructor(message = 'Request validation failed', patterns = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.patterns = patterns;
  }
}

class ThreatDetectedError extends MantisError {
  constructor(threatType = 'UNKNOWN', score = 0, patterns = []) {
    super(`Threat detected: ${threatType}`, 403, 'THREAT_DETECTED');
    this.threatType = threatType;
    this.score = score;
    this.patterns = patterns;
  }
}

class AuthenticationError extends MantisError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTH_REQUIRED');
  }
}

class AuthorizationError extends MantisError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'FORBIDDEN');
  }
}

class NotFoundError extends MantisError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

module.exports = {
  MantisError, BlockedError, RateLimitError, ValidationError,
  ThreatDetectedError, AuthenticationError, AuthorizationError, NotFoundError
};
