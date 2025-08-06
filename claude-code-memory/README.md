# MCP Memory Server for Claude Code

Docker-based MCP (Model Context Protocol) server for Claude Code memory integration.

## Quick Start

1. **Set Ollama URL** (if not running locally):
   ```bash
   cp .env.example .env
   # Edit .env with your Ollama URL
   ```

2. **Start the server**:
   ```bash
   docker-compose up -d
   ```

3. **Test connection**:
   ```bash
   curl http://YOUR_IP_ADDRESS:8765/health
   ```

## Environment Variables

- `OLLAMA_URL` - Ollama server URL (default: `http://host.docker.internal:11434`)
- `OLLAMA_MODEL` - LLM model (default: `llama3.2:3b`)  
- `EMBED_MODEL` - Embedding model (default: `nomic-embed-text`)

## Endpoints

- `POST /mcp` - MCP protocol endpoint
- `GET /health` - Health check
- `POST /memory/add` - Add memory (REST)
- `GET /memory/search` - Search memory (REST)

## Services

- **MCP Server**: Port 8765
- **Qdrant**: Port 6333 (vector database)

## Usage with Claude Code

### Add MCP Server
```bash
claude mcp add mem0-memory -- docker run --rm -i --name mem0-memory-mcp --network host -e OLLAMA_URL=http://192.168.4.114:11434 claude-code-memory-mcp-server
```

### List MCP Servers
```bash
claude mcp list
```

### Remove MCP Server (for rebuilding)
```bash
claude mcp remove mem0-memory
```

### Check Connection
```bash
# Should show: mem0-memory: docker run --rm -i ... - ✓ Connected
claude mcp list
```

For testing, use the HTTP endpoint: `http://YOUR_IP_ADDRESS:8765/mcp`