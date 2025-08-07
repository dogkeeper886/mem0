import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { ResetMemorySchema, ResetMemoryParams } from '../types/schema.js';
import { MemoryClient } from '../memory/client.js';

export const resetMemoryTool: Tool = {
  name: 'reset_memory',
  description: 'Reset all memories for a user',
  inputSchema: {
    type: 'object',
    properties: {
      user_id: {
        type: 'string',
        description: 'User identifier to reset memories for',
        default: 'default'
      }
    }
  }
};

export async function handleResetMemory(
  memoryClient: MemoryClient,
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  // Validate input with Zod
  const params = ResetMemorySchema.parse(args);
  
  await memoryClient.resetMemory(params.user_id);
  
  return {
    content: [{
      type: 'text',
      text: `Reset all memories for user: ${params.user_id}`
    }]
  };
}