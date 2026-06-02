'use strict';

const Database = require('better-sqlite3');
const path = require('path');
const { logger } = require('./logger');

const DB_PATH = path.join(__dirname, '..', '..', '..', 'storage.db');

let db = null;

function getDb() {
  if (db) return db;
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('busy_timeout = 5000');
  db.pragma('foreign_keys = ON');
  db.pragma('synchronous = NORMAL');
  db.pragma('cache_size = -64000'); // 64MB
  initSchema();
  logger.info('Database initialized', { path: DB_PATH });
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ip TEXT NOT NULL,
      token TEXT DEFAULT '',
      path TEXT NOT NULL,
      method TEXT NOT NULL,
      userAgent TEXT DEFAULT '',
      body TEXT DEFAULT '',
      queryParams TEXT DEFAULT '',
      headers TEXT DEFAULT '',
      timestamp TEXT NOT NULL,
      correlationId TEXT DEFAULT '',
      responseStatus INTEGER DEFAULT 0,
      responseTime REAL DEFAULT 0,
      bodySize INTEGER DEFAULT 0,
      threatScore REAL DEFAULT 0,
      fingerprint TEXT DEFAULT ''
    );

    CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp);
    CREATE INDEX IF NOT EXISTS idx_logs_ip ON logs(ip);
    CREATE INDEX IF NOT EXISTS idx_logs_token ON logs(token);
    CREATE INDEX IF NOT EXISTS idx_logs_path ON logs(path);

    CREATE TABLE IF NOT EXISTS blocklist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ip TEXT DEFAULT '',
      token TEXT DEFAULT '',
      reason TEXT DEFAULT '',
      severity TEXT DEFAULT 'MEDIUM',
      detectedBy TEXT DEFAULT '',
      mitreTactic TEXT DEFAULT '',
      createdAt TEXT NOT NULL,
      expiresAt TEXT DEFAULT '',
      strikes INTEGER DEFAULT 1,
      status TEXT DEFAULT 'active' CHECK(status IN ('active','expired','allowlisted'))
    );

    CREATE INDEX IF NOT EXISTS idx_blocklist_ip ON blocklist(ip);
    CREATE INDEX IF NOT EXISTS idx_blocklist_token ON blocklist(token);
    CREATE INDEX IF NOT EXISTS idx_blocklist_status ON blocklist(status);

    CREATE TABLE IF NOT EXISTS threat_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      eventId TEXT UNIQUE NOT NULL,
      timestamp TEXT NOT NULL,
      source TEXT NOT NULL,
      threatType TEXT NOT NULL,
      severity TEXT NOT NULL,
      confidence REAL DEFAULT 0,
      mitreTactic TEXT DEFAULT '',
      actorIp TEXT DEFAULT '',
      actorToken TEXT DEFAULT '',
      actorUserAgent TEXT DEFAULT '',
      actorFingerprint TEXT DEFAULT '',
      requestMethod TEXT DEFAULT '',
      requestPath TEXT DEFAULT '',
      requestBodyHash TEXT DEFAULT '',
      requestBodySize INTEGER DEFAULT 0,
      matchedPatterns TEXT DEFAULT '[]',
      featureScores TEXT DEFAULT '{}',
      mlScore REAL DEFAULT 0,
      heuristicScore REAL DEFAULT 0,
      ensembleScore REAL DEFAULT 0,
      mitigationAction TEXT DEFAULT 'none',
      mitigationDuration INTEGER DEFAULT 0,
      mitigationReason TEXT DEFAULT '',
      context TEXT DEFAULT '{}'
    );

    CREATE INDEX IF NOT EXISTS idx_threat_events_timestamp ON threat_events(timestamp);
    CREATE INDEX IF NOT EXISTS idx_threat_events_type ON threat_events(threatType);
    CREATE INDEX IF NOT EXISTS idx_threat_events_severity ON threat_events(severity);
    CREATE INDEX IF NOT EXISTS idx_threat_events_ip ON threat_events(actorIp);

    CREATE TABLE IF NOT EXISTS allowlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ip TEXT DEFAULT '',
      token TEXT DEFAULT '',
      reason TEXT DEFAULT '',
      createdAt TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_allowlist_ip ON allowlist(ip);
    CREATE INDEX IF NOT EXISTS idx_allowlist_token ON allowlist(token);
  `);
}

// Prepared statements cache
const stmts = {};
function getStmt(name, sql) {
  if (!stmts[name]) stmts[name] = getDb().prepare(sql);
  return stmts[name];
}

/** Insert a request log */
function insertLog(entry) {
  const stmt = getStmt('insertLog',
    `INSERT INTO logs (ip, token, path, method, userAgent, body, queryParams, headers, timestamp, correlationId, responseStatus, responseTime, bodySize, threatScore, fingerprint)
     VALUES (@ip, @token, @path, @method, @userAgent, @body, @queryParams, @headers, @timestamp, @correlationId, @responseStatus, @responseTime, @bodySize, @threatScore, @fingerprint)`
  );
  return stmt.run(entry);
}

/** Check if an IP or token is blocked */
function isBlocked(ip, token) {
  const stmt = getStmt('isBlocked',
    `SELECT id, ip, token, reason, severity, mitreTactic, strikes, status, expiresAt
     FROM blocklist
     WHERE status = 'active' AND (ip = @ip OR token = @token)
     LIMIT 1`
  );
  return stmt.get({ ip: ip || '', token: token || '' });
}

/** Check if an IP or token is allowlisted */
function isAllowlisted(ip, token) {
  const stmt = getStmt('isAllowlisted',
    `SELECT id FROM allowlist WHERE ip = @ip OR token = @token LIMIT 1`
  );
  return stmt.get({ ip: ip || '', token: token || '' });
}

/** Add to blocklist */
function addBlock(entry) {
  const stmt = getStmt('addBlock',
    `INSERT INTO blocklist (ip, token, reason, severity, detectedBy, mitreTactic, createdAt, expiresAt, strikes, status)
     VALUES (@ip, @token, @reason, @severity, @detectedBy, @mitreTactic, @createdAt, @expiresAt, @strikes, 'active')`
  );
  return stmt.run(entry);
}

/** Remove from blocklist */
function removeBlock(id) {
  const stmt = getStmt('removeBlock', `DELETE FROM blocklist WHERE id = @id`);
  return stmt.run({ id });
}

/** Get all active blocks */
function getActiveBlocks() {
  const stmt = getStmt('getActiveBlocks',
    `SELECT * FROM blocklist WHERE status = 'active' ORDER BY createdAt DESC`
  );
  return stmt.all();
}

/** Get all blocklist entries */
function getAllBlocks(limit = 1000, offset = 0) {
  return getDb().prepare(
    `SELECT * FROM blocklist ORDER BY createdAt DESC LIMIT ? OFFSET ?`
  ).all(limit, offset);
}

/** Update strikes for an existing block */
function updateStrikes(ip, token) {
  const stmt = getStmt('updateStrikes',
    `UPDATE blocklist SET strikes = strikes + 1 WHERE status = 'active' AND (ip = @ip OR token = @token)`
  );
  return stmt.run({ ip: ip || '', token: token || '' });
}

/** Insert a threat event */
function insertThreatEvent(event) {
  const stmt = getStmt('insertThreatEvent',
    `INSERT OR IGNORE INTO threat_events (eventId, timestamp, source, threatType, severity, confidence, mitreTactic,
      actorIp, actorToken, actorUserAgent, actorFingerprint,
      requestMethod, requestPath, requestBodyHash, requestBodySize,
      matchedPatterns, featureScores, mlScore, heuristicScore, ensembleScore,
      mitigationAction, mitigationDuration, mitigationReason, context)
     VALUES (@eventId, @timestamp, @source, @threatType, @severity, @confidence, @mitreTactic,
      @actorIp, @actorToken, @actorUserAgent, @actorFingerprint,
      @requestMethod, @requestPath, @requestBodyHash, @requestBodySize,
      @matchedPatterns, @featureScores, @mlScore, @heuristicScore, @ensembleScore,
      @mitigationAction, @mitigationDuration, @mitigationReason, @context)`
  );
  return stmt.run(event);
}

/** Get threat events with optional filters */
function getThreatEvents(filters = {}) {
  let sql = 'SELECT * FROM threat_events WHERE 1=1';
  const params = {};
  if (filters.severity) { sql += ' AND severity = @severity'; params.severity = filters.severity; }
  if (filters.threatType) { sql += ' AND threatType = @threatType'; params.threatType = filters.threatType; }
  if (filters.since) { sql += ' AND timestamp >= @since'; params.since = filters.since; }
  if (filters.ip) { sql += ' AND actorIp = @ip'; params.ip = filters.ip; }
  sql += ' ORDER BY timestamp DESC';
  if (filters.limit) { sql += ` LIMIT ${parseInt(filters.limit, 10)}`; }
  if (filters.offset) { sql += ` OFFSET ${parseInt(filters.offset, 10)}`; }
  return getDb().prepare(sql).all(params);
}

/** Get threat statistics */
function getThreatStats() {
  const d = getDb();
  const total = d.prepare('SELECT COUNT(*) as count FROM threat_events').get();
  const bySeverity = d.prepare('SELECT severity, COUNT(*) as count FROM threat_events GROUP BY severity').all();
  const byType = d.prepare('SELECT threatType, COUNT(*) as count FROM threat_events GROUP BY threatType ORDER BY count DESC').all();
  const last24h = d.prepare("SELECT COUNT(*) as count FROM threat_events WHERE timestamp >= datetime('now', '-24 hours')").get();
  const topActors = d.prepare('SELECT actorIp, COUNT(*) as count FROM threat_events GROUP BY actorIp ORDER BY count DESC LIMIT 10').all();
  const activeBlocks = d.prepare("SELECT COUNT(*) as count FROM blocklist WHERE status = 'active'").get();
  const totalLogs = d.prepare('SELECT COUNT(*) as count FROM logs').get();
  return {
    totalThreats: total.count,
    threatsLast24h: last24h.count,
    bySeverity: Object.fromEntries(bySeverity.map(r => [r.severity, r.count])),
    byType: Object.fromEntries(byType.map(r => [r.threatType, r.count])),
    topActors,
    activeBlocks: activeBlocks.count,
    totalRequestsLogged: totalLogs.count
  };
}

/** Get threat timeline (hourly buckets for last 24 hours) */
function getThreatTimeline() {
  return getDb().prepare(`
    SELECT strftime('%Y-%m-%dT%H:00:00Z', timestamp) as hour, COUNT(*) as count
    FROM threat_events
    WHERE timestamp >= datetime('now', '-24 hours')
    GROUP BY hour ORDER BY hour
  `).all();
}

/** Add to allowlist */
function addAllowlist(entry) {
  return getDb().prepare(
    `INSERT INTO allowlist (ip, token, reason, createdAt) VALUES (@ip, @token, @reason, @createdAt)`
  ).run(entry);
}

/** Expire old blocks */
function expireBlocks() {
  return getDb().prepare(
    `UPDATE blocklist SET status = 'expired'
     WHERE status = 'active' AND expiresAt != '' AND expiresAt <= datetime('now')`
  ).run();
}

/** Close the database */
function closeDb() {
  if (db) {
    try { db.close(); } catch (e) { /* ignore */ }
    db = null;
    Object.keys(stmts).forEach(k => delete stmts[k]);
    logger.info('Database closed');
  }
}

module.exports = {
  getDb, insertLog, isBlocked, isAllowlisted, addBlock, removeBlock,
  getActiveBlocks, getAllBlocks, updateStrikes, insertThreatEvent,
  getThreatEvents, getThreatStats, getThreatTimeline,
  addAllowlist, expireBlocks, closeDb
};
