'use client';

import { useEffect, useState } from 'react';
import { Check, Copy, Terminal } from '@/design/Icons';
import { clipboard } from '@nayan-ui/engine/clipboard';
import { NPress, NText, NView } from '@nayan-ui/engine/components';

const COMMAND = 'bun add @nayan-ui/engine';

export default function InstallCommand() {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  async function copyCommand() {
    try {
      await clipboard.setString(COMMAND);
      setCopied(true);
    } catch {
      // Keep the command available for manual selection.
    }
  }

  return (
    <NView
      tag="div"
      className="mt-5 flex w-fit max-w-full items-center gap-2.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-left sm:gap-3"
    >
      <Terminal aria-hidden className="h-4 w-4 shrink-0 text-muted" />
      <NText tag="code" className="min-w-0 flex-1 font-mono text-xs text-foreground sm:text-sm">
        {COMMAND}
      </NText>
      <NPress
        aria-label={copied ? 'Install command copied' : 'Copy install command'}
        className="ml-1 shrink-0 rounded-md p-2 text-muted hover:bg-surface-secondary hover:text-foreground"
        onPress={copyCommand}
      >
        {copied ? <Check aria-hidden className="h-4 w-4" /> : <Copy aria-hidden className="h-4 w-4" />}
      </NPress>
    </NView>
  );
}
