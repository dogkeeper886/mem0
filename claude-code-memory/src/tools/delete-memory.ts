import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { DeleteMemorySchema, DeleteMemoryParams } from '../types/schema.js';
import { MemoryClient } from '../memory/client.js';

export const deleteMemoryTool: Tool = {
  name: 'delete_memory',
  description: 'Delete a specific memory by ID',
  inputSchema: {
    type: 'object',
    properties: {
      memory_id: {
        type: 'string',
        description: 'The ID of the memory to delete'
      }
    },
    required: ['memory_id']
  }
};

export async function handleDeleteMemory(
  memoryClient: MemoryClient,
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  // Validate input with Zod
  const params = DeleteMemorySchema.parse(args);
  
  await memoryClient.deleteMemory(params.memory_id);
  
  return {
    content: [{
      type: 'text',
      text: `Memory ${params.memory_id} deleted successfully`
    }]
  };
}