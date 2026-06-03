import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import type { Vulnerability, ProjectType, DetectedProject, RepoInfo, ScanOptions } from '../common/types.js';
import { analyzeWithCodexRaw } from '../common/codex.js';
import { analyzeWithClaudeRaw } from '../common/claude.js';
import { getFixPrompt } from './prompt.js';

export interface FixResult {
  project: DetectedProject;
  fixes: Fix[];
  updatedFiles: UpdatedFile[];
  summary: string;
  breakingChanges: string[];
}

export interface Fix {
  type: 'update' | 'remove' | 'add';
  package: string;
  from?: string;
  to?: string;
  version?: string;
  reason: string;
}

export interface UpdatedFile {
  path: string;
  content: string;
}

const MANIFEST_FILES: Record<ProjectType, string> = {
  npm: 'package.json',
  python: 'requirements.txt',
  go: 'go.mod',
  rust: 'Cargo.toml',
  ruby: 'Gemfile',
  php: 'composer.json',
  java: 'pom.xml',
  dotnet: '*.csproj',
  scala: 'build.sbt',
};

const getManifestPath = (project: DetectedProject): string | null => {
  const manifestName = MANIFEST_FILES[project.type];
  
  if (manifestName.includes('*')) {
    const ext = manifestName.replace('*', '');
    const files = fs.readdirSync(project.path);
    const match = files.find(f => f.endsWith(ext));
    if (match) return path.join(project.path, match);
    return null;
  }

  const manifestPath = path.join(project.path, manifestName);
  return fs.existsSync(manifestPath) ? manifestPath : null;
};

export const fixVulnerabilities = async (
  project: DetectedProject,
  vulnerabilities: Vulnerability[],
  options: ScanOptions
): Promise<FixResult | null> => {
  if (vulnerabilities.length === 0) return null;

  const manifestPath = getManifestPath(project);
  if (!manifestPath) {
    console.log(chalk.yellow(`  No manifest file found for ${project.type} project`));
    return null;
  }

  const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
  const prompt = getFixPrompt(project.type, manifestContent, vulnerabilities);
  const llmOptions = { verbose: options.verbose };

  try {
    // Use raw response parser for fix generation - we need the full JSON, not CodeIssue[]
    const response = options.llm === 'claude'
      ? await analyzeWithClaudeRaw(project.path, prompt, llmOptions)
      : await analyzeWithCodexRaw(project.path, prompt, llmOptions);

    // Parse the fix response
    const fixData = parseFixResponse(response);
    
    if (!fixData || !fixData.updatedManifest) {
      if (options.verbose) {
        console.log(chalk.gray(`  Raw response: ${JSON.stringify(response).slice(0, 500)}`));
      }
      console.log(chalk.yellow(`  Could not parse fix response`));
      return null;
    }

    return {
      project,
      fixes: fixData.fixes || [],
      updatedFiles: [{
        path: manifestPath,
        content: fixData.updatedManifest,
      }],
      summary: fixData.summary || 'Security fixes applied',
      breakingChanges: fixData.breakingChanges || [],
    };
  } catch (error) {
    console.log(chalk.red(`  Fix generation failed: ${error instanceof Error ? error.message : String(error)}`));
    return null;
  }
};

const parseFixResponse = (response: any): any => {
  // Response comes as CodeIssue[] with extra fields
  // Try to find the fix data in the response
  if (Array.isArray(response) && response.length > 0) {
    // Check each item for fix data
    for (const item of response) {
      // Check for _rawFixData field (added by Codex/Claude parser)
      if (item._rawFixData) return item._rawFixData;
      
      if (item.updatedManifest) return item;
      
      // Try to parse message field as JSON
      if (item.message) {
        try {
          const parsed = JSON.parse(item.message);
          if (parsed.updatedManifest || parsed.fixes) return parsed;
        } catch {
          // Try to extract JSON from message text
          const jsonMatch = item.message.match(/\{[\s\S]*"(?:fixes|updatedManifest)"[\s\S]*\}/);
          if (jsonMatch) {
            try {
              const parsed = JSON.parse(jsonMatch[0]);
              if (parsed.updatedManifest || parsed.fixes) return parsed;
            } catch {
              // Not valid JSON
            }
          }
        }
      }
      
      // Check description field too
      if (item.description) {
        try {
          const parsed = JSON.parse(item.description);
          if (parsed.updatedManifest || parsed.fixes) return parsed;
        } catch {
          const jsonMatch = item.description.match(/\{[\s\S]*"(?:fixes|updatedManifest)"[\s\S]*\}/);
          if (jsonMatch) {
            try {
              const parsed = JSON.parse(jsonMatch[0]);
              if (parsed.updatedManifest || parsed.fixes) return parsed;
            } catch {
              // Not valid JSON
            }
          }
        }
      }
      
      // Check all string fields for JSON
      for (const [key, value] of Object.entries(item)) {
        if (typeof value === 'string' && value.includes('{')) {
          try {
            const parsed = JSON.parse(value);
            if (parsed.updatedManifest || parsed.fixes) return parsed;
          } catch {
            // Try regex extraction
            const jsonMatch = value.match(/\{[\s\S]*"(?:fixes|updatedManifest)"[\s\S]*\}/);
            if (jsonMatch) {
              try {
                const parsed = JSON.parse(jsonMatch[0]);
                if (parsed.updatedManifest || parsed.fixes) return parsed;
              } catch {
                // Not valid JSON
              }
            }
          }
        }
      }
    }
  }
  
  // Try parsing as direct object
  if (response && typeof response === 'object' && response.updatedManifest) {
    return response;
  }
  
  // If response is a string, try to parse it
  if (typeof response === 'string') {
    try {
      const parsed = JSON.parse(response);
      if (parsed.updatedManifest || parsed.fixes) return parsed;
    } catch {
      const jsonMatch = response.match(/\{[\s\S]*"(?:fixes|updatedManifest)"[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.updatedManifest || parsed.fixes) return parsed;
        } catch {
          // Not valid JSON
        }
      }
    }
  }

  return null;
};

export const applyFixes = (
  repoPath: string,
  fixResults: FixResult[]
): void => {
  for (const result of fixResults) {
    for (const file of result.updatedFiles) {
      const relativePath = path.relative(repoPath, file.path);
      console.log(chalk.cyan(`  Writing: ${relativePath}`));
      fs.writeFileSync(file.path, file.content, 'utf-8');
    }
  }
};

export const createFixBranch = (
  repoPath: string,
  branchName: string
): void => {
  execSync(`git checkout -b ${branchName}`, { cwd: repoPath, stdio: 'pipe' });
};

export const commitFixes = (
  repoPath: string,
  fixResults: FixResult[]
): void => {
  // Stage all changed files
  for (const result of fixResults) {
    for (const file of result.updatedFiles) {
      execSync(`git add "${file.path}"`, { cwd: repoPath, stdio: 'pipe' });
    }
  }

  // Create commit message
  const totalFixes = fixResults.reduce((sum, r) => sum + r.fixes.length, 0);
  const commitMsg = `fix(security): apply ${totalFixes} vulnerability fixes

${fixResults.map(r => `## ${r.project.type} (${path.basename(r.project.path)})
${r.summary}

Changes:
${r.fixes.map(f => `- ${f.type}: ${f.package}${f.from ? ` ${f.from}` : ''}${f.to ? ` → ${f.to}` : ''}`).join('\n')}
`).join('\n')}

Generated by Nayan AI`;

  execSync(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`, { cwd: repoPath, stdio: 'pipe' });
};

export const pushBranch = (
  repoPath: string,
  branchName: string,
  token: string,
  repoInfo: RepoInfo
): void => {
  const remoteUrl = repoInfo.githubUrl 
    ? `https://${token}@${repoInfo.githubUrl.replace('https://', '')}/${repoInfo.owner}/${repoInfo.repo}.git`
    : `https://${token}@github.com/${repoInfo.owner}/${repoInfo.repo}.git`;
  
  execSync(`git push "${remoteUrl}" ${branchName}`, { cwd: repoPath, stdio: 'pipe' });
};

export const createPullRequest = async (
  token: string,
  repoInfo: RepoInfo,
  branchName: string,
  fixResults: FixResult[]
): Promise<{ number: number; url: string }> => {
  const baseUrl = repoInfo.githubUrl || 'https://api.github.com';
  const apiUrl = baseUrl.includes('api.github.com') 
    ? baseUrl 
    : `${baseUrl}/api/v3`;

  const totalVulns = fixResults.reduce((sum, r) => sum + r.fixes.length, 0);
  const criticalCount = fixResults.reduce((sum, r) => 
    sum + r.fixes.filter(f => f.reason.toLowerCase().includes('critical')).length, 0);

  const title = `🔒 Security: Fix ${totalVulns} vulnerabilities`;
  
  const body = `## 🤖 Automated Security Fixes by Nayan AI

This PR contains automated fixes for security vulnerabilities detected in your dependencies.

### Summary
- **Total fixes:** ${totalVulns}
- **Projects affected:** ${fixResults.length}

### Changes by Project

${fixResults.map(r => `
#### 📦 ${r.project.type.toUpperCase()} - ${path.basename(r.project.path)}

${r.summary}

| Type | Package | Change | Reason |
|------|---------|--------|--------|
${r.fixes.map(f => `| ${f.type} | \`${f.package}\` | ${f.from ? `${f.from} → ${f.to || 'removed'}` : f.version || '-'} | ${f.reason} |`).join('\n')}

${r.breakingChanges.length > 0 ? `
⚠️ **Potential Breaking Changes:**
${r.breakingChanges.map(c => `- ${c}`).join('\n')}
` : ''}
`).join('\n')}

### Recommended Actions
1. Review the changes carefully
2. Run your test suite to ensure nothing is broken
3. Check for any breaking changes mentioned above
4. Merge when ready

---
*Generated automatically by [Nayan AI](https://github.com/nayan-ai/nayan-ai)*
`;

  const response = await fetch(`${apiUrl}/repos/${repoInfo.owner}/${repoInfo.repo}/pulls`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title,
      body,
      head: branchName,
      base: 'main',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create PR: ${response.status} ${error}`);
  }

  const pr = await response.json() as { number: number; html_url: string };
  return { number: pr.number, url: pr.html_url };
};

export const runFixWorkflow = async (
  repoPath: string,
  repoInfo: RepoInfo,
  fixResults: FixResult[],
  options: ScanOptions
): Promise<void> => {
  if (fixResults.length === 0) {
    console.log(chalk.yellow('\n  No fixes to apply'));
    return;
  }

  const branchName = options.branch || 'nayan-ai/security-fixes';
  let spinner = ora('Creating fix branch...').start();

  try {
    createFixBranch(repoPath, branchName);
    spinner.succeed(`Created branch: ${branchName}`);

    spinner = ora('Applying fixes...').start();
    applyFixes(repoPath, fixResults);
    spinner.succeed('Fixes applied');

    spinner = ora('Committing changes...').start();
    commitFixes(repoPath, fixResults);
    spinner.succeed('Changes committed');

    spinner = ora('Pushing to remote...').start();
    pushBranch(repoPath, branchName, options.token, repoInfo);
    spinner.succeed('Pushed to remote');

    spinner = ora('Creating Pull Request...').start();
    const pr = await createPullRequest(options.token, repoInfo, branchName, fixResults);
    spinner.succeed(`Pull Request created: #${pr.number}`);

    console.log(chalk.green(`\n✅ Fix PR created successfully!`));
    console.log(chalk.cyan(`   ${pr.url}`));
  } catch (error) {
    spinner.fail('Fix workflow failed');
    throw error;
  }
};
