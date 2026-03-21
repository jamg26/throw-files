# ── Build stage ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Cache dependency layer separately from source
COPY package*.json tsconfig.json ./
RUN npm install --include=dev

# Compile TypeScript → dist/
COPY index.ts router.ts ./
COPY @types/ ./@types/
RUN npx tsc

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime

RUN addgroup -g 1000 app && adduser -u 1000 -G app -H -s /sbin/nologin -D app

WORKDIR /app

# Copy only compiled output and production deps from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm install --omit=dev

ENV NODE_ENV=production
# SERVE_STATIC is intentionally NOT set — this container is API only.
# The frontend is served by Cloudflare Pages at throwmyfile.com.

USER app
EXPOSE 5000
CMD ["node", "dist/index.js"]
