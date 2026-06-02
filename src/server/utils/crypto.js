'use strict';

const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

/** SHA-256 hash */
function sha256(data) {
  return crypto.createHash('sha256').update(String(data)).digest('hex');
}

/** HMAC-SHA256 */
function hmac(data, secret) {
  return crypto.createHmac('sha256', secret).update(String(data)).digest('hex');
}

/** Generate a request fingerprint from headers */
function fingerprint(req) {
  const parts = [
    req.headers['user-agent'] || '',
    req.headers['accept'] || '',
    req.headers['accept-language'] || '',
    req.headers['accept-encoding'] || ''
  ].join('|');
  return sha256(parts);
}

/** Hash a token for safe storage */
function hashToken(token) {
  return sha256(token);
}

/** Generate a correlation ID */
function correlationId() {
  return uuidv4();
}

/** Generate a secure random string */
function randomString(length = 32) {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
}

module.exports = { sha256, hmac, fingerprint, hashToken, correlationId, randomString };
