'use strict';

const { logger } = require('../utils/logger');

const alertQueue = [];
const recentAlerts = new Map(); // Deduplication
const DEDUP_WINDOW = 300000; // 5 minutes

/** Format alert message */
function formatAlert(event) {
  const severity = event.severity || 'UNKNOWN';
  const emoji = { CRITICAL: '🚨', HIGH: '🔴', MEDIUM: '🟡', LOW: '🟢' }[severity] || '⚪';
  return {
    text: `${emoji} MANTIS Alert: ${event.threatType || 'THREAT_DETECTED'}`,
    severity,
    details: {
      ip: event.actorIp || event.actor?.ip || 'unknown',
      type: event.threatType,
      confidence: event.confidence,
      mitreTactic: event.mitreTactic,
      action: event.mitigationAction || event.mitigation?.action || 'none',
      timestamp: event.timestamp || new Date().toISOString()
    }
  };
}

/** Check deduplication */
function isDuplicate(event) {
  const key = `${event.actorIp || ''}:${event.threatType || ''}`;
  const last = recentAlerts.get(key);
  if (last && Date.now() - last < DEDUP_WINDOW) return true;
  recentAlerts.set(key, Date.now());
  return false;
}

/** Dispatch alert via webhook */
async function dispatchWebhook(url, alert) {
  if (!url) return;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alert),
      signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) {
      logger.warn('Webhook alert failed', { status: response.status, url });
    }
  } catch (err) {
    logger.warn('Webhook dispatch error', { error: err.message, url });
  }
}

/** Queue and dispatch an alert */
function sendAlert(event, config = {}) {
  if (isDuplicate(event)) return;

  const alert = formatAlert(event);

  // Filter by severity
  const minSeverity = config.minSeverity || 'MEDIUM';
  const severityOrder = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 };
  if ((severityOrder[alert.severity] || 0) < (severityOrder[minSeverity] || 0)) return;

  logger.info('Dispatching alert', { type: event.threatType, severity: alert.severity });

  if (config.webhookUrl) {
    dispatchWebhook(config.webhookUrl, alert).catch(() => {});
  }
  if (config.slackWebhookUrl) {
    dispatchWebhook(config.slackWebhookUrl, {
      text: `${alert.text}\n\`\`\`${JSON.stringify(alert.details, null, 2)}\`\`\``
    }).catch(() => {});
  }
}

// Periodic dedup cache cleanup
setInterval(() => {
  const now = Date.now();
  for (const [key, time] of recentAlerts.entries()) {
    if (now - time > DEDUP_WINDOW) recentAlerts.delete(key);
  }
}, 60000).unref();

module.exports = { sendAlert, formatAlert };
