#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

cmp certs/test-ca.crt ../../android/app/src/e2e/res/raw/e2e_test_ca.pem || {
  echo "the test CA of the stack and of the e2e build type differ" >&2
  exit 1
}

mkdir -p certs/generated
openssl req -new -newkey rsa:2048 -nodes -keyout certs/generated/server.key \
  -subj "/O=Hologram E2E/CN=mediator.hologram.test" -out certs/generated/server.csr 2>/dev/null
openssl x509 -req -in certs/generated/server.csr -CA certs/test-ca.crt -CAkey certs/test-ca.key -CAcreateserial \
  -days 30 -sha256 \
  -extfile <(printf 'subjectAltName=DNS:mediator.hologram.test,DNS:s3.hologram.test\nextendedKeyUsage=serverAuth\n') \
  -out certs/generated/server.crt 2>/dev/null
chmod 644 certs/generated/server.key

[ -f .env ] || echo "MINIO_ROOT_PASSWORD=$(openssl rand -hex 16)" > .env

docker compose up -d

# did.json requested while the mediator provisions its store crashes it, so nothing may reach it before this line
for i in $(seq 1 90); do
  docker compose logs --no-color mediator 2>/dev/null | grep -q 'initialized OK' && break
  [ "$i" -lt 90 ] || { docker compose logs --no-color mediator | tail -40; echo "mediator did not initialize" >&2; exit 1; }
  sleep 2
done

CURL=(curl -sS --cacert certs/test-ca.crt --resolve mediator.hologram.test:443:127.0.0.1 --resolve s3.hologram.test:443:127.0.0.1)

websocket_status() {
  "${CURL[@]}" --http1.1 --max-time 3 -o /dev/null -w '%{http_code}' \
    -H 'Connection: Upgrade' -H 'Upgrade: websocket' -H 'Sec-WebSocket-Version: 13' \
    -H 'Sec-WebSocket-Key: ZTJlLXN0YWNrLWNoZWNrIQ==' https://mediator.hologram.test 2>/dev/null || true
}

for i in $(seq 1 90); do
  if "${CURL[@]}" -f -o /dev/null https://mediator.hologram.test/.well-known/did.json 2>/dev/null \
    && "${CURL[@]}" -f -o /dev/null https://s3.hologram.test/minio/health/ready 2>/dev/null \
    && [ "$(websocket_status)" = "101" ]; then
    echo "stack ready after ${i} tries"
    exit 0
  fi
  sleep 2
done

docker compose ps
docker compose logs --no-color --tail=60
echo "stack did not become ready" >&2
exit 1
