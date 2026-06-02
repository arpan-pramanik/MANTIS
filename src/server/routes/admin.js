'use strict';

const { Router } = require('express');
const { authenticate, requireAdmin, generateToken } = require('../middleware/auth');
const blocklistService = require('../services/blocklist');
const threatIntel = require('../services/threatIntel');
const config = require('../config');
const router = Router();

// All admin routes require authentication
router.use(authenticate);
router.use(requireAdmin);

/** POST /token — generate admin JWT */
router.post('/token', (req, res) => {
  const token = generateToken({ createdAt: new Date().toISOString() });
  res.json({ token, expiresIn: config.jwt.expiresIn });
});

/** GET /blocklist */
router.get('/blocklist', (req, res) => {
  const limit = parseInt(req.query.limit || '100', 10);
  const offset = parseInt(req.query.offset || '0', 10);
  const entries = blocklistService.getAll(limit, offset);
  res.json({ data: entries, total: entries.length, limit, offset });
});

/** POST /blocklist */
router.post('/blocklist', (req, res) => {
  const { ip, token, reason, severity, ttlSeconds } = req.body;
  if (!ip && !token) return res.status(400).json({ error: 'ip or token required' });
  const result = blocklistService.add({
    ip, token, reason,
    severity: severity || 'MEDIUM',
    detectedBy: 'admin',
    mitreTactic: '',
    ttlSeconds: ttlSeconds || null
  });
  res.json({ status: 'ok', ...result });
});

/** DELETE /blocklist/:id */
router.delete('/blocklist/:id', (req, res) => {
  const result = blocklistService.remove(parseInt(req.params.id, 10));
  if (result.changes === 0) return res.status(404).json({ error: 'Entry not found' });
  res.json({ status: 'removed' });
});

/** GET /threats */
router.get('/threats', (req, res) => {
  const filters = {
    severity: req.query.severity,
    threatType: req.query.type,
    since: req.query.since,
    ip: req.query.ip,
    limit: req.query.limit || '100',
    offset: req.query.offset || '0'
  };
  const events = threatIntel.getThreats(filters);
  res.json({ data: events, total: events.length });
});

/** GET /threats/stats */
router.get('/threats/stats', (req, res) => {
  const stats = threatIntel.getStats();
  res.json(stats);
});

/** GET /threats/timeline */
router.get('/threats/timeline', (req, res) => {
  const timeline = threatIntel.getTimeline();
  res.json({ data: timeline });
});

/** POST /allowlist */
router.post('/allowlist', (req, res) => {
  const { ip, token, reason } = req.body;
  if (!ip && !token) return res.status(400).json({ error: 'ip or token required' });
  const result = blocklistService.allowlist({ ip, token, reason });
  res.json({ status: 'ok', ...result });
});

/** GET /config — view running config (redacted) */
router.get('/config', (req, res) => {
  const redacted = JSON.parse(JSON.stringify(config));
  if (redacted.jwt) redacted.jwt.secret = '***REDACTED***';
  if (redacted.redis?.password) redacted.redis.password = '***REDACTED***';
  res.json(redacted);
});

module.exports = router;
