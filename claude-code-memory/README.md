# Claude Code Memory Server (MCP)

A Docker-based MCP (Model Context Protocol) server that provides persistent memory capabilities for Claude Code using the official Anthropic MCP SDK, Mem0, and Qdrant vector database.

**Version 2.1.0** - Production-ready with multi-project memory support and automatic project detection.

## ✨ Features

- **🧠 Persistent Memory** - Remember conversations, code patterns, and project context across sessions
- **🏗️ Multi-Project Support** - Automatic project detection with isolated memory per project  
- **🔍 Smart Search** - Project-scoped search by default, global search across all projects
- **🐳 Docker-First** - Zero local dependencies, runs entirely in containers
- **⚡ Official MCP SDK** - Full protocol compliance with Anthropic's official SDK
- **🔒 Type Safety** - TypeScript with Zod schemas for runtime validation

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- [Ollama](https://ollama.com) running with embedding models
- [Claude Code](https://claude.ai/code) CLI installed

### 1. Pull the Image

```bash
# Pull the latest pre-built image
docker pull your-dockerhub-username/claude-code-memory-mcp-server:latest
```

### 2. Start Qdrant Database

```bash
# Create a docker-compose.yml file
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
    volumes:
      - qdrant_data:/qdrant/storage
    environment:
      QDRANT__SERVICE__HTTP_PORT: 6333

volumes:
  qdrant_data:
EOF

# Start Qdrant
docker compose up -d
```

### 3. Add to Claude Code

```bash
claude mcp add mem0-memory -- docker run --rm -i \
  --name mem0-memory-mcp \
  --network host \
  -e OLLAMA_URL=http://YOUR_OLLAMA_IP:11434 \
  -e QDRANT_HOST=YOUR_QDRANT_IP \
  -e OLLAMA_MODEL=llama3.2:3b \
  -e EMBED_MODEL=nomic-embed-text \
  your-dockerhub-username/claude-code-memory-mcp-server:latest
```

### 4. Verify Installation

```bash
# Check MCP connection
claude mcp list
# Should show: mem0-memory: docker run ... - ✓ Connected

# Test in Claude Code
# Type: "Remember that I prefer using TypeScript for new projects"
# Then: "What do you remember about my preferences?"
```

## 🛠️ Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `OLLAMA_URL` | Ollama server URL | - | ✅ |
| `QDRANT_HOST` | Qdrant host IP/hostname | - | ✅ |
| `OLLAMA_MODEL` | LLM model for processing | `llama3.2:3b` | ❌ |
| `EMBED_MODEL` | Embedding model | `nomic-embed-text` | ❌ |
| `QDRANT_PORT` | Qdrant port | `6333` | ❌ |

### Ollama Setup

Ensure these models are available in your Ollama instance:

```bash
# Pull required models
ollama pull llama3.2:3b
ollama pull nomic-embed-text
```

## 🏗️ Architecture

```
Claude Code ←→ MCP Server ←→ Ollama (LLM/Embeddings)
                    ↓
                Qdrant (Vector DB)
```

- **MCP Server**: TypeScript with official MCP SDK (stdio communication)
- **Qdrant**: Vector database for memory storage (port 6333)
- **Ollama**: External service for LLM and embeddings
- **Data Persistence**: Docker volumes for automatic backup

## 🎯 Multi-Project Memory

The server automatically detects your current project and isolates memories:

### Automatic Project Detection
- **Project Path**: Based on `process.cwd()`
- **Git Integration**: Extracts repo info and branch
- **Session Tracking**: Groups memories by coding sessions
- **Zero Configuration**: Works out of the box

### Memory Isolation
```bash
# Working in /home/user/my-react-app
"Remember to use hooks instead of class components"
# → Stored with project: my-react-app

# Later, working in /home/user/my-vue-app  
"What do you remember about React?"
# → No results (different project)

# Search globally across all projects
"Search globally: React patterns"
# → Finds memories from all projects
```

## 🛠️ Available MCP Tools

| Tool | Description | Scope |
|------|-------------|-------|
| `add_memory` | Add memories with auto-tagging | Current project |
| `search_memory` | Search current project | Project-scoped |
| `search_memory_global` | Search all projects | Global |
| `list_memories` | List all memories | User-wide |
| `list_project_memories` | List project memories | Project-specific |
| `get_project_context` | Get current project info | Current project |
| `delete_memory` | Delete specific memory | By ID |
| `reset_memory` | Reset all memories | User-wide |

## 🔧 Management Commands

### List MCP Servers
```bash
claude mcp list
```

### Remove Server (for updates)
```bash
claude mcp remove mem0-memory
```

### Update to Latest Version
```bash
# Remove old server
claude mcp remove mem0-memory

# Pull latest image
docker pull your-dockerhub-username/claude-code-memory-mcp-server:latest

# Re-add with same command as installation
claude mcp add mem0-memory -- docker run --rm -i \
  --name mem0-memory-mcp --network host \
  -e OLLAMA_URL=http://YOUR_OLLAMA_IP:11434 \
  -e QDRANT_HOST=YOUR_QDRANT_IP \
  your-dockerhub-username/claude-code-memory-mcp-server:latest
```

## 💾 Data Persistence

All data is automatically persisted in Docker volumes:

### Backup Data
```bash
# Backup Qdrant database
docker run --rm -v qdrant_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/qdrant-backup.tar.gz -C /data .

# Restore from backup
docker run --rm -v qdrant_data:/data -v $(pwd):/backup alpine \
  tar xzf /backup/qdrant-backup.tar.gz -C /data
```

## 🏥 Health Check

The server provides health endpoints for monitoring:

```bash
# Check if Qdrant is accessible (when running with exposed port)
curl http://localhost:6333/health

# For MCP server health, check Claude Code connection:
claude mcp list  # Should show ✓ Connected
```

## 🐛 Troubleshooting

### Common Issues

**MCP server not connecting:**
```bash
# Check if Ollama is running
curl http://YOUR_OLLAMA_IP:11434/api/tags

# Check if Qdrant is running
curl http://YOUR_QDRANT_IP:6333/health

# Verify Claude Code can access Docker
claude mcp list
```

**Slow memory search:**
```bash
# Check Ollama model is downloaded
ollama list | grep nomic-embed-text

# Verify network connectivity
docker run --rm --network host alpine ping YOUR_OLLAMA_IP
```

**Memory not persisting:**
```bash
# Check Qdrant data volume exists
docker volume ls | grep qdrant_data

# Verify Qdrant is storing data
curl http://YOUR_QDRANT_IP:6333/collections
```

### Getting Help

1. **Check logs**: `docker logs mem0-memory-mcp` (if running detached)
2. **Verify environment**: All required environment variables set
3. **Test connectivity**: Ollama and Qdrant endpoints accessible
4. **Claude Code status**: `claude mcp list` shows ✓ Connected

## 🧑‍💻 Development

### Build from Source

```bash
# Clone repository
git clone https://github.com/your-username/claude-code-memory.git
cd claude-code-memory

# Build image
docker build -t claude-code-memory-mcp-server .

# Use your local image
claude mcp add mem0-memory -- docker run --rm -i \
  --name mem0-memory-mcp --network host \
  -e OLLAMA_URL=http://YOUR_OLLAMA_IP:11434 \
  -e QDRANT_HOST=YOUR_QDRANT_IP \
  claude-code-memory-mcp-server
```

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build TypeScript
npm run build

# Run tests
npm test
```

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

**Ready to enhance your Claude Code experience with persistent memory? Pull the Docker image and get started in minutes!**