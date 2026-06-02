'use strict';

const fs = require('fs');
const path = require('path');
const { ThreatDetectedError } = require('../utils/errors');
const { logSecurityEvent } = require('../utils/logger');
const { threatsBlockedTotal } = require('../utils/metrics');

// Load and compile signatures once at startup
const sigPath = path.join(__dirname, '..', '..', '..', 'config', 'signatures.json');
let signatures = { patterns: {}, risk_weights: {}, mitre_mapping: {} };
let compiledPatterns = {};

try {
  signatures = JSON.parse(fs.readFileSync(sigPath, 'utf8'));
  for (const [category, patterns] of Object.entries(signatures.patterns)) {
    compiledPatterns[category] = patterns.map(p => {
      try { return new RegExp(p, 'i'); }
      catch (e) { return null; }
    }).filter(Boolean);
  }
} catch (err) {
  console.error('Failed to load signatures:', err.message);
}

/** Recursively scan an object/string for malicious patterns */
function scanValue(value, results, depth = 0) {
  if (depth > 10) return; // prevent deep recursion
  if (typeof value === 'string') {
    for (const [category, regexes] of Object.entries(compiledPatterns)) {
      for (const regex of regexes) {
        if (regex.test(value)) {
          if (!results[category]) results[category] = [];
          results[category].push(regex.source.slice(0, 60));
        }
      }
    }
  } else if (typeof value === 'object' && value !== null) {
    for (const v of Object.values(value)) {
      scanValue(v, results, depth + 1);
    }
  }
}

/** Calculate threat score from matched patterns */
function calculateThreatScore(results) {
  let score = 0;
  for (const [category, matches] of Object.entries(results)) {
    const weight = signatures.risk_weights[category] || 1;
    score += matches.length * weight;
  }
  return Math.min(score, 100);
}

/** Deep request inspection middleware */
function inputValidator(req, res, next) {
  const results = {};

  // Scan URL path
  scanValue(decodeURIComponent(req.path), results);

  // Scan query parameters
  if (req.query) {
    for (const v of Object.values(req.query)) {
      scanValue(typeof v === 'string' ? decodeURIComponent(v) : v, results);
    }
  }

  // Scan request body
  if (req.body) {
    scanValue(req.body, results);
  }

  // Scan select headers
  const headersToScan = ['referer', 'origin', 'x-forwarded-host', 'x-original-url'];
  for (const h of headersToScan) {
    if (req.headers[h]) scanValue(req.headers[h], results);
  }

  // Check for multi-layer encoding evasion
  const rawUrl = req.originalUrl || req.url;
  try {
    const doubleDecoded = decodeURIComponent(decodeURIComponent(rawUrl));
    if (doubleDecoded !== decodeURIComponent(rawUrl)) {
      scanValue(doubleDecoded, results);
      if (Object.keys(results).length > 0) {
        results['evasion'] = results['evasion'] || [];
        results['evasion'].push('double_encoding_detected');
      }
    }
  } catch (e) { /* malformed URI */ }

  const matchedPatterns = Object.entries(results).map(([cat, matches]) => ({
    category: cat,
    matches: [...new Set(matches)].slice(0, 5),
    count: matches.length
  }));

  const threatScore = calculateThreatScore(results);
  req.threatScore = threatScore;
  req.matchedPatterns = matchedPatterns;

  // Block high-threat requests immediately
  if (threatScore >= 5) {
    const categories = Object.keys(results);
    const primaryThreat = categories[0] || 'UNKNOWN';
    const mitreTactic = signatures.mitre_mapping[primaryThreat] || '';

    logSecurityEvent({
      type: 'THREAT_BLOCKED_INLINE',
      ip: req.clientIp || req.ip,
      path: req.path,
      method: req.method,
      threatScore,
      categories,
      matchedPatterns: matchedPatterns.slice(0, 3),
      mitreTactic,
      severity: threatScore > 20 ? 'CRITICAL' : 'HIGH'
    });

    threatsBlockedTotal.inc({ threat_type: primaryThreat, severity: threatScore > 20 ? 'CRITICAL' : 'HIGH' });

    return next(new ThreatDetectedError(
      primaryThreat.toUpperCase().replace(/_/g, '_'),
      threatScore,
      matchedPatterns
    ));
  }

  // Warn on medium-threat requests
  if (threatScore > 0 && threatScore < 5) {
    logSecurityEvent({
      type: 'THREAT_WARNING',
      ip: req.clientIp || req.ip,
      path: req.path,
      threatScore,
      categories: Object.keys(results),
      severity: 'MEDIUM'
    });
  }

  next();
}

module.exports = { inputValidator, scanValue, calculateThreatScore };
