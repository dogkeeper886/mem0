import { createHash, randomUUID } from 'crypto';
import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

export interface ProjectContext {
  project_path: string;
  project_name: string;
  project_id: string;
  git_repo?: string;
  git_branch?: string;
  session_id: string;
  claude_session_type?: string;
}

/**
 * Detect the current project context based on working directory and git info
 */
export function detectProjectContext(): ProjectContext {
  const cwd = process.cwd();
  const projectName = path.basename(cwd);
  const projectId = createHash('md5').update(cwd).digest('hex').substring(0, 8);
  
  return {
    project_path: cwd,
    project_name: projectName,
    project_id: projectId,
    git_repo: getGitRemoteUrl(cwd),
    git_branch: getGitBranch(cwd),
    session_id: process.env.CLAUDE_SESSION_ID || generateSessionId(),
    claude_session_type: process.env.CLAUDE_SESSION_TYPE || 'general'
  };
}

/**
 * Get git remote URL if in a git repository
 */
function getGitRemoteUrl(projectPath: string): string | undefined {
  try {
    const gitRoot = findGitRoot(projectPath);
    if (!gitRoot) return undefined;
    
    const remoteUrl = execSync('git remote get-url origin', { 
      cwd: gitRoot, 
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
    
    // Clean up the URL for privacy/security
    return cleanGitUrl(remoteUrl);
  } catch {
    return undefined;
  }
}

/**
 * Get current git branch if in a git repository
 */
function getGitBranch(projectPath: string): string | undefined {
  try {
    const gitRoot = findGitRoot(projectPath);
    if (!gitRoot) return undefined;
    
    const branch = execSync('git branch --show-current', { 
      cwd: gitRoot, 
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
    
    return branch || 'main';
  } catch {
    return undefined;
  }
}

/**
 * Find the git root directory by walking up the directory tree
 */
function findGitRoot(startPath: string): string | undefined {
  let currentPath = startPath;
  
  while (currentPath !== path.dirname(currentPath)) {
    if (fs.existsSync(path.join(currentPath, '.git'))) {
      return currentPath;
    }
    currentPath = path.dirname(currentPath);
  }
  
  return undefined;
}

/**
 * Clean git URL for storage (remove credentials, normalize format)
 */
function cleanGitUrl(url: string): string {
  try {
    // Remove credentials from HTTPS URLs
    url = url.replace(/https:\/\/[^@]+@/, 'https://');
    
    // Convert SSH to HTTPS format for consistency
    url = url.replace(/git@github\.com:(.+)\.git$/, 'https://github.com/$1');
    url = url.replace(/git@gitlab\.com:(.+)\.git$/, 'https://gitlab.com/$1');
    
    // Remove .git suffix
    url = url.replace(/\.git$/, '');
    
    return url;
  } catch {
    return url;
  }
}

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  const timestamp = new Date().toISOString().slice(0, 19); // YYYY-MM-DDTHH:mm:ss
  const shortUuid = randomUUID().substring(0, 8);
  return `${timestamp}_${shortUuid}`;
}

/**
 * Override project context for special cases
 */
export function overrideProjectContext(overrides: Partial<ProjectContext>): ProjectContext {
  const baseContext = detectProjectContext();
  return { ...baseContext, ...overrides };
}

/**
 * Create a project-specific collection name
 */
export function getProjectCollectionName(projectContext?: ProjectContext): string {
  const context = projectContext || detectProjectContext();
  return `claude_code_memory_${context.project_id}`;
}

/**
 * Check if we're in a known project type
 */
export function detectProjectType(projectPath: string): string {
  const packageJsonPath = path.join(projectPath, 'package.json');
  const cargoTomlPath = path.join(projectPath, 'Cargo.toml');
  const pyprojectTomlPath = path.join(projectPath, 'pyproject.toml');
  const requirementsPath = path.join(projectPath, 'requirements.txt');
  const goModPath = path.join(projectPath, 'go.mod');
  
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      if (packageJson.dependencies?.react || packageJson.devDependencies?.react) {
        return 'react';
      }
      if (packageJson.dependencies?.next || packageJson.devDependencies?.next) {
        return 'nextjs';
      }
      if (packageJson.dependencies?.vue || packageJson.devDependencies?.vue) {
        return 'vue';
      }
      return 'nodejs';
    } catch {
      return 'nodejs';
    }
  }
  
  if (fs.existsSync(cargoTomlPath)) return 'rust';
  if (fs.existsSync(pyprojectTomlPath) || fs.existsSync(requirementsPath)) return 'python';
  if (fs.existsSync(goModPath)) return 'go';
  
  return 'unknown';
}