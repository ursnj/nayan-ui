import { spawn } from 'child_process';
import { type CodexEvent, processCodexEvent, resetLogState } from './logs.js';
import type { CodeIssue } from './types.js';

export interface CodexOptions {
  verbose?: boolean;
}

export const analyzeWithCodex = async (repoPath: string, prompt: string, options: CodexOptions): Promise<CodeIssue[]> => {
  const response = await runCodexExec(repoPath, prompt, options);
  return parseCodexResponse(response);
};

export const analyzeWithCodexRaw = async (repoPath: string, prompt: string, options: CodexOptions): Promise<any> => {
  const response = await runCodexExec(repoPath, prompt, options);
  return parseCodexResponseRaw(response);
};

const runCodexExec = (repoPath: string, prompt: string, options: CodexOptions): Promise<string> =>
  new Promise((resolve, reject) => {
    const args = ['@openai/codex', 'exec', '--json', '--full-auto', prompt];

    if (options.verbose) {
      console.log(`\n[Codex] Running: npx ${args.join(' ')}`);
      console.log(`[Codex] Working directory: ${repoPath}`);
    }

    const startTime = Date.now();
    const child = spawn('npx', args, { cwd: repoPath, stdio: ['pipe', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';

    resetLogState();

    child.stdout.on('data', data => {
      const chunk = data.toString();
      stdout += chunk;

      chunk
        .split('\n')
        .filter(Boolean)
        .forEach((line: string) => {
          try {
            const event: CodexEvent = JSON.parse(line);
            if (options.verbose) {
              console.log(JSON.stringify(event, null, 2));
            } else {
              processCodexEvent(event);
            }
          } catch {
            // Not JSON
          }
        });
    });

    child.stderr.on('data', data => {
      const chunk = data.toString();
      stderr += chunk;
      if (options.verbose) process.stderr.write(chunk);
    });

    child.on('close', code => {
      console.log(`\n[Codex] Completed in ${((Date.now() - startTime) / 1000).toFixed(1)}s`);

      if (code !== 0) {
        reject(new Error(`Codex review failed (exit ${code}): ${(stderr || stdout || 'Unknown error').slice(0, 500)}`));
        return;
      }
      resolve(stdout);
    });

    child.on('error', err => {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        reject(new Error('npx not found. Install Node.js/npm (Node 18+) to run nayan-ai.'));
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
  cve: item.cve
});

const extractItems = (json: any): any[] => {
  if (Array.isArray(json.issues)) return json.issues;
  if (Array.isArray(json.vulnerabilities)) return json.vulnerabilities;
  return [];
};

const parseCodexResponse = (response: string): CodeIssue[] => {
  const lines = response.split('\n').filter(Boolean);
  const allIssues: CodeIssue[] = [];

  // First pass: look for agent_message with JSON
  for (const line of lines) {
    try {
      const event = JSON.parse(line);
      if (event.type === 'item.completed' && event.item?.type === 'agent_message' && event.item.text) {
        const text = event.item.text;

        // Try to parse the text as JSON directly
        try {
          const parsed = JSON.parse(text);

          // Check if this is a fix response (has fixes or updatedManifest)
          if (parsed.fixes || parsed.updatedManifest) {
            return [
              {
                ...mapIssue({ message: 'Fix response' }),
                _rawFixData: parsed
              } as any
            ];
          }

          const items = extractItems(parsed);
          if (items.length > 0) {
            return items.filter((item: any) => item.message || item.package || item.title).map(mapIssue);
          }
        } catch {
          // Text is not valid JSON, try to extract JSON from it
          const jsonMatch = text.match(/\{\s*"issues"\s*:\s*\[[\s\S]*?\]\s*\}/);
          if (jsonMatch) {
            try {
              const parsed = JSON.parse(jsonMatch[0]);
              const items = extractItems(parsed);
              if (items.length > 0) {
                return items.filter((item: any) => item.message || item.package || item.title).map(mapIssue);
              }
            } catch {
              // ignore
            }
          }
        }
      }
    } catch {
      // Not valid JSON line
    }
  }

  // Second pass: look for JSON anywhere in the response (including in reasoning or other events)
  for (const line of lines) {
    try {
      const event = JSON.parse(line);
      // Check reasoning items too - sometimes the JSON is there
      if (event.type === 'item.completed' && event.item?.text) {
        const text = event.item.text;
        const jsonMatch = text.match(/\{\s*"issues"\s*:\s*\[[\s\S]*?\]\s*\}/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]);
            const items = extractItems(parsed);
            if (items.length > 0) {
              allIssues.push(...items.filter((item: any) => item.message || item.package || item.title).map(mapIssue));
            }
          } catch {
            // ignore
          }
        }
      }
    } catch {
      // Not valid JSON line
    }
  }

  if (allIssues.length > 0) {
    return allIssues;
  }

  // Try to find fix response JSON in raw response
  const fixMatch = response.match(/\{[\s\S]*"(?:fixes|updatedManifest)"[\s\S]*\}/);
  if (fixMatch) {
    try {
      const parsed = JSON.parse(fixMatch[0]);
      if (parsed.fixes || parsed.updatedManifest) {
        return [
          {
            ...mapIssue({ message: 'Fix response' }),
            _rawFixData: parsed
          } as any
        ];
      }
    } catch {
      // ignore
    }
  }

  // Final fallback: try to find issues JSON anywhere in the raw response
  const issuesMatches = response.matchAll(/\{\s*"issues"\s*:\s*\[[\s\S]*?\]\s*\}/g);
  for (const match of issuesMatches) {
    try {
      const parsed = JSON.parse(match[0]);
      const items = extractItems(parsed);
      if (items.length > 0) {
        return items.filter((item: any) => item.message || item.package || item.title).map(mapIssue);
      }
    } catch {
      // ignore
    }
  }

  return [];
};

const parseCodexResponseRaw = (response: string): any => {
  const lines = response.split('\n').filter(Boolean);

  for (const line of lines) {
    try {
      const event = JSON.parse(line);
      if (event.type === 'item.completed' && event.item?.type === 'agent_message' && event.item.text) {
        try {
          return JSON.parse(event.item.text);
        } catch {
          // Text is not JSON, return as-is
          return { text: event.item.text };
        }
      }
    } catch {
      // Not valid JSON line
    }
  }

  // Try to find any JSON object in the response
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
