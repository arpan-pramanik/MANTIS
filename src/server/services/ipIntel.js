'use strict';

/** IP Intelligence Service — CIDR matching, private IP detection, reputation scoring */

const PRIVATE_RANGES_V4 = [
  { cidr: '10.0.0.0/8', name: 'Class A Private' },
  { cidr: '172.16.0.0/12', name: 'Class B Private' },
  { cidr: '192.168.0.0/16', name: 'Class C Private' },
  { cidr: '127.0.0.0/8', name: 'Loopback' },
  { cidr: '169.254.0.0/16', name: 'Link-Local' },
  { cidr: '100.64.0.0/10', name: 'Shared Address' },
  { cidr: '0.0.0.0/8', name: 'Unspecified' }
];

/** Parse IPv4 to 32-bit integer */
function ipToInt(ip) {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  return parts.reduce((acc, oct) => {
    const n = parseInt(oct, 10);
    if (isNaN(n) || n < 0 || n > 255) return null;
    return (acc << 8) + n;
  }, 0) >>> 0;
}

/** Check if IPv4 matches a CIDR range */
function matchCIDR(ip, cidr) {
  const [range, bits] = cidr.split('/');
  const mask = bits ? (~(2 ** (32 - parseInt(bits, 10)) - 1)) >>> 0 : 0xFFFFFFFF;
  const ipNum = ipToInt(ip);
  const rangeNum = ipToInt(range);
  if (ipNum === null || rangeNum === null) return false;
  return (ipNum & mask) === (rangeNum & mask);
}

/** Check if IP is private */
function isPrivateIP(ip) {
  if (ip === '::1' || ip === '::ffff:127.0.0.1') return true;
  if (ip.startsWith('fc') || ip.startsWith('fd') || ip.startsWith('fe80')) return true;
  for (const range of PRIVATE_RANGES_V4) {
    if (matchCIDR(ip, range.cidr)) return true;
  }
  return false;
}

/** Extract subnet (/24 for IPv4) */
function getSubnet(ip) {
  if (ip.includes(':')) return ip.split(':').slice(0, 4).join(':') + '::/64';
  const parts = ip.split('.');
  if (parts.length !== 4) return ip;
  return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
}

/** Simple IP reputation scoring with decay */
const reputationCache = new Map();
const REPUTATION_DECAY = 0.95;
const REPUTATION_CLEANUP_INTERVAL = 300000; // 5 minutes

function updateReputation(ip, score) {
  const current = reputationCache.get(ip) || { score: 0, lastUpdate: Date.now() };
  const elapsed = (Date.now() - current.lastUpdate) / 60000; // minutes
  const decayed = current.score * Math.pow(REPUTATION_DECAY, elapsed);
  reputationCache.set(ip, { score: decayed + score, lastUpdate: Date.now() });
}

function getReputation(ip) {
  const entry = reputationCache.get(ip);
  if (!entry) return 0;
  const elapsed = (Date.now() - entry.lastUpdate) / 60000;
  return entry.score * Math.pow(REPUTATION_DECAY, elapsed);
}

// Periodic cleanup
setInterval(() => {
  const threshold = 0.1;
  for (const [ip, entry] of reputationCache.entries()) {
    const elapsed = (Date.now() - entry.lastUpdate) / 60000;
    if (entry.score * Math.pow(REPUTATION_DECAY, elapsed) < threshold) {
      reputationCache.delete(ip);
    }
  }
}, REPUTATION_CLEANUP_INTERVAL).unref();

module.exports = { matchCIDR, isPrivateIP, getSubnet, ipToInt, updateReputation, getReputation };
