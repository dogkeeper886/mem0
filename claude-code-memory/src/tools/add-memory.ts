import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { AddMemorySchema, AddMemoryParams } from '../types/schema.js';
import { MemoryClient } from '../memory/client.js';

export const addMemoryTool: Tool = {
  name: 'add_memory',
  description: 'Add memory from messages',
  inputSchema: {
    type: 'object',
    properties: {
      messages: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of message strings to store as memories'
      },
      user_id: {
        type: 'string',
        description: 'User identifier for the memory',
        default: 'default'
      },
      metadata: {
        type: 'object',
        description: 'Additional metadata to store with the memory',
        default: {}
      }
    },
    required: ['messages']
  }
};

export async function handleAddMemory(
  memoryClient: MemoryClient,
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  // Validate input with Zod
  const params = AddMemorySchema.parse(args);
  
  const result = await memoryClient.addMemory(
    params.messages, 
    params.user_id, 
    params.metadata
  );
  
  return {
    content: [{
      type: 'text',
      text: `Added ${result.length} memories: ${JSON.stringify(result, null, 2)}`
    }]
  };
}