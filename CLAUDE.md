# Claude Code Project Configuration

## Project Overview
This project implements an MCP (Model Context Protocol) memory server for Claude Code integration using the official Anthropic MCP SDK, Mem0, and external Ollama connections.

**Version 2.0.0**: TypeScript implementation using official MCP SDK for better maintainability and protocol compliance.

## Main Implementation Directory
```
claude-code-memory
```

## Docker-Only Implementation
**IMPORTANT**: This project uses Docker exclusively. Node.js/TypeScript application containerized - no local dependencies required.

### Two Usage Modes

#### 1. MCP with Claude Code (Production)
**No .env file needed!** Environment variables are passed directly:
```bash
claude mcp add mem0-memory -- docker run --rm -i \
  --name mem0-memory-mcp \
  --network host \
  -e OLLAMA_URL=http://YOUR_OLLAMA_IP:11434 \
  -e QDRANT_HOST=YOUR_QDRANT_IP \
  -e OLLAMA_MODEL=llama3.2:3b \
  -e EMBED_MODEL=nomic-embed-text \
  claude-code-memory-mcp-server
```

#### 2. Docker Compose (Development/Testing)
For local testing with docker-compose:
```bash
# Navigate to project directory
cd claude-code-memory

# ONLY for docker-compose testing (not needed for MCP):
cp .env.example .env
# Edit .env with your Ollama URL

# Start services for testing
docker-compose up -d

# Verify services
curl http://localhost:8765/health
```

### Architecture
- **MCP Server**: Node.js/TypeScript with official MCP SDK (Docker container, stdio communication)
- **Qdrant Vector DB**: Port 6333 (Docker container)  
- **Ollama**: External URL connection (not containerized)
- **Official MCP SDK**: @modelcontextprotocol/sdk for protocol compliance

### Data Persistence
All data is persisted using Docker volumes:
- **Qdrant data**: Stored in `qdrant_data` volume
- **MCP memory**: Stored in `mcp_memory` volume  
- **Local backup**: Optional bind mount at `./data/mcp` for direct access

To backup data:
```bash
# Backup Qdrant data
docker run --rm -v qdrant_data:/data -v $(pwd):/backup alpine tar czf /backup/qdrant-backup.tar.gz -C /data .

# Backup MCP memory
docker run --rm -v mcp_memory:/data -v $(pwd):/backup alpine tar czf /backup/mcp-backup.tar.gz -C /data .
```

### Key Files
- `src/index.ts` - Main MCP server with official SDK
- `src/tools/` - Individual memory tool implementations  
- `src/memory/` - Memory client and configuration
- `package.json` - Node.js dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `docker-compose.yml` - Service orchestration
- `Dockerfile` - MCP server container
- `.env` - Ollama URL configuration (for docker-compose only)

### Environment Variables
- `OLLAMA_URL` - External Ollama server URL
- `OLLAMA_MODEL` - LLM model (default: llama3.2:3b)
- `EMBED_MODEL` - Embedding model (default: nomic-embed-text)

### Usage with Claude Code

#### Add MCP Server
```bash
claude mcp add mem0-memory -- docker run --rm -i \
  --name mem0-memory-mcp \
  --network host \
  -e OLLAMA_URL=http://YOUR_OLLAMA_IP:11434 \
  -e QDRANT_HOST=YOUR_QDRANT_IP \
  -e OLLAMA_MODEL=llama3.2:3b \
  -e EMBED_MODEL=nomic-embed-text \
  claude-code-memory-mcp-server
```

#### Manage MCP Server
```bash
# List all MCP servers
claude mcp list

# Remove server (for rebuilding)
claude mcp remove mem0-memory

# Check connection status
claude mcp list  # Should show: ✓ Connected
```

#### Direct Testing
For HTTP testing: `http://YOUR_IP_ADDRESS:8765/mcp`

### Documentation
See `docs/` folder for detailed implementation guides and requirements.