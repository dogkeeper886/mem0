FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1000 mcp && \
    mkdir -p /app/data /app/.mem0 && \
    chown -R mcp:mcp /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY --chown=mcp:mcp mcp_server.py .

# Switch to non-root user
USER mcp

# Set environment variables for persistence
ENV MEM0_DIR=/app/.mem0
ENV DATA_DIR=/app/data

# Expose port
EXPOSE 8765

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8765/health || exit 1

# Run the application
CMD ["python", "mcp_server.py"]