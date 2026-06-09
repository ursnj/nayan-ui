import chalk from 'chalk';
import ora from 'ora';
import { analyzeWithClaude } from '../common/claude.js';
import { analyzeWithCodex } from '../common/codex.js';
import {
  type GitHubConfig,
  cloneRepo,
  getPullRequest,
  getPullRequestFiles,
  parseFiles,
  parsePRReference,
  postComment,
  postReview
} from '../common/github.js';
import type { CodeIssue, ReviewOptions } from '../common/types.js';
import { VALID_LLM_PROVIDERS, checkLLMAvailability } from '../common/utils.js';
import { generateSummary, issuesToReviewComments } from './analyzer.js';
import { getReviewPrompt } from './prompt.js';

export const reviewCommand = async (prUrl: string, options: ReviewOptions): Promise<void> => {
  try {
    if (!VALID_LLM_PROVIDERS.includes(options.llm as any)) {
      console.error(chalk.red(`Error: Invalid LLM provider '${options.llm}'. Valid options: ${VALID_LLM_PROVIDERS.join(', ')}`));
      process.exit(1);
    }

    checkLLMAvailability(options.llm);

    const prInfo = parsePRReference(prUrl);
    const { githubUrl } = prInfo;
    const githubConfig: GitHubConfig = { token: options.token, githubUrl };

    console.log(chalk.bold.blue('\n🤖 Nayan AI - PR Reviewer'));
    console.log('━'.repeat(40));
    console.log(`  Repository: ${chalk.cyan(`${prInfo.owner}/${prInfo.repo}`)}`);
    console.log(`  PR Number:  ${chalk.cyan(`#${prInfo.number}`)}`);
    if (githubUrl) console.log(`  GitHub:     ${chalk.cyan(githubUrl)}`);
    if (options.dry) console.log(`  Mode:       ${chalk.yellow('Dry Run (no comments will be posted)')}`);
    console.log('━'.repeat(40) + '\n');

    let spinner = ora('Fetching PR details...').start();
    const pr = await getPullRequest(githubConfig, prInfo);
    spinner.succeed(`PR: ${pr.title}`);

    spinner = ora('Fetching changed files...').start();
    const files = await getPullRequestFiles(githubConfig, prInfo);
    const fileChanges = parseFiles(files);
    spinner.succeed(`Found ${fileChanges.length} files with changes`);

    spinner = ora('Cloning repository...').start();
    const repo = await cloneRepo(prInfo, options.token, githubUrl);

    let issues: CodeIssue[];
    try {
      spinner.succeed('Repository cloned');

      const llmName = options.llm === 'claude' ? 'Claude Code' : 'Codex';
      console.log(chalk.cyan(`Running code review with ${llmName} CLI...\n`));

      const prompt = getReviewPrompt('origin/main');
      const llmOptions = { verbose: options.verbose };

      issues =
        options.llm === 'claude' ? await analyzeWithClaude(repo.path, prompt, llmOptions) : await analyzeWithCodex(repo.path, prompt, llmOptions);

      console.log(chalk.green(`\n✔ Analysis complete: ${issues.length} issues found`));
    } finally {
      await repo.cleanup();
    }

    console.log(chalk.bold('\n📋 Review Summary'));
    console.log('─'.repeat(41));

    if (options.format === 'json') {
      console.log(JSON.stringify(issues, null, 2));
    } else {
      printIssuesSummary(issues);
    }

    if (!options.dry) {
      spinner = ora('Posting review to GitHub...').start();
      const summary = generateSummary(issues);

      if (options.inline) {
        const reviewComments = issuesToReviewComments(issues);
        await postReview(githubConfig, prInfo, pr.head.sha, summary, reviewComments);
        spinner.succeed('Inline review posted to GitHub');
      } else {
        await postComment(githubConfig, prInfo, summary);
        spinner.succeed('Review summary posted to GitHub');
      }
    } else {
      console.log(chalk.yellow('\nDry run mode - no comments posted to GitHub'));
    }

    console.log(chalk.green('\n✅ Review complete!\n'));
  } catch (error) {
    console.error(chalk.red('\nError:'), error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
};

const getIssueIcon = (category: string): string => (category === 'functionality' ? '🐛' : category === 'readability' ? '📖' : '⚡');

const printIssue = (issue: CodeIssue, colorFn: (s: string) => string): void => {
  console.log(colorFn(`    ${getIssueIcon(issue.category)} ${issue.filename}:${issue.line}`));
  console.log(`       ${issue.message}`);
  if (issue.suggestion) console.log(chalk.dim(`       💡 ${issue.suggestion}`));
};

const printIssuesSummary = (issues: CodeIssue[]): void => {
  if (issues.length === 0) {
    console.log(chalk.green('  No issues found! The code looks good.'));
    return;
  }

  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');
  const infos = issues.filter(i => i.severity === 'info');

  if (errors.length > 0) {
    console.log(chalk.red.bold(`\n  🔴 Errors (${errors.length}):`));
    errors.forEach(issue => printIssue(issue, chalk.red));
  }

  if (warnings.length > 0) {
    console.log(chalk.yellow.bold(`\n  🟡 Warnings (${warnings.length}):`));
    warnings.forEach(issue => printIssue(issue, chalk.yellow));
  }

  if (infos.length > 0) {
    console.log(chalk.blue.bold(`\n  🔵 Info (${infos.length}):`));
    infos.forEach(issue => printIssue(issue, chalk.blue));
  }
};
