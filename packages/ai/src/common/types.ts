export interface PRInfo {
  owner: string;
  repo: string;
  number: number;
  githubUrl?: string;
}

export interface PullRequest {
  number: number;
  title: string;
  head: {
    sha: string;
  };
}

export interface PullRequestFile {
  filename: string;
  status: string;
  patch?: string;
}

export interface FileChange {
  filename: string;
  patch: string;
}

export interface CodeIssue {
  filename: string;
  line: number;
  category: 'functionality' | 'readability' | 'performance';
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
}

export interface ReviewComment {
  path: string;
  line: number;
  side: 'RIGHT';
  body: string;
}

export type LLMProvider = 'codex' | 'claude';

export interface ReviewOptions {
  token: string;
  verbose: boolean;
  dry: boolean;
  inline: boolean;
  format: string;
  llm: LLMProvider;
}

export interface RepoInfo {
  owner: string;
  repo: string;
  githubUrl?: string;
}

export interface ScanOptions {
  token: string;
  paths?: string;
  format: string;
  llm: LLMProvider;
  verbose?: boolean;
  fix?: boolean;
  branch?: string;
}

export interface Vulnerability {
  package: string;
  version: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description?: string;
  fixedIn?: string;
  cve?: string;
}

export interface ProjectScanResult {
  projectPath: string;
  projectType: ProjectType;
  vulnerabilities: Vulnerability[];
}

export type ProjectType = 'npm' | 'python' | 'go' | 'rust' | 'ruby' | 'php' | 'java' | 'dotnet' | 'scala';

export interface DetectedProject {
  path: string;
  type: ProjectType;
  lockFile?: string;
}
