#!/usr/bin/env bash
# Run this after deleting old DNS records from the Cloudflare dashboard
# Required env vars: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID
set -e

: "${CLOUDFLARE_API_TOKEN:?CLOUDFLARE_API_TOKEN is not set}"
: "${CLOUDFLARE_ACCOUNT_ID:?CLOUDFLARE_ACCOUNT_ID is not set}"
ZONE_ID="e8de9e5ba6e3addd84d6bf7122ed4c00"

echo "Attaching throwmyfile.com to the Worker..."
curl -s -X PUT "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/workers/domains" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"hostname\":\"throwmyfile.com\",\"service\":\"throwmyfile\",\"environment\":\"production\",\"zone_id\":\"$ZONE_ID\"}" \
  | python3 -c "
import json,sys
d=json.load(sys.stdin)
if d['success']:
    print('✅ throwmyfile.com is now routed to the Worker + Container!')
    print('   Live at: https://throwmyfile.com')
else:
    print('❌ Failed:', d['errors'])
"

echo ""
echo "Attaching www.throwmyfile.com to the Worker..."
curl -s -X PUT "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/workers/domains" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"hostname\":\"www.throwmyfile.com\",\"service\":\"throwmyfile\",\"environment\":\"production\",\"zone_id\":\"$ZONE_ID\"}" \
  | python3 -c "
import json,sys
d=json.load(sys.stdin)
if d['success']:
    print('✅ www.throwmyfile.com attached!')
else:
    print('⚠️  www:', d['errors'])
"
