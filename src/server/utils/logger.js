'use strict';

const winston = require('winston');
const path = require('path');
const fs = require('fs');

const LOG_DIR = path.join(__dirname, '..', '..', '..', 'logs');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

const securityFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, correlationId, ...meta }) => {
    const cid = correlationId ? ` [${correlationId.slice(0, 8)}]` : '';
    const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} ${level}${cid}: ${message}${extra}`;
  })
);

const logger = winston.createLogger({
  level: process.env.MANTIS_LOG_LEVEL || 'info',
  levels: { fatal: 0, error: 1, warn: 2, info: 3, http: 4, debug: 5 },
  defaultMeta: { service: 'mantis-gateway' },
  transports: [
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'mantis.log'),
      format: securityFormat,
      maxsize: 50 * 1024 * 1024,
      maxFiles: 10,
      tailable: true
    }),
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'error.log'),
      level: 'error',
      format: securityFormat,
      maxsize: 50 * 1024 * 1024,
      maxFiles: 5
    })
  ]
});

winston.addColors({ fatal: 'red bold', error: 'red', warn: 'yellow', info: 'cyan', http: 'magenta', debug: 'gray' });

if (process.env.NODE_ENV !== 'test') {
  logger.add(new winston.transports.Console({ format: consoleFormat, level: 'debug' }));
}

const securityLogger = winston.createLogger({
  level: 'info',
  defaultMeta: { service: 'mantis-security' },
  transports: [
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'security.log'),
      format: securityFormat,
      maxsize: 50 * 1024 * 1024,
      maxFiles: 10
    })
  ]
});

/** Create a child logger with a correlation ID bound */
function createChildLogger(correlationId) {
  return logger.child({ correlationId });
}

/** Log a security event */
function logSecurityEvent(event) {
  securityLogger.info('SECURITY_EVENT', event);
  logger.warn(`Security: ${event.type || 'UNKNOWN'}`, { ...event, security: true });
}

module.exports = { logger, securityLogger, createChildLogger, logSecurityEvent };
