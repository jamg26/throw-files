FROM node:20-alpine

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json tsconfig.json ./

# Install all dependencies (devDeps needed for TypeScript compilation)
RUN npm install --include=dev

# Copy backend source files only — frontend is deployed separately to Cloudflare Pages
COPY index.ts router.ts ./
COPY @types/ ./@types/

# Compile TypeScript → dist/
RUN npx tsc

# Prune dev dependencies to slim the final image
RUN npm prune --production

EXPOSE 5000

ENV NODE_ENV=production
# SERVE_STATIC is intentionally NOT set — this container is API only.
# The frontend is served by Cloudflare Pages at throwmyfile.com.

CMD ["node", "dist/index.js"]
