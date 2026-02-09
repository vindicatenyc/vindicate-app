#!/usr/bin/env bash
# Supabase Self-Hosted Health Check
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

PASS=0
FAIL=0

check() {
  local name="$1"
  local url="$2"
  local expected="${3:-200}"

  status=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "$url" 2>/dev/null || echo "000")
  if [ "$status" = "$expected" ]; then
    echo -e "  ${GREEN}✓${NC} $name (HTTP $status)"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}✗${NC} $name (HTTP $status, expected $expected)"
    FAIL=$((FAIL + 1))
  fi
}

check_pg() {
  if docker compose exec -T db pg_isready -U postgres -h localhost >/dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} PostgreSQL is ready"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}✗${NC} PostgreSQL is not ready"
    FAIL=$((FAIL + 1))
  fi
}

echo ""
echo "=== Supabase Self-Hosted Health Check ==="
echo ""

echo "Services:"
check_pg
check "GoTrue Auth" "http://localhost:9999/health"
check "Kong Gateway" "http://localhost:8000" "404"
check "PostgREST" "http://localhost:3001/" "200"
check "Postgres Meta" "http://localhost:8081/health" "200"
check "Studio" "http://localhost:8082" "200"
check "Storage" "http://localhost:5000/status" "200"

echo ""
echo "API Gateway Routes:"
check "Auth via Kong" "http://localhost:8000/auth/v1/health"
check "REST via Kong" "http://localhost:8000/rest/v1/" "401"

echo ""
echo "---"
echo -e "Results: ${GREEN}$PASS passed${NC}, ${RED}$FAIL failed${NC}"
echo ""

if [ "$FAIL" -gt 0 ]; then
  echo -e "${YELLOW}Some services are unhealthy. Check docker compose logs for details.${NC}"
  exit 1
else
  echo -e "${GREEN}All services are healthy!${NC}"
  exit 0
fi
