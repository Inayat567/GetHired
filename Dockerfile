# Multi-stage or clean production Dockerfile for GetHired
FROM node:20-bookworm-slim AS base

# Install OS build dependencies for sqlite3 compilation and playwright chromium
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package manifests
COPY package.json package-lock.json* ./

# Install npm dependencies
RUN npm ci

# Install Playwright Chromium with system dependencies for scraper
RUN npx playwright install --with-deps chromium

# Copy application code
COPY . .

# Build Next.js application
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# Create data directory mount point
RUN mkdir -p /data/profiles

# Expose web server port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "start"]
