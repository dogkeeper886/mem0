import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { SearchMemorySchema, SearchMemoryParams } from '../types/schema.js';
import { MemoryClient } from '../memory/client.js';

export const searchMemoryTool: Tool = {
  name: 'search_memory',
  description: 'Search memories by query',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query to find relevant memories'
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

export async function handleSearchMemory(
  memoryClient: MemoryClient,
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  // Validate input with Zod
  const params = SearchMemorySchema.parse(args);
  
  const results = await memoryClient.searchMemory(
    params.query,
    params.user_id,
    params.limit
  );
  
  return {
    content: [{
      type: 'text',
      text: JSON.stringify(results, null, 2)
    }]
  };
}