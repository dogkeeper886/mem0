# Claude Code Project Configuration

## Project Overview
This project implements an MCP (Model Context Protocol) memory server for Claude Code integration using Mem0 and external Ollama connections.

## Main Implementation Directory
```
claude-code-memory
```

## Docker-Only Implementation
**IMPORTANT**: This project uses Docker exclusively. No local Python packages should be installed.

### Two Usage Modes

#### 1. MCP with Claude Code (Production)
**No .env file needed!** Environment variables are passed directly:
```bash
claude mcp add mem0-memory -- docker run --rm -i --name mem0-memory-mcp \
  --network host \
  -e OLLAMA_URL=http://YOUR_OLLAMA_IP:11434 \
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
- **MCP Server**: Port 8765 (Docker container)
- **Qdrant Vector DB**: Port 6333 (Docker container)  
- **Ollama**: External URL connection (not containerized)

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
- `mcp_server.py` - MCP protocol implementation
- `docker-compose.yml` - Service orchestration
- `Dockerfile` - MCP server container
- `requirements.txt` - Python dependencies (containerized)
- `.env` - Ollama URL configuration

### Environment Variables
- `OLLAMA_URL` - External Ollama server URL
- `OLLAMA_MODEL` - LLM model (default: llama3.2:3b)
- `EMBED_MODEL` - Embedding model (default: nomic-embed-text)

### Usage with Claude Code

#### Add MCP Server
```bash
claude mcp add mem0-memory -- docker run --rm -i --name mem0-memory-mcp --network host -e OLLAMA_URL=http://YOUR_OLLAMA_IP:11434 claude-code-memory-mcp-server
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