'use strict';

const { isBlocked, isAllowlisted, expireBlocks } = require('../utils/database');
const { BlockedError } = require('../utils/errors');
const { logSecurityEvent } = require('../utils/logger');

// In-memory cache for blocklist with TTL
let blockCache = new Map();
let allowCache = new Map();
let lastCacheRefresh = 0;
const CACHE_TTL = 30000; // 30 seconds

function refreshCache() {
  const now = Date.now();
  if (now - lastCacheRefresh < CACHE_TTL) return;
  blockCache.clear();
  allowCache.clear();
  lastCacheRefresh = now;
  // Expire old blocks on cache refresh
  try { expireBlocks(); } catch (e) { /* db might not be ready */ }
}

/** Get the real client IP */
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || req.ip || '0.0.0.0';
}

/** CIDR matching for IPv4 */
function ipMatchesCIDR(ip, cidr) {
  if (!cidr.includes('/')) return ip === cidr;
  const [range, bits] = cidr.split('/');
  const mask = ~(2 ** (32 - parseInt(bits, 10)) - 1) >>> 0;
  const ipNum = ip.split('.').reduce((acc, oct) => (acc << 8) + parseInt(oct, 10), 0) >>> 0;
  const rangeNum = range.split('.').reduce((acc, oct) => (acc << 8) + parseInt(oct, 10), 0) >>> 0;
  return (ipNum & mask) === (rangeNum & mask);
}

/** Threat blocking middleware */
function blocker(req, res, next) {
  refreshCache();

  const ip = getClientIp(req);
  const token = req.headers['x-api-token'] || '';
  req.clientIp = ip;

  // Check allowlist first
  const allowKey = `${ip}:${token}`;
  if (!allowCache.has(allowKey)) {
    const allowed = isAllowlisted(ip, token);
    allowCache.set(allowKey, !!allowed);
  }
  if (allowCache.get(allowKey)) return next();

  // Check block cache
  const blockKey = `${ip}:${token}`;
  if (blockCache.has(blockKey)) {
    const cached = blockCache.get(blockKey);
    if (cached) {
      logSecurityEvent({
        type: 'REQUEST_BLOCKED',
        ip,
        token: token.slice(0, 8) + '***',
        reason: cached.reason,
        severity: cached.severity,
        path: req.path
      });
      return next(new BlockedError(cached.reason || 'Blocked by MANTIS', {
        severity: cached.severity,
        mitreTactic: cached.mitreTactic,
        strikes: cached.strikes
      }));
    }
    return next();
  }

  // Database lookup
  try {
    const blocked = isBlocked(ip, token);
    blockCache.set(blockKey, blocked || null);

    if (blocked) {
      // Check expiration
      if (blocked.expiresAt && new Date(blocked.expiresAt) < new Date()) {
        blockCache.set(blockKey, null);
        return next();
      }
      logSecurityEvent({
        type: 'REQUEST_BLOCKED',
        ip,
        token: token.slice(0, 8) + '***',
        reason: blocked.reason,
        severity: blocked.severity,
        path: req.path
      });
      return next(new BlockedError(blocked.reason || 'Blocked by MANTIS', {
        severity: blocked.severity,
        mitreTactic: blocked.mitreTactic,
        strikes: blocked.strikes
      }));
    }
  } catch (err) {
    // If DB is unavailable, allow request through (fail-open for availability)
  }

  next();
}

/** Clear the block cache (useful for tests) */
function clearBlockCache() {
  blockCache.clear();
  allowCache.clear();
  lastCacheRefresh = 0;
}

module.exports = { blocker, getClientIp, clearBlockCache, ipMatchesCIDR };
