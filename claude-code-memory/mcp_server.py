#!/usr/bin/env python3
"""
MCP Server for Claude Code Memory Integration
Implements Model Context Protocol for memory operations using Mem0
"""

import os
import json
import logging
from typing import Dict, List, Any, Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import httpx
from mem0 import Memory

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(title="Claude Code MCP Memory Server")

# Global memory client
memory_client = None

class MCPRequest(BaseModel):
    method: str
    params: Dict[str, Any] = {}

class MCPResponse(BaseModel):
    result: Any = None
    error: Optional[str] = None

class MemoryConfig:
    """Memory configuration for Ollama + Qdrant"""
    
    @staticmethod
    def get_config():
        return {
            "llm": {
                "provider": "ollama",
                "config": {
                    "model": os.getenv("OLLAMA_MODEL", "llama3.2:3b"),
                    "temperature": 0.1,
                    "ollama_base_url": os.getenv("OLLAMA_URL", "http://ollama:11434"),
                }
            },
            "embedder": {
                "provider": "ollama", 
                "config": {
                    "model": os.getenv("EMBED_MODEL", "nomic-embed-text"),
                    "ollama_base_url": os.getenv("OLLAMA_URL", "http://ollama:11434"),
                }
            },
            "vector_store": {
                "provider": "qdrant",
                "config": {
                    "collection_name": "claude_code_memory",
                    "host": os.getenv("QDRANT_HOST", "qdrant"),
                    "port": int(os.getenv("QDRANT_PORT", "6333")),
                }
            }
        }

class MCPMemoryServer:
    """MCP Server implementation for memory operations"""
    
    def __init__(self):
        self.memory = None
        self.initialize_memory()
    
    def initialize_memory(self):
        """Initialize Mem0 with Ollama configuration"""
        try:
            config = MemoryConfig.get_config()
            self.memory = Memory(config=config)
            logger.info("✓ Memory client initialized with Ollama")
        except Exception as e:
            logger.error(f"Failed to initialize memory: {e}")
            raise
    
    async def handle_mcp_request(self, request: MCPRequest) -> MCPResponse:
        """Handle MCP protocol requests"""
        method = request.method
        params = request.params
        
        try:
            if method == "memory/add":
                return await self._add_memory(params)
            elif method == "memory/search":
                return await self._search_memory(params)
            elif method == "memory/list":
                return await self._list_memories(params)
            elif method == "memory/delete":
                return await self._delete_memory(params)
            elif method == "memory/reset":
                return await self._reset_memory(params)
            elif method == "ping":
                return MCPResponse(result={"status": "pong"})
            else:
                return MCPResponse(error=f"Unknown method: {method}")
                
        except Exception as e:
            logger.error(f"Error handling {method}: {e}")
            return MCPResponse(error=str(e))
    
    async def _add_memory(self, params: Dict) -> MCPResponse:
        """Add memory from conversation"""
        messages = params.get("messages", [])
        user_id = params.get("user_id", "default")
        metadata = params.get("metadata", {})
        
        if not messages:
            return MCPResponse(error="No messages provided")
        
        result = self.memory.add(
            messages=messages,
            user_id=user_id,
            metadata=metadata
        )
        
        return MCPResponse(result=result)
    
    async def _search_memory(self, params: Dict) -> MCPResponse:
        """Search memories by query"""
        query = params.get("query")
        user_id = params.get("user_id", "default")
        limit = params.get("limit", 5)
        
        if not query:
            return MCPResponse(error="No query provided")
        
        results = self.memory.search(
            query=query,
            user_id=user_id,
            limit=limit
        )
        
        return MCPResponse(result=results)
    
    async def _list_memories(self, params: Dict) -> MCPResponse:
        """List all memories for user"""
        user_id = params.get("user_id", "default")
        
        results = self.memory.get_all(user_id=user_id)
        return MCPResponse(result=results)
    
    async def _delete_memory(self, params: Dict) -> MCPResponse:
        """Delete specific memory"""
        memory_id = params.get("memory_id")
        
        if not memory_id:
            return MCPResponse(error="No memory_id provided")
        
        self.memory.delete(memory_id=memory_id)
        return MCPResponse(result={"success": True})
    
    async def _reset_memory(self, params: Dict) -> MCPResponse:
        """Reset all memories for user"""
        user_id = params.get("user_id", "default")
        
        self.memory.reset(user_id=user_id)
        return MCPResponse(result={"success": True})

# Global MCP server instance
mcp_server = None

@app.on_event("startup")
async def startup_event():
    """Initialize MCP server on startup"""
    global mcp_server
    try:
        mcp_server = MCPMemoryServer()
        logger.info("✓ MCP Memory Server started")
    except Exception as e:
        logger.error(f"Failed to start MCP server: {e}")
        raise

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    if mcp_server is None or mcp_server.memory is None:
        raise HTTPException(status_code=503, detail="Memory service not initialized")
    
    # Test Ollama connection
    try:
        async with httpx.AsyncClient() as client:
            ollama_url = os.getenv("OLLAMA_URL", "http://ollama:11434")
            response = await client.get(f"{ollama_url}/api/tags")
            ollama_status = "connected" if response.status_code == 200 else "disconnected"
    except:
        ollama_status = "disconnected"
    
    # Test Qdrant connection  
    try:
        async with httpx.AsyncClient() as client:
            qdrant_url = f"http://{os.getenv('QDRANT_HOST', 'qdrant')}:{os.getenv('QDRANT_PORT', '6333')}"
            response = await client.get(f"{qdrant_url}/health")
            qdrant_status = "connected" if response.status_code == 200 else "disconnected"
    except:
        qdrant_status = "disconnected"
    
    return {
        "status": "healthy" if ollama_status == "connected" and qdrant_status == "connected" else "degraded",
        "services": {
            "ollama": ollama_status,
            "qdrant": qdrant_status
        }
    }

@app.post("/mcp")
async def mcp_endpoint(request: MCPRequest):
    """Main MCP endpoint"""
    if mcp_server is None:
        raise HTTPException(status_code=503, detail="MCP server not initialized")
    
    response = await mcp_server.handle_mcp_request(request)
    return response

# Convenience REST endpoints for testing
@app.post("/memory/add")
async def add_memory(messages: List[Dict], user_id: str = "default", metadata: Dict = {}):
    """Add memory - REST endpoint"""
    request = MCPRequest(
        method="memory/add",
        params={"messages": messages, "user_id": user_id, "metadata": metadata}
    )
    response = await mcp_server.handle_mcp_request(request)
    return response

@app.get("/memory/search")
async def search_memory(query: str, user_id: str = "default", limit: int = 5):
    """Search memory - REST endpoint"""
    request = MCPRequest(
        method="memory/search", 
        params={"query": query, "user_id": user_id, "limit": limit}
    )
    response = await mcp_server.handle_mcp_request(request)
    return response

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8765"))
    uvicorn.run(app, host="0.0.0.0", port=port)