#!/usr/bin/env bash
# ThrowMyFile – Cloudflare deployment script
# Domains: throwmyfile.com (frontend) · api.throwmyfile.com (backend)
# Requirements: Docker Desktop running with WSL2 integration enabled
#
# Required env vars (set these locally or export before running):
#   CLOUDFLARE_API_TOKEN  – Cloudflare API token with Workers:Edit permission
#   CLOUDFLARE_ACCOUNT_ID – 8846c8d2c9e982da3cee1c655ff8cb7c
set -e

: "${CLOUDFLARE_API_TOKEN:?CLOUDFLARE_API_TOKEN is not set}"
: "${CLOUDFLARE_ACCOUNT_ID:?CLOUDFLARE_ACCOUNT_ID is not set}"
export CLOUDFLARE_API_TOKEN
export CLOUDFLARE_ACCOUNT_ID
ZONE_ID="e8de9e5ba6e3addd84d6bf7122ed4c00"

echo "==> [1/3] Building React frontend..."
cd client
npm install --legacy-peer-deps --silent
npm run build
cd ..

echo "==> [2/3] Building container & deploying Worker..."
echo "    (Docker Desktop must be running)"
npx wrangler deploy

echo "==> [3/3] Attaching throwmyfile.com custom domain to Worker..."
RESULT=$(curl -s -X PUT "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/workers/domains" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"hostname\":\"throwmyfile.com\",\"service\":\"throwmyfile\",\"environment\":\"production\",\"zone_id\":\"$ZONE_ID\"}")
SUCCESS=$(echo "$RESULT" | python3 -c "import json,sys; print(json.load(sys.stdin)['success'])")
if [ "$SUCCESS" = "True" ]; then
  echo "    ✅ throwmyfile.com attached!"
else
  echo "    ⚠️  Could not auto-attach throwmyfile.com. See instructions below."
  echo ""
  echo "    ACTION REQUIRED:"
  echo "    1. Go to: https://dash.cloudflare.com/e8de9e5ba6e3addd84d6bf7122ed4c00/throwmyfile.com/dns/records"
  echo "    2. Delete the existing A and CNAME records for '@' and 'www'"
  echo "    3. Run: ./attach-domain.sh"
fi

echo ""
echo "✅ Deployment complete!"
echo "   Worker (dev) → https://throwmyfile.jamg.workers.dev"
echo "   API domain   → https://api.throwmyfile.com"
echo "   Main domain  → https://throwmyfile.com  (pending DNS step above)"
