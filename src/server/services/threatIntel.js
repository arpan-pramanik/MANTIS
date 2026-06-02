'use strict';

const db = require('../utils/database');
const { logger, logSecurityEvent } = require('../utils/logger');

let wsServer = null;

function setWebSocket(wss) {
  wsServer = wss;
}

/** Broadcast a threat event to all connected WebSocket clients */
function broadcast(event) {
  if (!wsServer) return;
  const data = JSON.stringify({ type: 'threat', data: event });
  wsServer.clients.forEach(client => {
    if (client.readyState === 1) { // WebSocket.OPEN
      try { client.send(data); } catch (e) { /* ignore */ }
    }
  });
}

/** Record a threat event */
function recordThreat(event) {
  try {
    db.insertThreatEvent({
      eventId: event.eventId || require('uuid').v4(),
      timestamp: event.timestamp || new Date().toISOString(),
      source: event.source || 'unknown',
      threatType: event.threatType || 'UNKNOWN',
      severity: event.severity || 'MEDIUM',
      confidence: event.confidence || 0,
      mitreTactic: event.mitreTactic || '',
      actorIp: event.actor?.ip || event.actorIp || '',
      actorToken: event.actor?.token || event.actorToken || '',
      actorUserAgent: event.actor?.userAgent || event.actorUserAgent || '',
      actorFingerprint: event.actor?.fingerprint || event.actorFingerprint || '',
      requestMethod: event.request?.method || event.requestMethod || '',
      requestPath: event.request?.path || event.requestPath || '',
      requestBodyHash: event.request?.bodyHash || event.requestBodyHash || '',
      requestBodySize: event.request?.bodySize || event.requestBodySize || 0,
      matchedPatterns: JSON.stringify(event.detection?.matchedPatterns || event.matchedPatterns || []),
      featureScores: JSON.stringify(event.detection?.featureScores || event.featureScores || {}),
      mlScore: event.detection?.mlScore || event.mlScore || 0,
      heuristicScore: event.detection?.heuristicScore || event.heuristicScore || 0,
      ensembleScore: event.detection?.ensembleScore || event.ensembleScore || 0,
      mitigationAction: event.mitigation?.action || event.mitigationAction || 'none',
      mitigationDuration: event.mitigation?.duration || event.mitigationDuration || 0,
      mitigationReason: event.mitigation?.reason || event.mitigationReason || '',
      context: JSON.stringify(event.context || {})
    });

    // Broadcast to WebSocket clients
    broadcast(event);
  } catch (err) {
    logger.error('Failed to record threat event', { error: err.message });
  }
}

/** Get threat events with filters */
function getThreats(filters = {}) {
  return db.getThreatEvents(filters);
}

/** Get threat statistics */
function getStats() {
  return db.getThreatStats();
}

/** Get threat timeline */
function getTimeline() {
  return db.getThreatTimeline();
}

module.exports = { recordThreat, getThreats, getStats, getTimeline, setWebSocket, broadcast };
