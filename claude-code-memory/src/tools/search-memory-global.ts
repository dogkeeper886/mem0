import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { MemoryClient } from '../memory/client.js';

export const searchMemoryGlobalTool: Tool = {
  name: 'search_memory_global',
  description: 'Search memories across all projects (global scope)',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query to find relevant memories across all projects'
      },
      user_id: {
        type: 'string',
        description: 'User identifier for the memory search',
        default: 'default'
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results to return',
        minimum: 1,
        maximum: 50,
        default: 5
      }
    },
    required: ['query']
  }
};

export async function handleSearchMemoryGlobal(
  memoryClient: MemoryClient,
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const params = args as { query: string; user_id?: string; limit?: number };
  
  const results = await memoryClient.searchMemoryWithProject(
    params.query,
    params.user_id || 'default',
    params.limit || 5,
    'global' // Global scope - search all projects
  );
  
  // Add project context to results for clarity
  const enhancedResults = results.map(result => ({
    ...result,
    project_context: {
      project_name: result.metadata?.project_name || 'unknown',
      project_id: result.metadata?.project_id || 'unknown',
      session_id: result.metadata?.session_id || 'unknown'
    }
  }));
  
  return {
    content: [{
      type: 'text',
      text: JSON.stringify(enhancedResults, null, 2)
    }]
  };
}