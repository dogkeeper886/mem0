# Product Requirements Document: MCP Memory Server

## Overview
Simple Docker-based MCP (Model Context Protocol) server for Claude Code memory integration using Mem0.

## Goals
- **Docker-only deployment** - no local package installation
- **MCP stdio protocol** - standard interface for Claude Code via stdin/stdout
- **Memory persistence** - conversations stored and searchable
- **External Ollama support** - connect to any Ollama URL

## Core Features
1. **MCP Server** - FastAPI server implementing MCP protocol
2. **Memory Operations** - add, search, list, delete memories
3. **Docker deployment** - single `docker-compose up` command
4. **Ollama URL integration** - configurable external Ollama connection

## Architecture
```
Claude Code → MCP stdio → MCP Server (Docker) → Mem0 → Ollama (External URL)
                                      ↓
                                   Qdrant (Docker)
```

## Components
- `mcp_server.py` - MCP protocol implementation
- `docker-compose.yml` - Development/testing setup
- `Dockerfile` - MCP server container
- `requirements.txt` - Python dependencies
- `.env.example` - Example config (only for docker-compose testing)

## Configuration

### For MCP with Claude Code (Production)
Environment variables passed directly in docker run command:
- `OLLAMA_URL` - External Ollama server URL
- `OLLAMA_MODEL` - LLM model name
- `EMBED_MODEL` - Embedding model name

### For Docker Compose (Development/Testing)
Uses `.env` file for configuration (copy from `.env.example`)

## Success Criteria
- Start with single `docker-compose up` command
- Connect to any external Ollama URL
- Claude Code can add/remove via `claude mcp` commands
- Memories persist across restarts
- No local Python/package installation required

## Claude Code Integration
```bash
# Add server
claude mcp add mem0-memory -- docker run --rm -i --name mem0-memory-mcp --network host -e OLLAMA_URL=http://192.168.4.114:11434 claude-code-memory-mcp-server

# List servers
claude mcp list

# Remove server (for rebuilding)
claude mcp remove mem0-memory
```