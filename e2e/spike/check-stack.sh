#!/usr/bin/env bash
set -uo pipefail
cd "$(dirname "$0")/../stack"
CURL=(curl -sS --cacert certs/test-ca.crt --resolve mediator.hologram.test:443:127.0.0.1 --resolve s3.hologram.test:443:127.0.0.1)
GS=../../android/app/google-services.json
PROJECT=hologram-51078
DEBUG_TOKEN=$(sed -n 's/^ANDROID_FIREBASE_DEBUG_TOKEN=//p' ../../.env.e2e-local)
API_KEY=$(jq -r '.client[0].api_key[0].current_key' "$GS")
RESULT=0

echo "## did.json"
"${CURL[@]}" -f https://mediator.hologram.test/.well-known/did.json | jq -c '{id, service: [.service[]? | {type, serviceEndpoint}]}' || RESULT=1

echo "## WebSocket upgrade through Caddy (expect 101)"
"${CURL[@]}" --http1.1 --max-time 4 -o /dev/null -w '%{http_code}\n' \
  -H 'Connection: Upgrade' -H 'Upgrade: websocket' -H 'Sec-WebSocket-Version: 13' -H 'Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==' \
  https://mediator.hologram.test/

for PKG in io.twentysixty.mobileagent.dev io.twentysixty.mobileagent.st; do
  APP_ID=$(jq -r --arg p "$PKG" '.client[] | select(.client_info.android_client_info.package_name == $p) | .client_info.mobilesdk_app_id' "$GS")
  echo "## App Check debug exchange for $PKG"
  RESP=$(curl -sS -X POST -H 'Content-Type: application/json' \
    "https://firebaseappcheck.googleapis.com/v1/projects/$PROJECT/apps/$APP_ID:exchangeDebugToken?key=$API_KEY" \
    -d "{\"debug_token\":\"$DEBUG_TOKEN\"}")
  TOKEN=$(echo "$RESP" | jq -r '.token // empty')
  if [ -z "$TOKEN" ]; then echo "exchange failed: $RESP"; RESULT=1; continue; fi
  echo "token ok, ttl $(echo "$RESP" | jq -r .ttl), length ${#TOKEN}"

  echo "## hologram-server /auth with the real token (R3)"
  docker compose exec -T hologram-server wget -qO- --post-data='' "http://localhost:3000/auth?token=$TOKEN" || { echo "auth failed"; RESULT=1; }
  echo
  echo "## hologram-server /auth with a forged token (expect 403)"
  docker compose exec -T hologram-server wget -qSO- --post-data='' 'http://localhost:3000/auth?token=forged' 2>&1 | grep -E 'HTTP/|Forbidden' | head -2
  echo "## MinIO STS through Caddy with the real token"
  "${CURL[@]}" -X POST "https://s3.hologram.test/?Action=AssumeRoleWithCustomToken&Version=2011-06-15&DurationSeconds=900&RoleArn=arn:minio:iam:::role/idmp-mobile-app&Token=$TOKEN" \
    | sed -E 's#<(AccessKeyId|SecretAccessKey|SessionToken)>[^<]*#<\1>…#g' | head -c 500
  echo
done

echo "## anonymous download policy"
"${CURL[@]}" -o /dev/null -w '%{http_code} (404 means anonymous read is allowed, 403 means denied)\n' https://s3.hologram.test/hologram-media-sharing/missing

echo "## dnsmasq"
dig +short @"${DNS_BIND_IP:-127.0.0.1}" mediator.hologram.test
dig +short @"${DNS_BIND_IP:-127.0.0.1}" firebaseappcheck.googleapis.com | head -1

docker compose logs --no-color hologram-server | tail -15
exit $RESULT
