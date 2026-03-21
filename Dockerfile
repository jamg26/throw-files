FROM node:20-alpine

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json tsconfig.json ./

# Install all dependencies (devDeps needed for TypeScript compilation)
RUN npm install --include=dev

# Copy backend source files
COPY index.ts router.ts ./
COPY @types/ ./@types/

# Compile TypeScript → dist/
RUN npx tsc

# Prune dev dependencies to slim the final image
RUN npm prune --production

# Copy pre-built React frontend (served as static files in production mode)
COPY client/build/ ./client/build/

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
