import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const dockerfile = readFileSync(new URL("../deployment/demo/Dockerfile", import.meta.url), "utf8");
const start = readFileSync(new URL("../deployment/demo/start.sh", import.meta.url), "utf8");
const lock = JSON.parse(readFileSync(new URL("../engine.lock.json", import.meta.url), "utf8")).engine;

test("demo image builds the engine from the locked tag and verifies the locked commit", () => {
  assert.match(dockerfile, /COPY engine\.lock\.json/);
  assert.match(dockerfile, /engine\.version/);
  assert.match(dockerfile, /engine\.sourceCommit/);
  assert.match(dockerfile, /--branch "\$TAG"/);
  assert.match(dockerfile, /if \[ "\$ACTUAL" != "\$COMMIT" \]; then .* exit 1; fi/);
  assert.match(lock.sourceCommit, /^[0-9a-f]{40}$/);
  assert.doesNotMatch(dockerfile, /\b[0-9a-f]{40}\b/, "commit comes from engine.lock.json, never hard-coded");
});

test("demo image is labelled demonstration-only and never production evidence", () => {
  assert.match(dockerfile, /DEMONSTRATION container/);
  assert.match(dockerfile, /NOT a production deployment and NOT production promotion evidence/);
  assert.match(start, /SIG_DEMO_MODE:-\}" != "true"/);
  assert.match(start, /exit 64/);
});

test("demo entrypoint requires its configuration and contains no secrets", () => {
  for (const name of ["DATABASE_URL", "PROTECTED_DATA_ENCRYPTION_KEY", "APP_BASE_URL", "BOOTSTRAP_ADMIN_PASSWORD"])
    assert.ok(start.includes(name), name);
  assert.doesNotMatch(start + dockerfile, /postgres(?:ql)?:\/\/[^$\s"]+@/);
  assert.doesNotMatch(start + dockerfile, /\b[0-9a-f]{64}\b/);
  assert.match(start, /db:migrate[\s\S]*auth:bootstrap[\s\S]*app:manifest[\s\S]*run-worker[\s\S]*next start/);
});
