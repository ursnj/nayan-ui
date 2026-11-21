"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Terminal } from "lucide-react";
import { clipboard } from "@nayan-ui/engine/clipboard";
import { NPress, NText, NView } from "@nayan-ui/engine/components";

const COMMAND = "bun add @nayan-ui/engine";

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
      className="mx-auto mt-7 flex max-w-md items-center gap-3 rounded-xl border border-default bg-surface px-3.5 py-2.5 text-left lg:mx-0"
    >
      <Terminal aria-hidden className="h-4 w-4 shrink-0 text-muted" />
      <NText tag="code" className="min-w-0 flex-1 font-mono text-sm text-foreground">
        {COMMAND}
      </NText>
      <NPress
        aria-label={copied ? "Install command copied" : "Copy install command"}
        className="shrink-0 rounded-md p-1 text-muted hover:text-foreground"
        onPress={copyCommand}
      >
        {copied ? (
          <Check aria-hidden className="h-4 w-4" />
        ) : (
          <Copy aria-hidden className="h-4 w-4" />
        )}
      </NPress>
    </NView>
  );
}
