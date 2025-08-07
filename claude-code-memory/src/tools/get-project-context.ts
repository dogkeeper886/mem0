import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { detectProjectContext } from '../memory/project.js';

export const getProjectContextTool: Tool = {
  name: 'get_project_context',
  description: 'Get the current project context and session information',
  inputSchema: {
    type: 'object',
    properties: {},
    additionalProperties: false
  }
};

export async function handleGetProjectContext(
  memoryClient: any, // Not used for this tool
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const projectContext = detectProjectContext();
  
  const response = {
    current_project: projectContext,
    explanation: {
      project_id: 'Unique identifier for this project (hash of project path)',
      project_path: 'Full filesystem path to the project',
      project_name: 'Name of the project directory',
      git_repo: 'Git repository URL if in a git repo',
      git_branch: 'Current git branch',
      session_id: 'Unique identifier for this Claude Code session'
    },
    note: 'This context is automatically added to all new memories. Use search_memory for current project only, or search_memory_global for all projects.'
  };
  
  return {
    content: [{
      type: 'text',
      text: JSON.stringify(response, null, 2)
    }]
  };
}