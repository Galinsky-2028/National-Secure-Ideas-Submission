#!/bin/sh
# Demo container entrypoint: migrate -> bootstrap admin (idempotent upsert)
# -> apply the SIG manifest -> background worker -> web. Refuses to start
# unless SIG_DEMO_MODE=true so this path cannot be mistaken for production.
set -eu
if [ "${SIG_DEMO_MODE:-}" != "true" ]; then
  echo "sig-demo-start: SIG_DEMO_MODE=true is required; this image is demonstration-only" >&2
  exit 64
fi
for var in DATABASE_URL PROTECTED_DATA_ENCRYPTION_KEY APP_BASE_URL BOOTSTRAP_ADMIN_EMAIL BOOTSTRAP_ADMIN_PASSWORD \
  BOOTSTRAP_ORGANIZATION_NAME BOOTSTRAP_ORGANIZATION_SLUG; do
  eval "value=\${$var:-}"
  if [ -z "$value" ]; then echo "sig-demo-start: $var is required" >&2; exit 64; fi
done
echo '{"event":"sig.demo.migrate"}'
npm run --silent db:migrate
echo '{"event":"sig.demo.bootstrap"}'
npm run --silent auth:bootstrap
echo '{"event":"sig.demo.manifest"}'
npm run --silent app:manifest -- --file /application/manifest.json \
  --organization "$BOOTSTRAP_ORGANIZATION_SLUG" --actor-email "$BOOTSTRAP_ADMIN_EMAIL"
echo '{"event":"sig.demo.worker_start"}'
NODE_OPTIONS="--max-old-space-size=160" node_modules/.bin/tsx scripts/run-worker.ts &
echo '{"event":"sig.demo.web_start"}'
export NODE_OPTIONS="--max-old-space-size=256"
exec node node_modules/next/dist/bin/next start -H 0.0.0.0 -p "${PORT:-3000}"
