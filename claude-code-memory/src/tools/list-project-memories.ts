import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { MemoryClient } from '../memory/client.js';
import { detectProjectContext } from '../memory/project.js';

export const listProjectMemoriesTool: Tool = {
  name: 'list_project_memories',
  description: 'List all memories for a specific project',
  inputSchema: {
    type: 'object',
    properties: {
      project_id: {
        type: 'string',
        description: 'Project ID to list memories for (if not provided, uses current project)'
      },
      user_id: {
        type: 'string',
        description: 'User identifier to list memories for',
        default: 'default'
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results to return',
        minimum: 1,
        maximum: 100,
        default: 20
      }
    }
  }
};

export async function handleListProjectMemories(
  memoryClient: MemoryClient,
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const params = args as { project_id?: string; user_id?: string; limit?: number };
  
  let projectId = params.project_id;
  let projectScope: 'current' | 'project' = 'current';
  
  // If no project_id provided, use current project
  if (!projectId) {
    const projectContext = detectProjectContext();
    projectId = projectContext.project_id;
    projectScope = 'current';
  } else {
    projectScope = 'project';
  }
  
  // Use search with empty query to get all memories for the project
  const results = await memoryClient.searchMemoryWithProject(
    '', // Empty query gets all results
    params.user_id || 'default',
    params.limit || 20,
    projectScope,
    projectId
  );
  
  // Group by session for better organization
  const sessionGroups: Record<string, any[]> = {};
  results.forEach(result => {
    const sessionId = result.metadata?.session_id || 'unknown';
    if (!sessionGroups[sessionId]) {
      sessionGroups[sessionId] = [];
    }
    sessionGroups[sessionId].push(result);
  });
  
  const firstResult = results[0];
  const response = {
    project_id: projectId,
    total_memories: results.length,
    sessions: Object.keys(sessionGroups).length,
    memories_by_session: sessionGroups,
    project_info: results.length > 0 && firstResult?.metadata ? {
      project_name: firstResult.metadata.project_name || 'unknown',
      project_path: firstResult.metadata.project_path || 'unknown',
      git_repo: firstResult.metadata.git_repo || null
    } : null
  };
  
  return {
    content: [{
      type: 'text',
      text: JSON.stringify(response, null, 2)
    }]
  };
}