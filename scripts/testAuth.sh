#!/usr/bin/env bash
set -euo pipefail

BASE_URL="http://localhost:3001"
COOKIE_JAR="/tmp/nextauth-test-cookies"

# Fetch CSRF token
csrf=$(curl -s -c "$COOKIE_JAR" "$BASE_URL/api/auth/csrf" | sed -n 's/.*"csrfToken":"\([^"]*\)".*/\1/p')
if [ -z "$csrf" ]; then
  echo "Failed to get csrf token"
  exit 1
fi

echo "CSRF: $csrf"

# Sign in with seeded user
curl -s -b "$COOKIE_JAR" -c "$COOKIE_JAR" -X POST "$BASE_URL/api/auth/callback/credentials" \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode "csrfToken=$csrf" \
  --data-urlencode "username=user" \
  --data-urlencode "password=user123" \
  -D - -L -o /dev/null

# Fetch session
curl -s -b "$COOKIE_JAR" "$BASE_URL/api/auth/session" | jq -C '.' || true

# Cleanup
rm -f "$COOKIE_JAR"
