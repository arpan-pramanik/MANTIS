/* MANTIS Threat Operations Center — Dashboard Logic */
'use strict';

const API_BASE = 'http://localhost:3000';
const WS_URL = 'ws://localhost:3001';
let ws = null;
let feedItems = [];

// Clock
function updateClock() {
  const now = new Date();
  document.getElementById('clock').textContent = now.toLocaleTimeString('en-US', { hour12: false });
}
setInterval(updateClock, 1000);
updateClock();

// WebSocket connection
function connectWebSocket() {
  try {
    ws = new WebSocket(WS_URL);
    ws.onopen = () => {
      document.getElementById('status-text').textContent = 'Live';
      document.querySelector('.pulse').classList.add('active');
    };
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'threat') {
          addThreatToFeed(msg.data);
          fetchStats();
        }
      } catch (e) {}
    };
    ws.onclose = () => {
      document.getElementById('status-text').textContent = 'Disconnected';
      document.querySelector('.pulse').classList.remove('active');
      setTimeout(connectWebSocket, 3000);
    };
    ws.onerror = () => {
      document.getElementById('status-text').textContent = 'Error';
    };
  } catch (e) {
    document.getElementById('status-text').textContent = 'Offline';
    setTimeout(connectWebSocket, 5000);
  }
}

// Fetch stats from API
async function fetchStats() {
  try {
    const res = await fetch(`${API_BASE}/admin/threats/stats`, {
      headers: { 'X-API-Key': getApiKey() }
    });
    if (!res.ok) {
      document.getElementById('status-text').textContent = 'API Error';
      return;
    }
    const stats = await res.json();
    renderStats(stats);
    document.getElementById('status-text').textContent = 'Connected';
    document.querySelector('.pulse').classList.add('active');
  } catch (e) {
    document.getElementById('status-text').textContent = 'API Offline';
    document.querySelector('.pulse').classList.remove('active');
  }
}

function getApiKey() {
  // Use the JWT secret as API key for dashboard access
  return 'mantis-ultra-secret-key-change-in-production-2024';
}

// Render stats
function renderStats(stats) {
  animateValue('total-threats', stats.totalThreats || 0);
  animateValue('active-blocks', stats.activeBlocks || 0);
  animateValue('threats-24h', stats.threatsLast24h || 0);
  animateValue('total-requests', stats.totalRequestsLogged || 0);

  renderSeverityBars(stats.bySeverity || {});
  renderTypeList(stats.byType || {});
  renderTopActors(stats.topActors || []);
}

function animateValue(id, target) {
  const el = document.getElementById(id);
  const current = parseInt(el.textContent) || 0;
  if (current === target) return;
  
  const diff = target - current;
  const steps = 20;
  const step = diff / steps;
  let frame = 0;
  
  const timer = setInterval(() => {
    frame++;
    const val = Math.round(current + step * frame);
    el.textContent = val.toLocaleString();
    if (frame >= steps) {
      el.textContent = target.toLocaleString();
      clearInterval(timer);
    }
  }, 30);
}

function renderSeverityBars(data) {
  const container = document.getElementById('severity-bars');
  const levels = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  const colors = { CRITICAL: 'critical', HIGH: 'high', MEDIUM: 'medium', LOW: 'low' };
  const total = Object.values(data).reduce((a, b) => a + b, 0) || 1;

  container.innerHTML = levels.map(level => {
    const count = data[level] || 0;
    const pct = Math.round((count / total) * 100);
    return `
      <div class="severity-bar-row">
        <span class="severity-label" style="color: var(--severity-${colors[level]})">${level}</span>
        <div class="severity-bar-track">
          <div class="severity-bar-fill ${colors[level]}" style="width: ${pct}%"></div>
        </div>
        <span class="severity-count">${count}</span>
      </div>
    `;
  }).join('');
}

function renderTypeList(data) {
  const container = document.getElementById('type-list');
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 8);
  
  if (entries.length === 0) {
    container.innerHTML = '<div class="empty-state">No attacks detected</div>';
    return;
  }

  container.innerHTML = entries.map(([type, count]) => `
    <div class="type-row">
      <span class="type-name">${type}</span>
      <span class="type-count">${count}</span>
    </div>
  `).join('');
}

function renderTopActors(actors) {
  const container = document.getElementById('actor-list');
  if (actors.length === 0) {
    container.innerHTML = '<div class="empty-state">No threat actors</div>';
    return;
  }

  container.innerHTML = actors.slice(0, 8).map(actor => `
    <div class="actor-row">
      <span class="actor-ip">${actor.actorIp || actor.ip || 'Unknown'}</span>
      <span class="actor-count">${actor.count} events</span>
    </div>
  `).join('');
}

// Fetch and render timeline
async function fetchTimeline() {
  try {
    const res = await fetch(`${API_BASE}/admin/threats/timeline`, {
      headers: { 'X-API-Key': getApiKey() }
    });
    if (!res.ok) return;
    const { data } = await res.json();
    renderTimeline(data || []);
  } catch (e) {}
}

function renderTimeline(data) {
  const container = document.getElementById('timeline');
  if (data.length === 0) {
    container.innerHTML = '<div class="empty-state" style="height:100%;display:flex;align-items:center;justify-content:center">No timeline data</div>';
    return;
  }

  const maxCount = Math.max(...data.map(d => d.count), 1);
  container.innerHTML = data.map(d => {
    const height = Math.max((d.count / maxCount) * 100, 3);
    return `<div class="timeline-bar" style="height: ${height}%" title="${d.hour}: ${d.count} threats"></div>`;
  }).join('');
}

// Add threat to live feed
function addThreatToFeed(threat) {
  feedItems.unshift(threat);
  if (feedItems.length > 50) feedItems = feedItems.slice(0, 50);
  renderFeed();
}

function renderFeed() {
  const container = document.getElementById('threat-feed');
  const countEl = document.getElementById('feed-count');
  countEl.textContent = feedItems.length;

  if (feedItems.length === 0) {
    container.innerHTML = '<div class="empty-state">Waiting for threats...</div>';
    return;
  }

  container.innerHTML = feedItems.map(t => {
    const severity = (t.severity || 'medium').toLowerCase();
    const time = t.timestamp ? new Date(t.timestamp).toLocaleTimeString('en-US', { hour12: false }) : '--:--:--';
    return `
      <div class="threat-item ${severity}">
        <span class="threat-time">${time}</span>
        <div class="threat-details">
          <div class="threat-type">${t.threatType || 'UNKNOWN'}</div>
          <div class="threat-meta">${t.actorIp || 'unknown'} → ${t.requestPath || '/'}</div>
        </div>
        <span class="threat-badge ${severity}">${(t.severity || 'MEDIUM').toUpperCase()}</span>
      </div>
    `;
  }).join('');
}

// Fetch initial threat feed
async function fetchRecentThreats() {
  try {
    const res = await fetch(`${API_BASE}/admin/threats?limit=20`, {
      headers: { 'X-API-Key': getApiKey() }
    });
    if (!res.ok) return;
    const { data } = await res.json();
    if (data && data.length > 0) {
      feedItems = data.map(t => ({
        ...t,
        threatType: t.threatType,
        severity: t.severity,
        actorIp: t.actorIp,
        requestPath: t.requestPath,
        timestamp: t.timestamp
      }));
      renderFeed();
    }
  } catch (e) {}
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  fetchStats();
  fetchTimeline();
  fetchRecentThreats();
  connectWebSocket();

  // Auto-refresh every 10 seconds
  setInterval(() => {
    fetchStats();
    fetchTimeline();
  }, 10000);
});
