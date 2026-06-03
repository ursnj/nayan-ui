import { spawn } from 'child_process';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import type { PRInfo, PullRequest, PullRequestFile, FileChange, ReviewComment, RepoInfo } from './types.js';

export interface ClonedRepo {
  path: string;
  cleanup: () => Promise<void>;
}

export interface GitHubConfig {
  token: string;
  githubUrl?: string;
}

const getApiBase = (githubUrl?: string): string =>
  githubUrl ? `${githubUrl.replace(/\/$/, '')}/api/v3` : 'https://api.github.com';

const githubFetch = async <T>(
  config: GitHubConfig,
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = `${getApiBase(config.githubUrl)}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': `Bearer ${config.token}`,
      'User-Agent': 'nayan-ai',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API error (${response.status}): ${body}`);
  }

  return response.json() as Promise<T>;
};

export const getPullRequest = (config: GitHubConfig, pr: PRInfo): Promise<PullRequest> =>
  githubFetch<PullRequest>(config, `/repos/${pr.owner}/${pr.repo}/pulls/${pr.number}`);

export const getPullRequestFiles = (config: GitHubConfig, pr: PRInfo): Promise<PullRequestFile[]> =>
  githubFetch<PullRequestFile[]>(config, `/repos/${pr.owner}/${pr.repo}/pulls/${pr.number}/files?per_page=100`);

export const postReview = async (
  config: GitHubConfig,
  pr: PRInfo,
  commitId: string,
  body: string,
  comments: ReviewComment[]
): Promise<void> => {
  await githubFetch(config, `/repos/${pr.owner}/${pr.repo}/pulls/${pr.number}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      commit_id: commitId,
      body,
      event: 'COMMENT',
      comments,
    }),
  });
};

export const postComment = async (
  config: GitHubConfig,
  pr: PRInfo,
  body: string
): Promise<void> => {
  await githubFetch(config, `/repos/${pr.owner}/${pr.repo}/issues/${pr.number}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body }),
  });
};

export const parseFiles = (files: PullRequestFile[]): FileChange[] =>
  files
    .filter((f): f is PullRequestFile & { patch: string } => !!f.patch)
    .map((f) => ({
      filename: f.filename,
      patch: f.patch,
    }));

export const parsePRReference = (input: string): PRInfo & { githubUrl?: string } => {
  const urlMatch = input.match(/^(https?:\/\/[^/]+)\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
  if (urlMatch) {
    const baseUrl = urlMatch[1];
    const isEnterprise = !baseUrl.match(/^https?:\/\/(www\.)?github\.com$/i);
    return {
      owner: urlMatch[2],
      repo: urlMatch[3],
      number: parseInt(urlMatch[4], 10),
      githubUrl: isEnterprise ? baseUrl : undefined,
    };
  }

  const shortMatch = input.match(/^([^/]+)\/([^#]+)#(\d+)$/);
  if (shortMatch) {
    return {
      owner: shortMatch[1],
      repo: shortMatch[2],
      number: parseInt(shortMatch[3], 10),
    };
  }

  throw new Error(
    'Invalid PR reference. Use:\n' +
    '  - https://github.com/owner/repo/pull/123\n' +
    '  - owner/repo#123'
  );
};

export const parseRepoReference = (input: string): RepoInfo => {
  const urlMatch = input.match(/^(https?:\/\/[^/]+)\/([^/]+)\/([^/]+?)(?:\.git)?$/);
  if (urlMatch) {
    const baseUrl = urlMatch[1];
    const isEnterprise = !baseUrl.match(/^https?:\/\/(www\.)?github\.com$/i);
    return {
      owner: urlMatch[2],
      repo: urlMatch[3],
      githubUrl: isEnterprise ? baseUrl : undefined,
    };
  }

  const shortMatch = input.match(/^([^/]+)\/([^/]+)$/);
  if (shortMatch) {
    return {
      owner: shortMatch[1],
      repo: shortMatch[2],
    };
  }

  throw new Error(
    'Invalid repo reference. Use:\n' +
    '  - https://github.com/owner/repo\n' +
    '  - owner/repo'
  );
};

export const cloneRepo = async (
  prInfo: PRInfo,
  token: string,
  githubUrl?: string
): Promise<ClonedRepo> => {
  const tempDir = await mkdtemp(join(tmpdir(), 'nayan-ai-'));
  const baseUrl = githubUrl?.replace(/\/$/, '') || 'https://github.com';
  const cloneUrl = `https://${token}@${baseUrl.replace(/^https?:\/\//, '')}/${prInfo.owner}/${prInfo.repo}.git`;

  await runGit(['clone', '--depth', '100', cloneUrl, tempDir]);
  await runGit(['fetch', 'origin', 'main:refs/remotes/origin/main', '--depth', '100'], tempDir);
  await runGit(['fetch', 'origin', `pull/${prInfo.number}/head:pr-branch`], tempDir);
  await runGit(['checkout', 'pr-branch'], tempDir);

  return {
    path: tempDir,
    cleanup: async () => {
      try {
        await rm(tempDir, { recursive: true, force: true });
      } catch {
        // ignore
      }
    },
  };
};

export const cloneRepoForScan = async (
  repoInfo: RepoInfo,
  token: string
): Promise<ClonedRepo> => {
  const tempDir = await mkdtemp(join(tmpdir(), 'nayan-ai-scan-'));
  const baseUrl = repoInfo.githubUrl?.replace(/\/$/, '') || 'https://github.com';
  const cloneUrl = `https://${token}@${baseUrl.replace(/^https?:\/\//, '')}/${repoInfo.owner}/${repoInfo.repo}.git`;

  await runGit(['clone', '--depth', '1', cloneUrl, tempDir]);

  return {
    path: tempDir,
    cleanup: async () => {
      try {
        await rm(tempDir, { recursive: true, force: true });
      } catch {
        // ignore
      }
    },
  };
};

export const getGitDiff = (repoPath: string): Promise<string> =>
  runGit(['diff', 'origin/main...HEAD', '--unified=3'], repoPath);

export const getChangedFiles = async (repoPath: string): Promise<string[]> => {
  const output = await runGit(['diff', 'origin/main...HEAD', '--name-only'], repoPath);
  return output.split('\n').filter(Boolean);
};

const runGit = (args: string[], cwd?: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const child = spawn('git', args, { cwd, stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => { stdout += data.toString(); });
    child.stderr.on('data', (data) => { stderr += data.toString(); });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`git ${args[0]} failed: ${stderr || stdout || 'Unknown error'}`));
        return;
      }
      resolve(stdout);
    });

    child.on('error', reject);
  });
