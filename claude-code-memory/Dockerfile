FROM node:18-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create directories and set permissions
RUN mkdir -p /app/data && \
    chown -R node:node /app

# Copy package files and install dependencies (including devDependencies for build)
COPY package*.json ./
RUN npm ci && npm cache clean --force

# Copy source code and TypeScript config
COPY --chown=node:node src/ ./src/
COPY --chown=node:node tsconfig.json ./
COPY --chown=node:node entrypoint.sh .

# Build TypeScript to JavaScript
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm ci --only=production && npm cache clean --force

# Make entrypoint executable
RUN chmod +x entrypoint.sh

# Switch to non-root user
USER node

# Set environment variables for persistence
ENV DATA_DIR=/app/data

# Health check for MCP stdio server
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD pgrep -f "node dist/index.js" || exit 1

# Set entrypoint
ENTRYPOINT ["./entrypoint.sh"]