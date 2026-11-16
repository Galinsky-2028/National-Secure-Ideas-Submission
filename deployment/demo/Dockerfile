# National Secure Ideas Submission: DEMONSTRATION container (Render free plan).
# NOT a production deployment and NOT production promotion evidence: it runs
# the release-candidate engine pinned in engine.lock.json, which the
# production preflight deliberately rejects until the SI-42 stable release.
# The engine is built from its public source at the locked tag; the build
# fails unless the checked-out commit equals engine.lock.json sourceCommit.
# No upstream source is committed to this repository.
FROM node:22-alpine AS engine
RUN apk add --no-cache git
ARG ENGINE_GIT_URL=https://github.com/Justice-For-All-Movement/secure-intake-case-workflow-engine.git
WORKDIR /src
COPY engine.lock.json /tmp/engine.lock.json
RUN set -eu; \
    TAG="v$(node -p "require('/tmp/engine.lock.json').engine.version")"; \
    COMMIT="$(node -p "require('/tmp/engine.lock.json').engine.sourceCommit")"; \
    git clone --quiet --depth 1 --branch "$TAG" "$ENGINE_GIT_URL" engine; \
    ACTUAL="$(git -C engine rev-parse HEAD)"; \
    if [ "$ACTUAL" != "$COMMIT" ]; then echo "engine commit mismatch: $ACTUAL != $COMMIT" >&2; exit 1; fi; \
    rm -rf engine/.git
WORKDIR /src/engine
# rc.9 publishes no package-lock.json, so (like the upstream Dockerfile) dependencies resolve at build time.
RUN npm install --no-audit --no-fund && NEXT_TELEMETRY_DISABLED=1 npm run build

FROM node:22-alpine
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
RUN addgroup -S sig && adduser -S sig -G sig
COPY --from=engine --chown=sig:sig /src/engine ./
COPY --chown=sig:sig application/manifest.json /application/manifest.json
COPY --chown=sig:sig deployment/demo/start.sh /usr/local/bin/sig-demo-start
RUN chmod 0755 /usr/local/bin/sig-demo-start && mkdir -p /app/.data/documents && chown -R sig:sig /app/.data
USER sig
EXPOSE 3000
CMD ["/usr/local/bin/sig-demo-start"]
