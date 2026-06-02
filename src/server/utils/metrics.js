'use strict';

const promClient = require('prom-client');
promClient.collectDefaultMetrics({ prefix: 'mantis_gateway_' });

const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: 'mantis_http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [10, 50, 100, 200, 500, 1000]
});

const httpRequestsTotal = new promClient.Counter({
  name: 'mantis_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const threatsBlockedTotal = new promClient.Counter({
  name: 'mantis_threats_blocked_total',
  help: 'Total number of threats blocked inline by the gateway',
  labelNames: ['threat_type', 'severity']
});

const activeBlocksGauge = new promClient.Gauge({
  name: 'mantis_active_blocks',
  help: 'Number of currently active IP blocks'
});

async function getMetrics() {
  return await promClient.register.metrics();
}

module.exports = {
  promClient,
  httpRequestDurationMicroseconds,
  httpRequestsTotal,
  threatsBlockedTotal,
  activeBlocksGauge,
  getMetrics
};
