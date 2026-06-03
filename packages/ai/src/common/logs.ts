import chalk from 'chalk';
import ora, { type Ora } from 'ora';

export interface CodexEvent {
  type: string;
  item?: {
    id?: string;
    type?: string;
    text?: string;
    command?: string;
    aggregated_output?: string;
    exit_code?: number | null;
    status?: string;
  };
  thread_id?: string;
}

interface LogState {
  seenFiles: Set<string>;
  spinner: Ora | null;
}

let state: LogState = {
  seenFiles: new Set(),
  spinner: null,
};

export const resetLogState = (): void => {
  if (state.spinner) state.spinner.stop();
  state = { seenFiles: new Set(), spinner: null };
};

const stopSpinner = (): void => {
  if (state.spinner) {
    state.spinner.stop();
    state.spinner = null;
  }
};

const succeedSpinner = (text?: string): void => {
  if (state.spinner) {
    state.spinner.succeed(text ? chalk.green(text) : undefined);
    state.spinner = null;
  } else if (text) {
    console.log(chalk.green(`  ✔ ${text}`));
  }
};

const logAndSpin = (text: string): void => {
  if (state.spinner) state.spinner.succeed();
  state.spinner = ora({ text: chalk.cyan(text), prefixText: ' ', spinner: 'dots' }).start();
};

const wrapText = (text: string, maxWidth: number): string[] => {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (currentLine.length + word.length + 1 <= maxWidth) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
};

const extractFilePath = (cmd: string): string | null => {
  if (cmd.includes('git ')) return null;

  const patterns = [
    /sed\s+-n\s+'[^']+'\s+([^\s|]+\.[a-z]{1,4})/i,
    /nl\s+-ba\s+([^\s|]+\.[a-z]{1,4})/i,
    /cat\s+([^\s|]+\.[a-z]{1,4})/i,
  ];

  for (const pattern of patterns) {
    const match = cmd.match(pattern);
    if (match?.[1] && !match[1].includes('*') && /\.[a-z]{1,4}$/i.test(match[1])) {
      return match[1];
    }
  }
  return null;
};

const handleReasoning = (text: string): void => {
  const cleanText = text.replace(/\*\*/g, '').trim();
  if (!cleanText) return;

  const lines = cleanText.split('\n').filter(Boolean);

  if (lines.length === 1 && cleanText.length < 80) {
    logAndSpin(`💭 ${cleanText}`);
  } else {
    let title = lines[0];
    let details = '';

    if (lines.length === 1) {
      const splitMatch = cleanText.match(/^(.{30,80}?[;.])\s*(.+)$/);
      if (splitMatch) {
        title = splitMatch[1];
        details = splitMatch[2];
      }
    } else {
      details = lines.slice(1).join(' ');
    }

    logAndSpin(`💭 ${title}`);

    if (details) {
      if (state.spinner) {
        state.spinner.succeed();
        state.spinner = null;
      }
      wrapText(details, 70).forEach(line => console.log(chalk.dim(`       ${line}`)));
    }
  }
};

const handleCommandCompleted = (item: CodexEvent['item']): void => {
  if (!item) return;

  const cmd = item.command || '';
  const output = item.aggregated_output || '';

  if (cmd.includes('git diff') && output) {
    const diffFiles = output.match(/diff --git a\/([^\s]+)/g);
    if (diffFiles?.length) {
      succeedSpinner(`Found ${diffFiles.length} changed files`);
    }
  }

  if (cmd.includes('rg --files') && output) {
    const files = output.trim().split('\n').filter(Boolean);
    if (files.length) {
      succeedSpinner(`Identified ${files.length} files to analyze`);
    }
  }

  const fileMatch = extractFilePath(cmd);
  if (fileMatch && !state.seenFiles.has(fileMatch)) {
    state.seenFiles.add(fileMatch);
    logAndSpin(`📄 Analyzing ${fileMatch}`);
  }
};

const handleItemStarted = (event: CodexEvent): void => {
  const item = event.item;
  if (item?.type === 'command_execution' && item.command?.includes('git diff')) {
    logAndSpin('Checking differences...');
  }
};

const handleItemCompleted = (event: CodexEvent): void => {
  const item = event.item;
  if (!item) return;

  if (item.type === 'reasoning' && item.text) {
    handleReasoning(item.text);
  } else if (item.type === 'command_execution') {
    handleCommandCompleted(item);
  } else if (item.type === 'agent_message') {
    succeedSpinner('Analysis complete');
  }
};

export const processCodexEvent = (event: CodexEvent): void => {
  switch (event.type) {
    case 'thread.started':
      stopSpinner();
      state.spinner = ora({ text: chalk.cyan('Starting analysis...'), prefixText: ' ', spinner: 'dots' }).start();
      break;
    case 'item.completed':
      handleItemCompleted(event);
      break;
    case 'item.started':
      handleItemStarted(event);
      break;
  }
};
