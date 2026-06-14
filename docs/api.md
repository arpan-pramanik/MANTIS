# API Reference

MANTIS is primarily a transparent proxy, meaning it doesn't expose many endpoints of its own. It intercepts and forwards traffic. However, there are a few internal administrative endpoints.

## Administrative Endpoints

All admin endpoints require the `Authorization: Bearer <Admin_Token>` header. The token is printed to stdout when the Node.js gateway starts.

### `GET /api/mantis/health`
Returns the health status of the gateway and its connection to the SQLite database.

**Response:**
```json
{
  "status": "healthy",
  "uptime": 3600,
  "database": "connected"
}
```

### `GET /api/mantis/metrics`
Prometheus-compatible metrics endpoint. This is scraped automatically by the included Prometheus container. Exposes:
- `mantis_requests_total`
- `mantis_threats_blocked_total`
- `mantis_proxy_latency_milliseconds`

### `POST /api/mantis/blocklist/clear`
Manually flushes the `blocklist.json` cache in memory. Useful if a legitimate IP gets accidentally hard-blocked and you need to clear the state immediately.

**Response:**
```json
{
  "status": "success",
  "message": "Blocklist cache cleared."
}
```
