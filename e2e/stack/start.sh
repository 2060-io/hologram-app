#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

mkdir -p certs/generated
openssl req -new -newkey rsa:2048 -nodes -keyout certs/generated/server.key \
  -subj "/O=Hologram E2E/CN=mediator.hologram.test" -out certs/generated/server.csr 2>/dev/null
openssl x509 -req -in certs/generated/server.csr -CA certs/test-ca.crt -CAkey certs/test-ca.key -CAcreateserial \
  -days 30 -sha256 \
  -extfile <(printf 'subjectAltName=DNS:mediator.hologram.test,DNS:s3.hologram.test\nextendedKeyUsage=serverAuth\n') \
  -out certs/generated/server.crt 2>/dev/null
chmod 644 certs/generated/server.key

docker compose up -d --build

CURL=(curl -sS --cacert certs/test-ca.crt --resolve mediator.hologram.test:443:127.0.0.1 --resolve s3.hologram.test:443:127.0.0.1)

for i in $(seq 1 90); do
  if "${CURL[@]}" -f -o /dev/null https://mediator.hologram.test/.well-known/did.json 2>/dev/null \
    && "${CURL[@]}" -f -o /dev/null https://s3.hologram.test/minio/health/ready 2>/dev/null; then
    echo "stack ready after ${i} tries"
    exit 0
  fi
  sleep 2
done

docker compose ps
docker compose logs --no-color --tail=60
echo "stack did not become ready" >&2
exit 1
