# Product Requirements Document: MCP Memory Server Migration

## Overview
**COMPLETED**: Successfully migrated from manual MCP server to official Anthropic MCP SDK implementation for better maintainability and protocol compliance.

## Migration Results
- **✅ COMPLETE**: Migrated from manual implementation (496 lines) to MCP SDK (~200 lines)
- **60% code reduction achieved** - eliminated manual protocol handling
- **All 5 memory tools functional** - add, search, list, delete, reset memories
- **Docker containerized** - Node.js with TypeScript + Ollama + Qdrant integration
- **Version 2.0.0** - Production ready with official MCP SDK

## Migration Goals
- **60% code reduction** - eliminate manual protocol handling
- **Framework-based** - use official @modelcontextprotocol/sdk
- **Type safety** - Zod schemas for validation
- **Future-proof** - automatic protocol updates
- **Same functionality** - all existing tools and Docker setup

## Framework Selection: Official MCP SDK

### Why Official SDK?
1. **Official support** - maintained by Anthropic
2. **Protocol guarantee** - automatic compliance
3. **Type safety** - Zod schema validation
4. **Active development** - regular updates
5. **Docker compatible** - zero config changes needed

### Core Benefits
- **Automatic JSON-RPC handling** - no manual message parsing
- **Built-in error handling** - proper MCP error responses
- **Schema validation** - catch errors at compile time
- **Transport abstraction** - stdio handled by framework
- **Debugging tools** - MCP inspector integration

## New Architecture
```
Claude Code → MCP SDK → Memory Tools → Ollama (External URL)
                ↓           ↓
           Transport    Qdrant (Docker)
           (stdio)
```

## Migration Plan

### Phase 1: Framework Setup (1-2 hours)
```bash
# Install MCP SDK
npm install @modelcontextprotocol/sdk zod
npm install --save-dev tsx typescript @types/node

# Update package.json
{
  "type": "module",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js", 
    "dev": "tsx watch src/index.ts"
  }
}
```

### Phase 2: Core Server Migration (2-3 hours)
**Before (Manual - 496 lines):**
```javascript
class MCPServer {
  async handleRequest(request) {
    // Manual JSON-RPC parsing
    const { method, params, id } = request;
    switch (method) {
      case 'tools/list': /* manual response */ break;
      case 'tools/call': /* manual handling */ break;
    }
  }
}
```

**After (SDK - ~200 lines):**
```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new McpServer({
  name: "mem0-memory",
  version: "1.0.0"
});

// Register tools with schemas
server.registerTool("add_memory", schema, handler);

// Connect transport
const transport = new StdioServerTransport();
await server.connect(transport);
```

### Phase 3: Tool Migration (3-4 hours)
Convert each tool with Zod schemas:

```typescript
// add_memory tool
server.registerTool(
  "add_memory",
  {
    description: "Add memory from messages",
    inputSchema: {
      messages: z.array(z.string()),
      user_id: z.string().optional().default('default'),
      metadata: z.object({}).optional().default({})
    }
  },
  async ({ messages, user_id, metadata }) => {
    const result = await memory.addMemory(messages, user_id, metadata);
    return { 
      content: [{ 
        type: "text", 
        text: `Added memories: ${JSON.stringify(result)}` 
      }] 
    };
  }
);
```

### Phase 4: Testing & Validation (1-2 hours)
```bash
# Test with MCP Inspector
npx @modelcontextprotocol/inspector dist/index.js

# Docker build and test
docker build -t claude-code-memory-mcp-server-v2 .
claude mcp add mem0-memory -- docker run --rm -i claude-code-memory-mcp-server-v2
```

## File Structure Changes
```
src/
├── index.ts              # Main server (was mcp_server.js)
├── memory/
│   ├── client.ts         # Memory operations
│   └── config.ts         # Configuration
├── tools/
│   ├── add-memory.ts     # Individual tool handlers
│   ├── search-memory.ts
│   └── ...
└── types/
    └── schema.ts         # Zod schemas
```

## Migration Benefits

### Code Metrics
| Aspect | Current Manual | With MCP SDK | Improvement |
|--------|---------------|--------------|-------------|
| **Lines of Code** | 496 lines | ~200 lines | **60% reduction** |
| **Protocol Handling** | Manual JSON-RPC | Automatic | **Zero maintenance** |
| **Schema Validation** | Manual checks | Zod schemas | **Type safety** |
| **Error Handling** | Custom format | MCP standard | **Compliance** |
| **Testing** | Custom tools | MCP Inspector | **Standard tooling** |

### Maintenance Advantages
- **Future protocol updates** - handled automatically by SDK
- **Error reduction** - type safety prevents runtime issues  
- **Debugging** - built-in MCP inspector and logging
- **Documentation** - self-documenting schemas
- **Community** - standard patterns and examples

## Risk Assessment

### Migration Risks
- **Schema changes** - current loose typing vs strict Zod validation
- **Error format** - ensure SDK errors match expected responses
- **Memory initialization** - lazy loading compatibility with SDK lifecycle
- **Docker complexity** - TypeScript compilation in container

### Mitigation Strategies
- **Gradual migration** - tool-by-tool conversion
- **Parallel testing** - old vs new implementation
- **Schema iteration** - start permissive, tighten gradually
- **Rollback plan** - keep current implementation as backup

## Implementation Timeline ✅ COMPLETED

### ✅ Week 1: Foundation (8-10 hours) - COMPLETED
- [x] Framework setup and TypeScript configuration
- [x] Core server migration to MCP SDK
- [x] Docker build pipeline updates
- [x] Basic smoke tests

### ✅ Week 2: Tool Migration (10-12 hours) - COMPLETED
- [x] Convert `add_memory` tool with Zod schema
- [x] Convert `search_memory` with validation
- [x] Convert `list_memories`, `delete_memory`, `reset_memory`
- [x] Memory client integration testing

### ✅ Week 3: Testing & Polish (6-8 hours) - COMPLETED
- [x] MCP Inspector integration
- [x] Error handling validation  
- [x] Performance comparison
- [x] Documentation updates
- [x] Claude Code integration testing

## Success Criteria ✅ ACHIEVED
- **✅ Functional parity** - all 5 tools work identically
- **✅ Code reduction** - achieved 60%+ line reduction (496 → ~200 lines)
- **✅ Type safety** - zero TypeScript errors with strict configuration
- **✅ MCP compliance** - using official MCP SDK ensures full compliance
- **✅ Docker compatibility** - same deployment commands work
- **✅ Performance** - improved response times with SDK optimizations
- **✅ Maintainability** - much easier to add new tools with structured framework

## Configuration (Unchanged)
Same Docker deployment model:
```bash
# Add server (command unchanged)
claude mcp add mem0-memory -- docker run --rm -i \
  --name mem0-memory-mcp --network host \
  -e OLLAMA_URL=http://192.168.4.114:11434 \
  claude-code-memory-mcp-server

# Environment variables (unchanged)
OLLAMA_URL, OLLAMA_MODEL, EMBED_MODEL, QDRANT_HOST
```

## Decision Points

### Go/No-Go Criteria
✅ **Go** if:
- Current server works and is stable (✓ achieved)
- Team has TypeScript experience 
- 1-2 weeks available for migration
- Maintenance burden is significant concern

❌ **No-Go** if:
- Current server has active bugs to fix first
- No TypeScript experience on team
- Timeline pressure for new features
- Migration effort exceeds maintenance savings

### Framework Alternatives Considered
- **Official MCP SDK** - ⭐ Recommended (official support)
- **MCP-Framework** - Good alternative (more opinionated)
- **Custom framework** - Not recommended (reinventing wheel)
- **Stay manual** - Not recommended (maintenance burden)

## Next Steps ✅ COMPLETED
1. **✅ Reviewed and approved** migration plan
2. **✅ Timeline completed** ahead of schedule
3. **✅ Migration completed** successfully to main branch
4. **✅ All phases completed** - framework, tools, testing
5. **✅ Production deployment** ready with v2.0.0

## Current Status: PRODUCTION READY
The MCP memory server migration is **complete and deployed**. The new TypeScript-based implementation using the official MCP SDK is now the production version (v2.0.0).