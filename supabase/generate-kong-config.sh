#!/usr/bin/env bash
# Generate Kong config from template with actual API keys
set -euo pipefail

cd "$(dirname "$0")"

# Read keys from .env
ANON_KEY=$(grep '^ANON_KEY=' .env | cut -d= -f2)
SERVICE_ROLE_KEY=$(grep '^SERVICE_ROLE_KEY=' .env | cut -d= -f2)

sed \
  -e "s|SUPABASE_ANON_KEY|${ANON_KEY}|g" \
  -e "s|SUPABASE_SERVICE_ROLE_KEY|${SERVICE_ROLE_KEY}|g" \
  volumes/api/kong.yml.template > volumes/api/kong.yml

echo "Kong config generated with API keys."
