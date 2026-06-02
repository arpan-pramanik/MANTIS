'use strict';

const db = require('../utils/database');
const { logSecurityEvent, logger } = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const { activeBlocksGauge } = require('../utils/metrics');

class BlocklistService {
  constructor() {
    this.strikeThresholds = {
      warn: 1,
      throttle: 2,
      tempBlock: 3,
      permBlock: 5
    };
  }

  /** Add an entry to the blocklist with graduated response */
  add({ ip, token, reason, severity, detectedBy, mitreTactic, ttlSeconds }) {
    if (!ip && !token) throw new Error('Either ip or token is required');

    // Check allowlist
    if (db.isAllowlisted(ip, token)) {
      logger.info('Skipping block for allowlisted entity', { ip, token });
      return { action: 'skipped', reason: 'allowlisted' };
    }

    // Check existing block
    const existing = db.isBlocked(ip, token);
    if (existing) {
      db.updateStrikes(ip, token);
      const newStrikes = existing.strikes + 1;

      // Escalate if needed
      if (newStrikes >= this.strikeThresholds.permBlock && existing.expiresAt) {
        // Upgrade to permanent block
        db.getDb().prepare('UPDATE blocklist SET expiresAt = \'\', strikes = ? WHERE id = ?')
          .run(newStrikes, existing.id);
        logSecurityEvent({
          type: 'BLOCK_ESCALATED_PERMANENT',
          ip, token: (token || '').slice(0, 8) + '***',
          strikes: newStrikes, severity
        });
        return { action: 'permBlock', strikes: newStrikes };
      }

      logSecurityEvent({
        type: 'STRIKE_ADDED',
        ip, strikes: newStrikes, severity
      });
      return { action: 'strikeAdded', strikes: newStrikes };
    }

    // New block
    const now = new Date();
    const expiresAt = ttlSeconds
      ? new Date(now.getTime() + ttlSeconds * 1000).toISOString()
      : '';

    db.addBlock({
      ip: ip || '',
      token: token || '',
      reason: reason || 'Threat detected by MANTIS',
      severity: severity || 'MEDIUM',
      detectedBy: detectedBy || 'anomaly_engine',
      mitreTactic: mitreTactic || '',
      createdAt: now.toISOString(),
      expiresAt,
      strikes: 1
    });

    logSecurityEvent({
      type: 'IP_BLOCKED',
      ip, token: (token || '').slice(0, 8) + '***',
      reason, severity, mitreTactic,
      expiresAt: expiresAt || 'never',
      detectedBy
    });

    activeBlocksGauge.set(db.getActiveBlocks().length);

    return { action: ttlSeconds ? 'tempBlock' : 'permBlock', expiresAt };
  }

  /** Remove a block */
  remove(id) {
    const result = db.removeBlock(id);
    if (result.changes > 0) {
      logger.info('Block removed', { id });
      activeBlocksGauge.set(db.getActiveBlocks().length);
    }
    return result;
  }

  /** Check if blocked */
  check(ip, token) {
    return db.isBlocked(ip, token);
  }

  /** Get all active blocks */
  getActive() {
    return db.getActiveBlocks();
  }

  /** Get all blocks with pagination */
  getAll(limit = 1000, offset = 0) {
    return db.getAllBlocks(limit, offset);
  }

  /** Add to allowlist */
  allowlist({ ip, token, reason }) {
    db.addAllowlist({
      ip: ip || '',
      token: token || '',
      reason: reason || '',
      createdAt: new Date().toISOString()
    });
    logger.info('Entity allowlisted', { ip, token, reason });
    return { action: 'allowlisted' };
  }

  /** Get statistics */
  getStats() {
    return db.getThreatStats();
  }
}

module.exports = new BlocklistService();
