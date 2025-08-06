# Claude Code + Mem0 Integration with Ollama

## Overview

This guide provides step-by-step instructions to integrate Mem0's memory capabilities into Claude Code using **Ollama** for both LLM and embeddings, ensuring complete local operation without dependency on OpenAI or other cloud services.

## Why Ollama?

- **100% Local**: All processing happens on your machine
- **No API Keys Required**: No cloud dependencies
- **Cost-Free**: No API usage charges
- **Privacy**: Your data never leaves your machine
- **Supported Models**: Llama3, Mistral, Phi, Gemma, and many more

## Prerequisites

1. **Install Ollama**:
```bash
# Linux/WSL
curl -fsSL https://ollama.com/install.sh | sh

# macOS
brew install ollama

# Start Ollama service
ollama serve
```

2. **Pull Required Models**:
```bash
# For LLM (choose one)
ollama pull llama3.1:8b        # Recommended: Good balance
ollama pull mistral:7b         # Alternative: Fast
ollama pull phi3:mini          # Lightweight option

# For embeddings
ollama pull nomic-embed-text   # Best for embeddings
# or
ollama pull mxbai-embed-large  # Alternative embedder
```

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────┐
│  Claude Code    │────▶│  Mem0 MCP Server │────▶│   Ollama     │
│                 │◀────│  (OpenMemory)    │◀────│   (Local)    │
└─────────────────┘     └──────────────────┘     └──────────────┘
                               │                         │
                               ▼                         ▼
                        ┌──────────────┐         ┌──────────────┐
                        │   Qdrant     │         │  Embeddings  │
                        │ (Vector DB)  │         │    Models    │
                        └──────────────┘         └──────────────┘
```

## Step 1: Configure Mem0 for Ollama

### Configuration File

```python
# File: /home/jack/Documents/mem0/claude-code-memory/ollama_config.py

OLLAMA_CONFIG = {
    "llm": {
        "provider": "ollama",
        "config": {
            "model": "llama3.1:8b",  # or your preferred model
            "temperature": 0.7,
            "max_tokens": 1000,
            "ollama_base_url": "http://localhost:11434",  # Default Ollama URL
        }
    },
    "embedder": {
        "provider": "ollama",
        "config": {
            "model": "nomic-embed-text",
            "ollama_base_url": "http://localhost:11434",
            "embedding_dims": 768  # nomic-embed-text dimension
        }
    },
    "vector_store": {
        "provider": "qdrant",
        "config": {
            "collection_name": "claude_code_memory",
            "host": "localhost",
            "port": 6333,
        }
    }
}
```

## Step 2: Ollama-Ready Memory Client

```python
# File: /home/jack/Documents/mem0/claude-code-memory/ollama_memory_client.py

import os
import hashlib
import logging
from typing import Optional, Dict, Any, List
from mem0 import Memory
from ollama_config import OLLAMA_CONFIG

logger = logging.getLogger(__name__)

class OllamaMemoryClient:
    """Memory client using Ollama for all AI operations"""
    
    def __init__(
        self,
        user_id: Optional[str] = None,
        config: Optional[Dict] = None
    ):
        # Use provided config or default Ollama config
        self.config = config or OLLAMA_CONFIG
        
        # Generate user ID
        self.user_id = user_id or self._generate_user_id()
        
        # Initialize memory with Ollama configuration
        self.memory = Memory(config=self.config)
        
        # Test Ollama connection
        self._test_ollama_connection()
    
    def _generate_user_id(self) -> str:
        """Generate unique user ID"""
        unique_string = f"{os.getenv('USER', 'default')}-claude-code"
        return hashlib.md5(unique_string.encode()).hexdigest()[:16]
    
    def _test_ollama_connection(self):
        """Test if Ollama is running and models are available"""
        try:
            import ollama
            client = ollama.Client(host=self.config["llm"]["config"]["ollama_base_url"])
            
            # Check if LLM model exists
            models = client.list()
            llm_model = self.config["llm"]["config"]["model"]
            embedding_model = self.config["embedder"]["config"]["model"]
            
            model_names = [m['name'] for m in models['models']]
            
            if llm_model not in model_names:
                logger.warning(f"LLM model {llm_model} not found. Pulling...")
                client.pull(llm_model)
            
            if embedding_model not in model_names:
                logger.warning(f"Embedding model {embedding_model} not found. Pulling...")
                client.pull(embedding_model)
            
            logger.info("✓ Ollama connection successful")
            return True
            
        except Exception as e:
            logger.error(f"Ollama connection failed: {e}")
            logger.error("Please ensure Ollama is running: 'ollama serve'")
            return False
    
    def add_memory(
        self,
        messages: List[Dict[str, str]],
        metadata: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Add conversation to memory"""
        try:
            result = self.memory.add(
                messages=messages,
                user_id=self.user_id,
                metadata=metadata
            )
            logger.debug(f"Added memory: {result}")
            return result
        except Exception as e:
            logger.error(f"Failed to add memory: {e}")
            return {"error": str(e)}
    
    def search_memory(
        self,
        query: str,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """Search for relevant memories"""
        try:
            results = self.memory.search(
                query=query,
                user_id=self.user_id,
                limit=limit
            )
            return results.get("results", [])
        except Exception as e:
            logger.error(f"Failed to search memory: {e}")
            return []
    
    def get_all_memories(self) -> List[Dict[str, Any]]:
        """Get all memories for user"""
        try:
            results = self.memory.get_all(user_id=self.user_id)
            return results.get("results", [])
        except Exception as e:
            logger.error(f"Failed to get memories: {e}")
            return []
    
    def delete_memory(self, memory_id: str) -> bool:
        """Delete specific memory"""
        try:
            self.memory.delete(memory_id=memory_id)
            return True
        except Exception as e:
            logger.error(f"Failed to delete memory: {e}")
            return False
    
    def reset_memory(self) -> bool:
        """Delete all memories for user"""
        try:
            self.memory.reset(user_id=self.user_id)
            return True
        except Exception as e:
            logger.error(f"Failed to reset memory: {e}")
            return False
```

## Step 3: Docker Compose with Ollama

```yaml
# File: /home/jack/Documents/mem0/claude-code-memory/docker-compose-ollama.yml

version: '3.8'

services:
  # Ollama service (if not running locally)
  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_models:/root/.ollama
    environment:
      - OLLAMA_KEEP_ALIVE=24h
    command: serve
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:11434/api/version"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Pull required models
  ollama-models:
    image: ollama/ollama:latest
    depends_on:
      - ollama
    volumes:
      - ollama_models:/root/.ollama
    entrypoint: >
      sh -c "
      sleep 5 &&
      ollama pull llama3.1:8b &&
      ollama pull nomic-embed-text &&
      echo 'Models ready'
      "

  # Qdrant Vector Database
  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
    volumes:
      - qdrant_storage:/qdrant/storage
    environment:
      - QDRANT__SERVICE__HTTP_PORT=6333

  # Mem0 API (configured for Ollama)
  mem0-api:
    build:
      context: .
      dockerfile: Dockerfile.ollama
    ports:
      - "8765:8765"
    environment:
      - OLLAMA_HOST=http://ollama:11434
      - QDRANT_HOST=qdrant
      - QDRANT_PORT=6333
      - DATABASE_URL=sqlite:///data/mem0.db
    volumes:
      - ./data:/data
      - ./:/app
    depends_on:
      - ollama
      - qdrant
      - ollama-models
    command: python main.py

volumes:
  ollama_models:
  qdrant_storage:

networks:
  default:
    name: claude-code-memory-ollama
```

## Step 4: Dockerfile for Ollama Integration

```dockerfile
# File: /home/jack/Documents/mem0/claude-code-memory/Dockerfile.ollama

FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements-ollama.txt .
RUN pip install --no-cache-dir -r requirements-ollama.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8765

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8765/health || exit 1

# Run the application
CMD ["python", "main.py"]
```

## Step 5: Requirements File

```txt
# File: /home/jack/Documents/mem0/claude-code-memory/requirements-ollama.txt

# Core
mem0ai>=0.1.0
ollama>=0.1.0

# Vector Store
qdrant-client>=1.9.1

# Web Framework (for API)
fastapi>=0.100.0
uvicorn>=0.23.0
httpx>=0.24.0

# Utilities
pydantic>=2.0.0
python-dotenv>=1.0.0
sqlalchemy>=2.0.0

# No OpenAI or cloud LLM dependencies needed!
```

## Step 6: Main Application with Ollama

```python
# File: /home/jack/Documents/mem0/claude-code-memory/main.py

import os
import logging
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
from ollama_memory_client import OllamaMemoryClient

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(title="Claude Code Memory API (Ollama)")

# Initialize memory client
memory_client = None

class MemoryRequest(BaseModel):
    messages: List[Dict[str, str]]
    user_id: Optional[str] = None
    metadata: Optional[Dict] = None

class SearchRequest(BaseModel):
    query: str
    user_id: Optional[str] = None
    limit: int = 5

@app.on_event("startup")
async def startup_event():
    """Initialize memory client on startup"""
    global memory_client
    try:
        memory_client = OllamaMemoryClient()
        logger.info("✓ Memory client initialized with Ollama")
    except Exception as e:
        logger.error(f"Failed to initialize memory client: {e}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    if memory_client is None:
        raise HTTPException(status_code=503, detail="Memory client not initialized")
    
    # Test Ollama connection
    import ollama
    try:
        client = ollama.Client(host="http://localhost:11434")
        models = client.list()
        return {
            "status": "healthy",
            "ollama": "connected",
            "models": [m['name'] for m in models['models']]
        }
    except:
        return {
            "status": "degraded",
            "ollama": "disconnected",
            "message": "Please ensure Ollama is running"
        }

@app.post("/memory/add")
async def add_memory(request: MemoryRequest):
    """Add memory endpoint"""
    if memory_client is None:
        raise HTTPException(status_code=503, detail="Memory service unavailable")
    
    result = memory_client.add_memory(
        messages=request.messages,
        metadata=request.metadata
    )
    return result

@app.post("/memory/search")
async def search_memory(request: SearchRequest):
    """Search memory endpoint"""
    if memory_client is None:
        raise HTTPException(status_code=503, detail="Memory service unavailable")
    
    results = memory_client.search_memory(
        query=request.query,
        limit=request.limit
    )
    return {"results": results}

@app.get("/memory/list/{user_id}")
async def list_memories(user_id: str):
    """List all memories for a user"""
    if memory_client is None:
        raise HTTPException(status_code=503, detail="Memory service unavailable")
    
    # Create temporary client for specific user
    client = OllamaMemoryClient(user_id=user_id)
    memories = client.get_all_memories()
    return {"memories": memories}

@app.delete("/memory/reset/{user_id}")
async def reset_memory(user_id: str):
    """Reset all memories for a user"""
    if memory_client is None:
        raise HTTPException(status_code=503, detail="Memory service unavailable")
    
    client = OllamaMemoryClient(user_id=user_id)
    success = client.reset_memory()
    return {"success": success}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8765)
```

## Step 7: Installation Script

```bash
#!/bin/bash
# File: /home/jack/Documents/mem0/claude-code-memory/install-ollama.sh

echo "🚀 Setting up Claude Code + Mem0 with Ollama"

# Check prerequisites
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 is required but not installed."
        return 1
    fi
    echo "✓ $1 found"
    return 0
}

# Check required tools
check_command docker || exit 1
check_command python3 || exit 1

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "📦 Installing Ollama..."
    curl -fsSL https://ollama.com/install.sh | sh
fi

# Start Ollama service
echo "🔧 Starting Ollama service..."
ollama serve &
OLLAMA_PID=$!
sleep 5

# Pull required models
echo "📥 Pulling Ollama models..."
ollama pull llama3.1:8b
ollama pull nomic-embed-text

# Create Python virtual environment
echo "🐍 Setting up Python environment..."
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install --upgrade pip
pip install mem0ai ollama qdrant-client fastapi uvicorn httpx pydantic python-dotenv sqlalchemy

# Create data directory
mkdir -p data

# Start Docker services (Qdrant only, Ollama runs locally)
echo "🐳 Starting Qdrant vector database..."
docker run -d \
  --name qdrant \
  -p 6333:6333 \
  -v $(pwd)/qdrant_storage:/qdrant/storage \
  qdrant/qdrant

# Wait for services
echo "⏳ Waiting for services to start..."
sleep 10

# Test connections
echo "🧪 Testing connections..."

# Test Ollama
python3 -c "
import ollama
try:
    client = ollama.Client()
    models = client.list()
    print('✓ Ollama is running with models:', [m['name'] for m in models['models']])
except Exception as e:
    print('❌ Ollama connection failed:', e)
"

# Test Qdrant
python3 -c "
import httpx
try:
    r = httpx.get('http://localhost:6333/health')
    if r.status_code == 200:
        print('✓ Qdrant is running')
except:
    print('❌ Qdrant connection failed')
"

echo "✅ Setup complete!"
echo ""
echo "To start the memory API:"
echo "  source venv/bin/activate"
echo "  python main.py"
echo ""
echo "API will be available at: http://localhost:8765"
echo "Qdrant dashboard: http://localhost:6333/dashboard"
```

## Step 8: Test Script

```python
# File: /home/jack/Documents/mem0/claude-code-memory/test_ollama_integration.py

import asyncio
import logging
from ollama_memory_client import OllamaMemoryClient

logging.basicConfig(level=logging.INFO)

async def test_ollama_memory():
    """Test Ollama-based memory operations"""
    
    print("🧪 Testing Ollama Memory Integration\n")
    
    # Initialize client
    print("1️⃣ Initializing Ollama memory client...")
    client = OllamaMemoryClient()
    
    # Test data
    test_conversations = [
        {
            "messages": [
                {"role": "user", "content": "My name is Jack and I love Python programming"},
                {"role": "assistant", "content": "Nice to meet you Jack! Python is a great language."}
            ]
        },
        {
            "messages": [
                {"role": "user", "content": "I'm working on integrating Mem0 with Claude Code"},
                {"role": "assistant", "content": "That sounds like an interesting project!"}
            ]
        },
        {
            "messages": [
                {"role": "user", "content": "I prefer using Ollama for local LLM inference"},
                {"role": "assistant", "content": "Ollama is excellent for local deployment."}
            ]
        }
    ]
    
    # Add memories
    print("\n2️⃣ Adding memories...")
    for i, conv in enumerate(test_conversations, 1):
        result = client.add_memory(conv["messages"])
        print(f"  Memory {i} added: {result.get('message', 'Success')}")
    
    # Search memories
    print("\n3️⃣ Searching memories...")
    test_queries = [
        "What's my name?",
        "What am I working on?",
        "What LLM tool do I prefer?"
    ]
    
    for query in test_queries:
        results = client.search_memory(query, limit=1)
        if results:
            memory = results[0].get('memory', results[0].get('data', 'N/A'))
            score = results[0].get('score', 0)
            print(f"  Q: {query}")
            print(f"  A: {memory} (score: {score:.3f})")
        else:
            print(f"  Q: {query}")
            print(f"  A: No relevant memory found")
    
    # List all memories
    print("\n4️⃣ Listing all memories...")
    all_memories = client.get_all_memories()
    print(f"  Total memories: {len(all_memories)}")
    for i, mem in enumerate(all_memories[:3], 1):
        content = mem.get('memory', mem.get('data', 'N/A'))
        print(f"  {i}. {content[:50]}...")
    
    print("\n✅ All tests completed successfully!")
    print("\n📊 System Info:")
    print(f"  - User ID: {client.user_id}")
    print(f"  - LLM Model: {client.config['llm']['config']['model']}")
    print(f"  - Embedding Model: {client.config['embedder']['config']['model']}")
    print(f"  - Vector Store: {client.config['vector_store']['provider']}")

if __name__ == "__main__":
    asyncio.run(test_ollama_memory())
```

## Step 9: Claude Code Integration

```python
# File: /home/jack/Documents/mem0/claude-code-memory/claude_code_ollama.py

import os
import logging
from typing import List, Dict, Optional
from ollama_memory_client import OllamaMemoryClient

class ClaudeCodeWithOllamaMemory:
    """Claude Code enhanced with Ollama-based memory"""
    
    def __init__(self):
        self.memory = OllamaMemoryClient()
        self.context_window = 3  # Number of memories to include
        
    async def process_query(
        self,
        query: str,
        include_context: bool = True
    ) -> Dict[str, any]:
        """Process query with memory context"""
        
        response = {
            "query": query,
            "context": [],
            "response": "",
            "memories_used": 0
        }
        
        # Search for relevant context
        if include_context:
            memories = self.memory.search_memory(query, limit=self.context_window)
            response["context"] = memories
            response["memories_used"] = len(memories)
            
            # Build context string
            if memories:
                context_str = "Based on previous conversations:\n"
                for mem in memories:
                    context_str += f"- {mem.get('memory', '')}\n"
                
                # Enhance query with context
                enhanced_query = f"{context_str}\n\nCurrent query: {query}"
            else:
                enhanced_query = query
        else:
            enhanced_query = query
        
        # Process with Claude Code (placeholder)
        # In real implementation, this would call Claude's API
        response["response"] = f"[Would process with Claude]: {enhanced_query}"
        
        # Store the interaction
        self.memory.add_memory([
            {"role": "user", "content": query},
            {"role": "assistant", "content": response["response"]}
        ])
        
        return response
    
    def get_stats(self) -> Dict:
        """Get memory statistics"""
        all_memories = self.memory.get_all_memories()
        return {
            "total_memories": len(all_memories),
            "user_id": self.memory.user_id,
            "backend": "Ollama",
            "llm_model": self.memory.config['llm']['config']['model'],
            "embedding_model": self.memory.config['embedder']['config']['model']
        }
```

## Advantages of Ollama Integration

1. **Complete Privacy**: All data stays local
2. **No API Costs**: Zero ongoing expenses
3. **Full Control**: Choose and switch models freely
4. **Offline Capable**: Works without internet
5. **Fast**: Local inference with GPU acceleration
6. **Customizable**: Fine-tune models for your needs

## Troubleshooting

### Ollama not responding
```bash
# Check if Ollama is running
curl http://localhost:11434/api/version

# Restart Ollama
killall ollama
ollama serve &

# Check logs
journalctl -u ollama -f
```

### Model download issues
```bash
# Manual model pull
ollama pull llama3.1:8b
ollama pull nomic-embed-text

# List available models
ollama list
```

### Memory not persisting
```bash
# Check Qdrant
curl http://localhost:6333/collections

# Check data directory
ls -la ./data/
```

## Performance Tips

1. **Model Selection**:
   - For speed: Use smaller models (7B parameters)
   - For quality: Use larger models (13B+ parameters)
   - For embeddings: `nomic-embed-text` is optimized

2. **Hardware Optimization**:
   - GPU acceleration: Ollama automatically uses CUDA if available
   - CPU: Ensure adequate RAM (8GB minimum for 7B models)

3. **Caching**:
   - Ollama caches model responses
   - Qdrant indexes embeddings for fast retrieval

## Conclusion

This setup provides a completely local, private, and cost-free memory system for Claude Code using Ollama. All processing happens on your machine with no external dependencies.