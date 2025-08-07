#!/bin/bash
# Complete MCP Memory Server Setup
# This script handles the entire setup process

# Load configuration
source ./mcp-config.sh

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Claude Code Memory Server - Complete Setup${NC}"
echo "==========================================="
echo ""

# Step 1: Start Qdrant
echo -e "${YELLOW}Step 1: Starting Qdrant vector database...${NC}"
docker compose up -d
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Qdrant started successfully${NC}"
else
    echo -e "${RED}✗ Failed to start Qdrant${NC}"
    exit 1
fi
echo ""

# Step 2: Build MCP server image
echo -e "${YELLOW}Step 2: Building MCP server Docker image...${NC}"
docker build -t claude-code-memory-mcp-server .
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Docker image built successfully${NC}"
else
    echo -e "${RED}✗ Failed to build Docker image${NC}"
    exit 1
fi
echo ""

# Step 3: Test Ollama connection
echo -e "${YELLOW}Step 3: Testing Ollama connection...${NC}"
if curl -s "$OLLAMA_URL/api/tags" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Ollama is accessible at $OLLAMA_URL${NC}"
else
    echo -e "${RED}✗ Cannot connect to Ollama at $OLLAMA_URL${NC}"
    echo "  Please check your Ollama server is running"
    exit 1
fi
echo ""

# Step 4: Test Qdrant connection
echo -e "${YELLOW}Step 4: Testing Qdrant connection...${NC}"
QDRANT_URL="http://${QDRANT_HOST}:6333"
if [ "$QDRANT_HOST" = "localhost" ] || [ "$QDRANT_HOST" = "127.0.0.1" ]; then
    QDRANT_URL="http://localhost:6333"
fi

sleep 2  # Give Qdrant time to start
if curl -s "$QDRANT_URL" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Qdrant is accessible at $QDRANT_URL${NC}"
else
    echo -e "${RED}✗ Cannot connect to Qdrant at $QDRANT_URL${NC}"
    echo "  Please check Qdrant is running"
    exit 1
fi
echo ""

# Step 5: Setup MCP server in Claude Code
echo -e "${YELLOW}Step 5: Adding MCP server to Claude Code...${NC}"

# Check if mem0-memory already exists
if claude mcp list 2>/dev/null | grep -q "mem0-memory"; then
    echo "  Removing existing mem0-memory server..."
    claude mcp remove mem0-memory
fi

# Add the MCP server
claude mcp add mem0-memory -- docker run --rm -i \
  --name mem0-memory-mcp \
  --network host \
  -e OLLAMA_URL="$OLLAMA_URL" \
  -e QDRANT_HOST="$QDRANT_HOST" \
  -e OLLAMA_MODEL="$OLLAMA_MODEL" \
  -e EMBED_MODEL="$EMBED_MODEL" \
  claude-code-memory-mcp-server

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ MCP server added to Claude Code${NC}"
else
    echo -e "${RED}✗ Failed to add MCP server${NC}"
    exit 1
fi
echo ""

# Step 6: Verify connection
echo -e "${YELLOW}Step 6: Verifying MCP connection...${NC}"
sleep 3  # Give MCP server time to start
claude mcp list
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Configuration used:"
echo "  Ollama: $OLLAMA_URL (Model: $OLLAMA_MODEL)"
echo "  Qdrant: $QDRANT_HOST:6333"
echo "  Embedding: $EMBED_MODEL"
echo ""
echo "You can now use memory operations in Claude Code!"
echo "Try: 'Remember that my favorite color is blue'"