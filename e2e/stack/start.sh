#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

cmp certs/test-ca.crt ../../android/app/src/e2e/res/raw/e2e_test_ca.pem || {
  echo "the test CA of the stack and of the e2e build type differ" >&2
  exit 1
}

mkdir -p certs/generated
openssl req -new -newkey rsa:2048 -nodes -keyout certs/generated/server.key \
  -subj "/O=Hologram E2E/CN=mediator.hologram.test" -out certs/generated/server.csr
openssl x509 -req -in certs/generated/server.csr -CA certs/test-ca.crt -CAkey certs/test-ca.key -CAcreateserial \
  -days 30 -sha256 \
  -extfile <(printf 'subjectAltName=DNS:mediator.hologram.test,DNS:s3.hologram.test\nextendedKeyUsage=serverAuth\n') \
  -out certs/generated/server.crt
chmod 644 certs/generated/server.key

[ -f .env ] || echo "MINIO_ROOT_PASSWORD=$(openssl rand -hex 16)" > .env

for attempt in 1 2 3; do
  docker compose pull --quiet && break
  [ "$attempt" -lt 3 ] || { echo "could not pull the stack images" >&2; exit 1; }
  sleep 10
done

docker compose up -d

# FIXME: remove when didcomm-mediator#73 is fixed (https://github.com/2060-io/didcomm-mediator/issues/73)
# did.json requested while the mediator provisions its store crashes it, so nothing may reach it before this line
for i in $(seq 1 90); do
  docker compose logs --no-color mediator 2>/dev/null | grep 'initialized OK' >/dev/null && break
  [ "$i" -lt 90 ] || { docker compose logs --no-color mediator | tail -40; echo "mediator did not initialize" >&2; exit 1; }
  sleep 2
done

CURL=(curl -sS --cacert certs/test-ca.crt --resolve mediator.hologram.test:443:127.0.0.1 --resolve s3.hologram.test:443:127.0.0.1)

websocket_status() {
  "${CURL[@]}" --http1.1 --max-time 3 -o /dev/null -w '%{http_code}' \
    -H 'Connection: Upgrade' -H 'Upgrade: websocket' -H 'Sec-WebSocket-Version: 13' \
    -H 'Sec-WebSocket-Key: ZTJlLXN0YWNrLWNoZWNrIQ==' https://mediator.hologram.test 2>/dev/null || true
}

did_document() {
  "${CURL[@]}" -f https://mediator.hologram.test/.well-known/did.json 2>/dev/null | grep '"did:web:mediator.hologram.test"' >/dev/null
}

minio_ready() {
  "${CURL[@]}" -f -o /dev/null https://s3.hologram.test/minio/health/ready 2>/dev/null
}

dns_ready() {
  docker compose exec -T dnsmasq nslookup mediator.hologram.test 127.0.0.1 2>/dev/null | grep '10\.0\.2\.2' >/dev/null
}

all_running() {
  [ "$(docker compose ps --status running --services | wc -l)" -eq "$(docker compose config --services | wc -l)" ]
}

for i in $(seq 1 90); do
  if did_document && minio_ready && [ "$(websocket_status)" = "101" ] && dns_ready && all_running; then
    echo "stack ready after ${i} tries"
    exit 0
  fi
  sleep 2
done

did_document || echo "the mediator does not serve its DID document" >&2
minio_ready || echo "MinIO is not ready" >&2
[ "$(websocket_status)" = "101" ] || echo "the mediator refuses the WebSocket upgrade" >&2
dns_ready || echo "dnsmasq does not resolve hologram.test" >&2
all_running || echo "a service is not running" >&2
docker compose ps -a
docker compose logs --no-color --tail=60
echo "stack did not become ready" >&2
exit 1
