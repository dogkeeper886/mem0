# Claude Code Project Configuration

## Project Overview
This project implements an MCP (Model Context Protocol) memory server for Claude Code integration using Mem0 and external Ollama connections.

## Main Implementation Directory
```
claude-code-memory
```

## Docker-Only Implementation
**IMPORTANT**: This project uses Docker exclusively. No local Python packages should be installed.

### Quick Start
```bash
# Navigate to project directory
cd claude-code-memory

# Configure Ollama URL (optional - defaults to host.docker.internal:11434)
cp .env.example .env
# Edit .env with your Ollama URL if needed

# Start all services with Docker
docker-compose up -d

# Verify services are running
curl http://YOUR_IP_ADDRESS:8765/health
```

### Architecture
- **MCP Server**: Port 8765 (Docker container)
- **Qdrant Vector DB**: Port 6333 (Docker container)  
- **Ollama**: External URL connection (not containerized)

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