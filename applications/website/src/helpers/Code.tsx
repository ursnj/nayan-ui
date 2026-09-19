"use client";

import { useEffect, useState } from "react";
import { NCode, THEMES } from "@nayan-ui/react";
import { Check, Copy } from "lucide-react";
import { useTheme } from "@/helpers/ThemeProvider";

interface Props {
  code: string;
  language?: string;
  hasDemo?: boolean;
  /** Shown in the frame's header bar — a file name reads better than a language. */
  filename?: string;
}

const Code = ({ code, language = "tsx", filename }: Props) => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      // A denied clipboard permission is not worth interrupting the page for;
      // the source is on screen and selectable either way.
    }
  };

  return (
    <div className="w-full min-w-0 overflow-hidden rounded-xl border border-default bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-default bg-surface px-3 py-2">
        <span className="truncate font-mono text-xs text-muted">{filename ?? language}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-default bg-surface px-2 py-1 text-xs font-medium text-muted transition-colors hover:text-foreground"
          aria-live="polite"
        >
          {copied ? (
            <>
              <Check aria-hidden className="h-3.5 w-3.5 text-emerald-500" />
              Copied
            </>
          ) : (
            <>
              <Copy aria-hidden className="h-3.5 w-3.5" />
              Copy
            </>
          )}
        </button>
      </div>
      <NCode
        code={code}
        language={language}
        theme={mounted ? theme : THEMES.LIGHT}
        className="min-w-0 [&_pre]:max-w-full [&_pre]:rounded-none [&_pre]:border-0"
      />
    </div>
  );
};

export default Code;
