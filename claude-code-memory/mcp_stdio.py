#!/usr/bin/env python3
"""
MCP stdio interface for Claude Code
Bridges stdin/stdout communication to the MCP server
"""

import sys
import json
import asyncio
import httpx
from typing import Dict, Any

class MCPStdioBridge:
    """Bridges stdio communication to MCP server"""
    
    def __init__(self, server_url="http://localhost:8765"):
        self.server_url = server_url
        
    async def process_message(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Process MCP message and forward to server"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.server_url}/mcp",
                    json=message,
                    timeout=30.0
                )
                return response.json()
        except Exception as e:
            return {
                "jsonrpc": "2.0",
                "id": message.get("id"),
                "error": {
                    "code": -32603,
                    "message": f"Internal error: {str(e)}"
                }
            }
    
    async def run(self):
        """Main stdio loop"""
        while True:
            try:
                # Read from stdin
                line = sys.stdin.readline().strip()
                if not line:
                    continue
                
                # Parse JSON message
                message = json.loads(line)
                
                # Process message
                response = await self.process_message(message)
                
                # Write response to stdout
                print(json.dumps(response), flush=True)
                
            except EOFError:
                break
            except json.JSONDecodeError as e:
                # Invalid JSON
                error_response = {
                    "jsonrpc": "2.0",
                    "error": {
                        "code": -32700,
                        "message": f"Parse error: {str(e)}"
                    }
                }
                print(json.dumps(error_response), flush=True)
            except Exception as e:
                # Other errors
                error_response = {
                    "jsonrpc": "2.0",
                    "error": {
                        "code": -32603,
                        "message": f"Internal error: {str(e)}"
                    }
                }
                print(json.dumps(error_response), flush=True)

if __name__ == "__main__":
    bridge = MCPStdioBridge()
    asyncio.run(bridge.run())