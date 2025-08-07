#!/bin/bash
# MCP Memory Server Setup Script
# This script adds/updates the MCP server to Claude Code with your configuration

# Load configuration
source ./mcp-config.sh

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}MCP Memory Server Setup${NC}"
echo "========================"
echo "Configuration:"
echo "  Ollama URL: $OLLAMA_URL"
echo "  Qdrant Host: $QDRANT_HOST"
echo "  Chat Model: $OLLAMA_MODEL"
echo "  Embed Model: $EMBED_MODEL"
echo ""

# Check if mem0-memory already exists
if claude mcp list 2>/dev/null | grep -q "mem0-memory"; then
    echo -e "${YELLOW}Removing existing mem0-memory server...${NC}"
    claude mcp remove mem0-memory
fi

# Add the MCP server
echo -e "${GREEN}Adding MCP server to Claude Code...${NC}"
claude mcp add mem0-memory -- docker run --rm -i \
  --name mem0-memory-mcp \
  --network host \
  -e OLLAMA_URL="$OLLAMA_URL" \
  -e QDRANT_HOST="$QDRANT_HOST" \
  -e OLLAMA_MODEL="$OLLAMA_MODEL" \
  -e EMBED_MODEL="$EMBED_MODEL" \
  claude-code-memory-mcp-server

echo ""
echo -e "${GREEN}Checking connection status...${NC}"
claude mcp list

echo ""
echo -e "${GREEN}Setup complete!${NC}"
echo "If the server shows as 'Failed to connect', make sure:"
echo "  1. Qdrant is running (docker compose up -d)"
echo "  2. Ollama is accessible at $OLLAMA_URL"
echo "  3. The Docker image is built (docker build -t claude-code-memory-mcp-server .)"