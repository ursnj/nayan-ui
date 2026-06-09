#!/usr/bin/env node
import { program } from 'commander';
import { createRequire } from 'module';
import type { ReviewOptions, ScanOptions } from './common/types.js';
import { reviewCommand } from './review/command.js';
import { scanCommand } from './scan/command.js';

const require = createRequire(import.meta.url);
const { version } = require('../package.json');

program.name('nayan-ai').description('AI powered code reviewer using Codex & Claude Code agents').version(version);

program
  .command('review')
  .description('Review a GitHub Pull Request')
  .argument('<pr-url>', 'GitHub PR URL (e.g., https://github.com/owner/repo/pull/123)')
  .requiredOption('-t, --token <token>', 'GitHub personal access token')
  .option('-v, --verbose', 'Show real-time output from CLI', false)
  .option('-d, --dry', "Only analyze, don't post comments", false)
  .option('-i, --inline', 'Post inline comments instead of summary', false)
  .option('-l, --llm <provider>', 'LLM provider: codex (default) or claude', 'codex')
  .option('--format <format>', 'Output format: text, json', 'text')
  .action((prUrl: string, options: ReviewOptions) => reviewCommand(prUrl, options));

program
  .command('scan')
  .description('Scan a GitHub repository for package vulnerabilities using AI')
  .argument('<repo-url>', 'GitHub repo URL (e.g., https://github.com/owner/repo)')
  .requiredOption('-t, --token <token>', 'GitHub personal access token')
  .option('-p, --paths <paths>', 'Comma-separated list of paths to scan for projects')
  .option('-l, --llm <provider>', 'LLM provider: codex (default) or claude', 'codex')
  .option('-v, --verbose', 'Show real-time output from CLI', false)
  .option('--format <format>', 'Output format: text, json', 'text')
  .option('-f, --fix', 'Auto-fix vulnerabilities and create a PR with changes', false)
  .option('-b, --branch <name>', 'Branch name for fix PR', 'nayan-ai/security-fixes-' + Date.now())
  .action((repoUrl: string, options: ScanOptions) => scanCommand(repoUrl, options));

program.parse();
