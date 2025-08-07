#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import { MemoryConfigManager } from './memory/config.js';
import { MemoryClient } from './memory/client.js';
import { addMemoryTool, handleAddMemory } from './tools/add-memory.js';
import { searchMemoryTool, handleSearchMemory } from './tools/search-memory.js';
import { searchMemoryGlobalTool, handleSearchMemoryGlobal } from './tools/search-memory-global.js';
import { listMemoriesTool, handleListMemories } from './tools/list-memories.js';
import { listProjectMemoriesTool, handleListProjectMemories } from './tools/list-project-memories.js';
import { getProjectContextTool, handleGetProjectContext } from './tools/get-project-context.js';
import { deleteMemoryTool, handleDeleteMemory } from './tools/delete-memory.js';
import { resetMemoryTool, handleResetMemory } from './tools/reset-memory.js';

class MemoryMCPServer {
  private server: Server;
  private memoryClient: MemoryClient;

  constructor() {
    // Initialize server
    this.server = new Server(
      {
        name: 'mem0-memory',
        version: '2.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize memory client with configuration
    const config = MemoryConfigManager.getConfig();
    this.memoryClient = new MemoryClient(config);

    this.setupErrorHandling();
    this.setupRequestHandlers();
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupRequestHandlers(): void {
    // List tools handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          addMemoryTool,
          searchMemoryTool,
          searchMemoryGlobalTool,
          listMemoriesTool,
          listProjectMemoriesTool,
          getProjectContextTool,
          deleteMemoryTool,
          resetMemoryTool,
        ],
      };
    });

    // Tool call handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'add_memory':
            return await handleAddMemory(this.memoryClient, args);

          case 'search_memory':
            return await handleSearchMemory(this.memoryClient, args);

          case 'search_memory_global':
            return await handleSearchMemoryGlobal(this.memoryClient, args);

          case 'list_memories':
            return await handleListMemories(this.memoryClient, args);

          case 'list_project_memories':
            return await handleListProjectMemories(this.memoryClient, args);

          case 'get_project_context':
            return await handleGetProjectContext(this.memoryClient, args);

          case 'delete_memory':
            return await handleDeleteMemory(this.memoryClient, args);

          case 'reset_memory':
            return await handleResetMemory(this.memoryClient, args);

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new Error(`Invalid parameters: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
        }
        throw error;
      }
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    // Log to stderr to avoid interfering with MCP stdio
    console.error('[MCP Memory Server] Server started successfully');
  }
}

// Start the server
async function main() {
  try {
    const server = new MemoryMCPServer();
    await server.run();
  } catch (error) {
    console.error('[MCP Memory Server] Failed to start:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('[MCP Memory Server] Unhandled error:', error);
    process.exit(1);
  });
}