# ── Build stage ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# npm ci (not npm install) so the lockfile is honoured and builds reproduce.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build && npm prune --omit=dev

# ── Runtime stage ────────────────────────────────────────────────────────
FROM node:22-alpine

# `--init` equivalent: reap zombies and forward SIGTERM so shutdown hooks run.
RUN apk add --no-cache dumb-init

ENV NODE_ENV=production
ENV PORT=3003

WORKDIR /app

# Reuse the pruned production tree instead of installing twice.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

# Uploads are written at runtime; give the non-root user ownership.
RUN mkdir -p /app/uploads && chown -R node:node /app

# No `COPY .env.example .env` — that baked the placeholder JWT_SECRET into
# every image. Configuration is injected at run time, and boot-time env
# validation refuses to start without a real secret.

USER node

EXPOSE 3003

HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3003/api/health/live').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main"]
