import { execSync } from 'child_process';
import type { LLMProvider } from './types.js';

export const VALID_LLM_PROVIDERS = ['codex', 'claude'] as const;

export function checkLLMAvailability(provider: LLMProvider): void {
  if (provider === 'codex') {
    execSync('npx @openai/codex --version', { stdio: 'ignore' });
  } else if (provider === 'claude') {
    execSync('claude --version', { stdio: 'ignore' });
  }
}
