#!/usr/bin/env bash
# Signs and sends a stock update the way our supplier would.
# Usage: BASE=https://your-api.fly.dev ./send.sh [--tamper | --stale | --replay]
set -euo pipefail

BASE="${BASE:-http://localhost:3000}"
SECRET="${WEBHOOK_SECRET:-meridian-dev-secret}"
TS="$(date +%s%3N)"                 # unix time in milliseconds
NONCE="$(uuidgen)"
BODY='{"event":"stock.updated","sku":"NS-1042","stock":118,"warehouse":"ATL-02"}'

case "${1:-}" in
  --tamper) BODY='{"event":"stock.updated","sku":"NS-1042","stock":999,"warehouse":"ATL-02"}' ;;
  --stale)  TS="$(( $(date +%s%3N) - 360000 ))" ;;   # 6 minutes in the past
  --replay) NONCE="f3d1c2a4-replay-fixed-nonce" ;;
esac

# HMAC-SHA256 over "<ts>.<nonce>.<body>" — the same canonical
# signing base server.js recomputes. Hex, always hex.
SIG="$(printf '%s.%s.%s' "$TS" "$NONCE" "$BODY" \
  | openssl dgst -sha256 -hmac "$SECRET" -hex \
  | awk '{print $2}')"

curl -i -sS -X POST "$BASE/webhooks/inventory" \
  -H "Content-Type: application/json" \
  -H "X-NS-Timestamp: $TS" \
  -H "X-NS-Nonce: $NONCE" \
  -H "X-NS-Signature: sha256=$SIG" \
  -d "$BODY"
