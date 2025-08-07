# MCP Memory Server for Claude Code

Docker-based MCP (Model Context Protocol) server for Claude Code memory integration using the official Anthropic MCP SDK.

**Version 2.0.0** - TypeScript implementation with official MCP SDK for better maintainability and protocol compliance.

## Quick Start

### Option 1: Automated Setup (Recommended)

1. **Configure your environment**:
   ```bash
   # Edit mcp-config.sh with your settings
   nano mcp-config.sh
   ```

2. **Run complete setup**:
   ```bash
   ./setup.sh
   ```

### Option 2: Manual Setup

1. **Start Qdrant**:
   ```bash
   docker compose up -d
   ```

2. **Build MCP server image**:
   ```bash
   docker build -t claude-code-memory-mcp-server .
   ```

3. **Add to Claude Code**:
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

## Environment Variables

- `OLLAMA_URL` - Ollama server URL (required)
- `QDRANT_HOST` - Qdrant host IP or hostname (required)
- `OLLAMA_MODEL` - LLM model (default: `llama3.2:3b`)  
- `EMBED_MODEL` - Embedding model (default: `nomic-embed-text`)
- `QDRANT_PORT` - Qdrant port (default: `6333`)

## Endpoints

- `POST /mcp` - MCP protocol endpoint
- `GET /health` - Health check
- `POST /memory/add` - Add memory (REST)
- `GET /memory/search` - Search memory (REST)

## Architecture

- **MCP Server**: Node.js/TypeScript with official MCP SDK (runs via Claude Code stdio)
- **Qdrant**: Port 6333 (vector database for memory storage)
- **Ollama**: External service for LLM and embedding models

## Services

- **MCP Server**: Runs via Claude Code with stdio (no port needed)
- **Qdrant**: Port 6333 (vector database)

## Usage with Claude Code

### Add MCP Server
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

## Development

### File Structure
```
src/
├── index.ts              # Main MCP server with official SDK
├── memory/
│   ├── client.ts         # Memory operations with Mem0
│   └── config.ts         # Configuration management
├── tools/
│   ├── add-memory.ts     # Add memory tool
│   ├── search-memory.ts  # Search memory tool
│   ├── list-memories.ts  # List memories tool
│   ├── delete-memory.ts  # Delete memory tool
│   └── reset-memory.ts   # Reset memory tool
└── types/
    └── schema.ts         # Zod schemas for validation
```

### Build and Development
```bash
# Install dependencies
npm install

# Development with hot reload
npm run dev

# Build TypeScript
npm run build

# Start production server
npm start
```

### Key Features
- **Official MCP SDK** - Full protocol compliance
- **TypeScript** - Type safety and better development experience  
- **Zod schemas** - Runtime validation for all tool inputs
- **Docker containerized** - No local dependencies required
- **Data persistence** - All memory stored in Docker volumes

For testing, use the HTTP endpoint: `http://YOUR_IP_ADDRESS:8765/mcp`