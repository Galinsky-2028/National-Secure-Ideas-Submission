# Free-plan demonstration deployment

**This is a demonstration, not production.** It does not satisfy, replace or feed the production promotion, acceptance or go-live gates. Those still require the Secure Intake SI-42 stable release, an immutable published image digest, approved storage, malware scanning, identity/MFA and the other controls in `docs/security-deployment-acceptance.md`. The prerelease production guard is unchanged.

## Why this shape

- **No pullable engine image.** GHCR refuses anonymous pull tokens for `ghcr.io/neophilism/secure-intake-case-workflow-engine` and for `justice-for-all-movement`, observed 2026-11-16, so a Render image service cannot pull it. `deployment/demo/Dockerfile` instead builds the engine from its **public source** at the tag named by `engine.lock.json` and fails unless the checked-out commit equals `sourceCommit`. Nothing upstream is modified or committed here.
- **Single free web service.** The Render free plan has no background workers, and the 512 MB instance fits the web and worker together (about 420 MB measured locally). `deployment/demo/start.sh` runs migrations, the idempotent admin bootstrap, the SIG manifest, the background worker and then the web server. It refuses to start without `SIG_DEMO_MODE=true`.
- **Neon instead of Render Postgres.** The free Render database expires and the production blueprint's database is paid; a free Neon project is used.

## Configuration (Render env only, never committed)

`SIG_DEMO_MODE=true`, `DATABASE_URL` (Neon), `PROTECTED_DATA_ENCRYPTION_KEY` (64 hex, generated for the demo), `WEBHOOK_ENCRYPTION_KEY`, `APP_BASE_URL`, `AUTH_TRUST_PROXY_HEADERS=true`, distinct `__Host-` staff/participant cookie names, `BOOTSTRAP_ADMIN_EMAIL` (synthetic), `BOOTSTRAP_ADMIN_PASSWORD`, `BOOTSTRAP_ORGANIZATION_NAME` (labelled DEMONSTRATION), `BOOTSTRAP_ORGANIZATION_SLUG=secure-innovation-gateway`.

## Known demo limitations

- **Uploads are not durable or scanned.** Documents use the engine's local driver; the instance disk is erased on restart and redeploy. Without a malware scanner, uploads stay quarantined, which is the engine's fail-closed default.
- **Dependencies are not locked.** rc.9 publishes no `package-lock.json`, so engine dependencies resolve at image build time, as in the upstream Dockerfile.
- **Synthetic data only.** Never submit real ideas, identities or classified information. The public intake already requires an unclassified-information attestation.
- **No identity-reveal roles.** Privacy-officer roles are not assigned, so no protected identity can be revealed.
