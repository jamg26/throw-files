# ── Build stage ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json tsconfig.json ./
RUN npm install --include=dev

COPY index.ts router.ts ./
COPY @types/ ./@types/
RUN npx tsc

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime

# node:20-alpine already has a non-root 'node' user (uid/gid 1000)
WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm install --omit=dev && \
    mkdir -p uploads && chown node:node uploads

ENV NODE_ENV=production
# SERVE_STATIC is intentionally NOT set — this container is API only.

USER node
EXPOSE 5000
CMD ["node", "dist/index.js"]
