# syntax = docker/dockerfile:1

# Node.js LTS base image with Chromium dependencies for Playwright
FROM node:20-bookworm-slim AS base

# Install Playwright OS dependencies & tools
RUN apt-get update -y && \
    apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    wget \
    xdg-utils && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Copy package descriptors
COPY package*.json ./

# Install all dependencies (including dev tools for build)
RUN npm install

# Install Playwright Chromium browser
RUN npx playwright install chromium

# Copy source code and assets
COPY . .

# Compile TypeScript to dist/
RUN npm run build

# Prepare persistent data volume directory
RUN mkdir -p /data/profiles && mkdir -p /data/db

# Expose internal port
EXPOSE 3000

# Start GetHired web dashboard
CMD ["npm", "run", "dashboard"]
