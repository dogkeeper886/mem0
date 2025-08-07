import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { ListMemoriesSchema, ListMemoriesParams } from '../types/schema.js';
import { MemoryClient } from '../memory/client.js';

export const listMemoriesTool: Tool = {
  name: 'list_memories',
  description: 'List all memories for a user',
  inputSchema: {
    type: 'object',
    properties: {
      user_id: {
        type: 'string',
        description: 'User identifier to list memories for',
        default: 'default'
      }
    }
  }
};

export async function handleListMemories(
  memoryClient: MemoryClient,
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  // Validate input with Zod
  const params = ListMemoriesSchema.parse(args);
  
  const results = await memoryClient.getAllMemories(params.user_id);
  
  return {
    content: [{
      type: 'text',
      text: JSON.stringify(results, null, 2)
    }]
  };
}