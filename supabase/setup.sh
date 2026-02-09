#!/usr/bin/env bash
# Full Supabase setup: start services, set passwords, run migrations, seed data
set -euo pipefail

cd "$(dirname "$0")"

# Read key env vars
POSTGRES_PASSWORD=$(grep '^POSTGRES_PASSWORD=' .env | cut -d= -f2)

echo "=== Generating Kong config ==="
bash generate-kong-config.sh

echo ""
echo "=== Starting PostgreSQL ==="
docker compose up -d db
echo "Waiting for PostgreSQL..."
sleep 5
until docker compose exec -T db pg_isready -U postgres -h localhost >/dev/null 2>&1; do
  sleep 2
done
echo "PostgreSQL is ready."

echo ""
echo "=== Setting role passwords ==="
docker compose exec -T db psql -U supabase_admin -d postgres <<SQL
ALTER ROLE supabase_auth_admin WITH PASSWORD '${POSTGRES_PASSWORD}';
ALTER ROLE supabase_storage_admin WITH PASSWORD '${POSTGRES_PASSWORD}';
ALTER ROLE authenticator WITH PASSWORD '${POSTGRES_PASSWORD}';
ALTER ROLE supabase_admin WITH PASSWORD '${POSTGRES_PASSWORD}';
ALTER ROLE postgres WITH PASSWORD '${POSTGRES_PASSWORD}';
DO \$\$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase') THEN
    EXECUTE format('ALTER ROLE supabase WITH PASSWORD %L', '${POSTGRES_PASSWORD}');
  ELSE
    EXECUTE format('CREATE ROLE supabase WITH LOGIN PASSWORD %L SUPERUSER', '${POSTGRES_PASSWORD}');
  END IF;
END
\$\$;
SQL

echo ""
echo "=== Starting remaining services ==="
docker compose up -d
echo "Waiting for auth to become healthy..."
for i in $(seq 1 30); do
  if docker compose exec -T auth wget --no-verbose --tries=1 --spider http://localhost:9999/health 2>/dev/null; then
    break
  fi
  sleep 3
done
echo "Auth is healthy."

echo ""
echo "=== Running migrations ==="
for f in migrations/*.sql; do
  echo "  Running $(basename "$f")..."
  docker compose exec -T db psql -U supabase_admin -d postgres -f "/dev/stdin" < "$f"
done

echo ""
echo "=== Running seed ==="
docker compose exec -T db psql -U supabase_admin -d postgres -f "/dev/stdin" < seed.sql

echo ""
echo "=== Setup complete ==="
docker compose ps
echo ""
echo "Studio:     http://localhost:8082"
echo "API:        http://localhost:8000"
echo "PostgreSQL: localhost:5432"
echo "Demo login: demo@vindicate.nyc / vindicate-demo-2026"
