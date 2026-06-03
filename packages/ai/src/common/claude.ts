import { spawn } from 'child_process';
import type { CodeIssue } from './types.js';
import chalk from 'chalk';

export interface ClaudeOptions {
  verbose?: boolean;
}

export const analyzeWithClaude = async (
  repoPath: string,
  prompt: string,
  options: ClaudeOptions
): Promise<CodeIssue[]> => {
  const response = await runClaudeExec(repoPath, prompt, options);
  return parseClaudeResponse(response);
};

export const analyzeWithClaudeRaw = async (
  repoPath: string,
  prompt: string,
  options: ClaudeOptions
): Promise<any> => {
  const response = await runClaudeExec(repoPath, prompt, options);
  return parseClaudeResponseRaw(response);
};

const runClaudeExec = (
  repoPath: string,
  prompt: string,
  options: ClaudeOptions
): Promise<string> =>
  new Promise((resolve, reject) => {
    const args = ['-p', '--output-format', 'json', prompt];

    if (options.verbose) {
      console.log(`\n[Claude] Running: claude ${args.slice(0, 3).join(' ')} "<prompt>"`);
      console.log(`[Claude] Working directory: ${repoPath}`);
    }

    const startTime = Date.now();
    const child = spawn('claude', args, { cwd: repoPath, stdio: ['pipe', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      const chunk = data.toString();
      stdout += chunk;
      if (options.verbose) {
        process.stdout.write(chunk);
      } else {
        process.stdout.write(chalk.gray('.'));
      }
    });

    child.stderr.on('data', (data) => {
      const chunk = data.toString();
      stderr += chunk;
      if (options.verbose) process.stderr.write(chunk);
    });

    child.on('close', (code) => {
      if (!options.verbose) console.log();
      console.log(`\n[Claude] Completed in ${((Date.now() - startTime) / 1000).toFixed(1)}s`);

      if (code !== 0) {
        reject(new Error(`Claude review failed (exit ${code}): ${(stderr || stdout || 'Unknown error').slice(0, 500)}`));
        return;
      }
      resolve(stdout);
    });

    child.on('error', (err) => {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        reject(new Error('claude CLI not found. Install Claude Code CLI first: https://code.claude.com'));
        return;
      }
      reject(err);
    });
  });

const mapIssue = (item: any): CodeIssue & Record<string, any> => ({
  filename: item.filename || item.package || 'unknown',
  line: item.line || 0,
  category: item.category || 'functionality',
  severity: item.severity || 'info',
  message: item.message || item.title || item.description,
  suggestion: item.suggestion || item.fixedIn,
  // Preserve vulnerability-specific fields for scan command
  package: item.package,
  version: item.version,
  title: item.title,
  description: item.description,
  fixedIn: item.fixedIn,
  cve: item.cve,
});

const extractItems = (json: any): any[] => {
  if (Array.isArray(json.issues)) return json.issues;
  if (Array.isArray(json.vulnerabilities)) return json.vulnerabilities;
  return [];
};

const extractFixData = (text: string): any | null => {
  const fixMatch = text.match(/\{[\s\S]*"(?:fixes|updatedManifest)"[\s\S]*\}/);
  if (!fixMatch) return null;
  
  try {
    const parsed = JSON.parse(fixMatch[0]);
    if (parsed.fixes || parsed.updatedManifest) return parsed;
  } catch {
    // ignore
  }
  return null;
};

const extractIssuesFromText = (text: string): CodeIssue[] | null => {
  // First check for fix response
  const fixData = extractFixData(text);
  if (fixData) {
    return [{ 
      ...mapIssue({ message: 'Fix response' }), 
      _rawFixData: fixData 
    } as any];
  }

  const jsonMatch = text.match(/\{\s*"(?:issues|vulnerabilities)"\s*:\s*\[[\s\S]*?\]\s*\}/);
  if (!jsonMatch) return null;
  
  try {
    const parsed = JSON.parse(jsonMatch[0]);
    const items = extractItems(parsed);
    if (items.length > 0) {
      return items.filter((item: any) => item.message || item.package || item.title).map(mapIssue);
    }
  } catch {
    // ignore
  }
  return null;
};

const parseClaudeResponse = (response: string): CodeIssue[] => {
  try {
    const parsed = JSON.parse(response);
    const text = parsed.result || parsed.text || response;
    
    // Check for fix response first
    const fixData = extractFixData(typeof text === 'string' ? text : JSON.stringify(text));
    if (fixData) {
      return [{ 
        ...mapIssue({ message: 'Fix response' }), 
        _rawFixData: fixData 
      } as any];
    }
    
    const issues = extractIssuesFromText(text);
    if (issues) return issues;
  } catch {
    // Not valid JSON wrapper
  }

  const issues = extractIssuesFromText(response);
  if (issues) return issues;

  if (response.trim() && !response.includes('"issues"') && !response.includes('"vulnerabilities"')) {
    console.warn(chalk.yellow(`\n⚠ Warning: Claude response does not contain expected format`));
    console.warn(chalk.gray(`  Response preview: ${response.slice(0, 200)}...`));
  }

  return [];
};

const parseClaudeResponseRaw = (response: string): any => {
  try {
    const parsed = JSON.parse(response);
    const text = parsed.result || parsed.text || response;
    
    // Try to parse the text as JSON
    if (typeof text === 'string') {
      try {
        return JSON.parse(text);
      } catch {
        // Text contains JSON somewhere
        const jsonMatch = text.match(/\{[\s\S]*"(?:fixes|updatedManifest|issues|vulnerabilities)"[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }
    }
    
    // If parsed already has the structure we need
    if (parsed.fixes || parsed.updatedManifest) {
      return parsed;
    }
  } catch {
    // Not valid JSON wrapper
  }

  // Try to find JSON in raw response
  const jsonMatch = response.match(/\{[\s\S]*"(?:fixes|updatedManifest|issues|vulnerabilities)"[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      // ignore
    }
  }

  return null;
};
