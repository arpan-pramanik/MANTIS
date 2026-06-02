#!/usr/bin/env bash
# MANTIS Attack Simulation Test Suite
# Generates realistic attack traffic against the MANTIS API gateway

set -uo pipefail

API_URL="${MANTIS_API_URL:-http://localhost:3000}"
ADMIN_TOKEN="${MANTIS_ADMIN_TOKEN:-}"
DELAY="${TEST_DELAY:-0.1}"
TOTAL_PASSED=0
TOTAL_FAILED=0
TOTAL_TESTS=0

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log_pass() { ((TOTAL_PASSED++)); ((TOTAL_TESTS++)); echo -e "${GREEN}  [PASS]${NC} $1"; }
log_fail() { ((TOTAL_FAILED++)); ((TOTAL_TESTS++)); echo -e "${RED}  [FAIL]${NC} $1"; }
log_info() { echo -e "${CYAN}  [INFO]${NC} $1"; }
log_section() { echo -e "\n${YELLOW}━━━ $1 ━━━${NC}"; }

# Helper: Make a request and check HTTP status
check_status() {
  local desc="$1" url="$2" expected="$3"
  shift 3
  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" "$@" "$url" 2>/dev/null || echo "000")
  if [[ "$status" == "$expected" ]]; then
    log_pass "$desc (HTTP $status)"
  else
    log_fail "$desc (expected $expected, got $status)"
  fi
  sleep "$DELAY"
}

# Helper: Check response contains a string
check_contains() {
  local desc="$1" url="$2" expected="$3"
  shift 3
  local body
  body=$(curl -s "$@" "$url" 2>/dev/null || echo "")
  if echo "$body" | grep -qi "$expected"; then
    log_pass "$desc"
  else
    log_fail "$desc (missing: $expected)"
  fi
  sleep "$DELAY"
}

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║   MANTIS Attack Simulation Test Suite                       ║"
echo "║   Enterprise API Threat Detection Validation                ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "Target: $API_URL"
echo ""

# ─────────────────────────────────────────────────────────────────
# Phase 1: Health & Readiness
# ─────────────────────────────────────────────────────────────────
log_section "Phase 1: Health & Readiness Probes"

check_status "Health endpoint responds" "$API_URL/health" "200"
check_contains "Health returns status ok" "$API_URL/health" "ok"
check_status "Readiness probe responds" "$API_URL/health/ready" "200"
check_contains "Readiness includes memory" "$API_URL/health/ready" "memory"
check_status "Liveness probe responds" "$API_URL/health/live" "200"

# ─────────────────────────────────────────────────────────────────
# Phase 2: Protected API Endpoints
# ─────────────────────────────────────────────────────────────────
log_section "Phase 2: Protected API Endpoints"

check_status "GET /api/v1/users" "$API_URL/api/v1/users" "200"
check_status "GET /api/v1/users/1" "$API_URL/api/v1/users/1" "200"
check_status "GET /api/v1/users/999 (not found)" "$API_URL/api/v1/users/999" "404"
check_status "POST /api/v1/users (valid)" "$API_URL/api/v1/users" "201" \
  -H "Content-Type: application/json" -d '{"name":"Test","email":"test@test.com"}'
check_status "GET /api/v1/products" "$API_URL/api/v1/products" "200"
check_status "POST /api/v1/auth/login" "$API_URL/api/v1/auth/login" "200" \
  -H "Content-Type: application/json" -d '{"username":"admin","password":"pass123"}'
check_status "GET /api/v1/data/export" "$API_URL/api/v1/data/export" "200"
check_status "404 on unknown endpoint" "$API_URL/api/v1/nonexistent" "404"

# ─────────────────────────────────────────────────────────────────
# Phase 3: SQL Injection Attacks
# ─────────────────────────────────────────────────────────────────
log_section "Phase 3: SQL Injection Detection"

check_status "SQLi in query param" "$API_URL/api/v1/users?id=1'+OR+1=1--" "403"
check_status "SQLi UNION attack" "$API_URL/api/v1/users?id=1+UNION+SELECT+*+FROM+users--" "403"
check_status "SQLi in POST body" "$API_URL/api/v1/auth/login" "403" \
  -H "Content-Type: application/json" -d '{"username":"admin'\'' OR 1=1--","password":"test"}'
check_status "SQLi DROP TABLE" "$API_URL/api/v1/users?q=;DROP+TABLE+users;--" "403"
check_status "SQLi sleep injection" "$API_URL/api/v1/users?id=1+AND+SLEEP(5)" "403"
check_status "SQLi hex encoding" "$API_URL/api/v1/users?id=0x31+OR+0x31=0x31" "403"

# ─────────────────────────────────────────────────────────────────
# Phase 4: XSS Attacks
# ─────────────────────────────────────────────────────────────────
log_section "Phase 4: Cross-Site Scripting Detection"

check_status "XSS script tag" "$API_URL/api/v1/users?name=<script>alert(1)</script>" "403"
check_status "XSS img onerror" "$API_URL/api/v1/users?q=<img+src=x+onerror=alert(1)>" "403"
check_status "XSS event handler" "$API_URL/api/v1/users?q=<body+onload=alert(1)>" "403"
check_status "XSS svg onload" "$API_URL/api/v1/users?q=<svg+onload=alert(1)>" "403"
check_status "XSS javascript: URI" "$API_URL/api/v1/users?url=javascript:alert(1)" "403"

# ─────────────────────────────────────────────────────────────────
# Phase 5: Path Traversal Attacks
# ─────────────────────────────────────────────────────────────────
log_section "Phase 5: Path Traversal Detection"

check_status "Basic path traversal" "$API_URL/../../etc/passwd" "403"
check_status "Encoded traversal" "$API_URL/..%2F..%2Fetc%2Fpasswd" "403"
check_status "Windows traversal" "$API_URL/....\\\\....\\\\windows\\\\system32" "403"
check_status "Null byte traversal" "$API_URL/api/v1/users?file=../../../etc/passwd%00" "403"

# ─────────────────────────────────────────────────────────────────
# Phase 6: Command Injection
# ─────────────────────────────────────────────────────────────────
log_section "Phase 6: Command Injection Detection"

check_status "Pipe command" "$API_URL/api/v1/users?cmd=|cat+/etc/passwd" "403"
check_status "Semicolon command" "$API_URL/api/v1/users?cmd=;ls+-la" "403"
check_status "Backtick command" "$API_URL/api/v1/users?cmd=\`id\`" "403"
check_status "Dollar command" "$API_URL/api/v1/users?cmd=\$(whoami)" "403"

# ─────────────────────────────────────────────────────────────────
# Phase 7: SSRF Attacks
# ─────────────────────────────────────────────────────────────────
log_section "Phase 7: SSRF Detection"

check_status "SSRF localhost" "$API_URL/api/v1/data/export?url=http://localhost/admin" "403"
check_status "SSRF 127.0.0.1" "$API_URL/api/v1/data/export?url=http://127.0.0.1:8080" "403"
check_status "SSRF metadata" "$API_URL/api/v1/data/export?url=http://169.254.169.254/latest/meta-data" "403"
check_status "SSRF internal IP" "$API_URL/api/v1/data/export?url=http://10.0.0.1/admin" "403"

# ─────────────────────────────────────────────────────────────────
# Phase 8: Reconnaissance Detection (Scanner UAs)
# ─────────────────────────────────────────────────────────────────
log_section "Phase 8: Scanner & Reconnaissance Detection"

check_status "Nikto scanner UA" "$API_URL/api/v1/users" "200" \
  -H "User-Agent: Nikto/2.1.6"
check_status "SQLMap scanner UA" "$API_URL/api/v1/users" "200" \
  -H "User-Agent: sqlmap/1.4.7"
check_status "Nmap scanner UA" "$API_URL/api/v1/users" "200" \
  -H "User-Agent: Mozilla/5.0 Nmap Scripting Engine"
log_info "Scanner UAs logged for engine detection"

# ─────────────────────────────────────────────────────────────────
# Phase 9: Admin API (Auth Required)
# ─────────────────────────────────────────────────────────────────
log_section "Phase 9: Admin API Authentication"

check_status "Admin without auth" "$API_URL/admin/blocklist" "401"
check_status "Admin with bad token" "$API_URL/admin/blocklist" "401" \
  -H "Authorization: Bearer invalid.token.here"
check_status "Admin with API key" "$API_URL/admin/threats/stats" "200" \
  -H "X-API-Key: CHANGE_THIS_IN_PRODUCTION_mantis_jwt_secret_2024"
check_status "Admin blocklist with key" "$API_URL/admin/blocklist" "200" \
  -H "X-API-Key: CHANGE_THIS_IN_PRODUCTION_mantis_jwt_secret_2024"

# ─────────────────────────────────────────────────────────────────
# Phase 10: Burst Traffic (Rate Limit)
# ─────────────────────────────────────────────────────────────────
log_section "Phase 10: Rate Limiting"

log_info "Sending 20 rapid requests..."
RATE_LIMITED=0
for i in $(seq 1 20); do
  status=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/v1/users" 2>/dev/null || echo "000")
  if [[ "$status" == "429" ]]; then
    RATE_LIMITED=1
    break
  fi
done
if [[ $RATE_LIMITED -eq 1 ]]; then
  log_pass "Rate limiter triggered after rapid requests"
else
  log_info "Rate limiter not triggered (may need higher volume)"
fi
((TOTAL_TESTS++))
sleep 2

# ─────────────────────────────────────────────────────────────────
# Phase 11: Correlation IDs & Headers
# ─────────────────────────────────────────────────────────────────
log_section "Phase 11: Security Headers & Correlation"

HEADERS=$(curl -s -I "$API_URL/health" 2>/dev/null)
if echo "$HEADERS" | grep -qi "x-correlation-id"; then
  log_pass "Correlation ID header present"
else
  log_fail "Correlation ID header missing"
fi

if echo "$HEADERS" | grep -qi "x-content-type-options"; then
  log_pass "X-Content-Type-Options header present"
else
  log_fail "X-Content-Type-Options header missing"
fi

if echo "$HEADERS" | grep -qi "x-frame-options\|content-security-policy"; then
  log_pass "Frame protection header present"
else
  log_info "Frame protection header not found (may use CSP)"
fi

# ─────────────────────────────────────────────────────────────────
# Results
# ─────────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║   TEST RESULTS                                              ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo -e "║   Total Tests: ${TOTAL_TESTS}                                         ║"
echo -e "║   ${GREEN}Passed: ${TOTAL_PASSED}${NC}                                            ║"
echo -e "║   ${RED}Failed: ${TOTAL_FAILED}${NC}                                            ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

if [[ $TOTAL_FAILED -eq 0 ]]; then
  echo -e "${GREEN}All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}Some tests failed. Review output above.${NC}"
  exit 1
fi
