"use client";

import { useEffect, useState } from "react";
import { clipboard } from "@nayan-ui/engine/clipboard";
import { NPress } from "@nayan-ui/engine/components";
import { Check, Copy } from "@/design/Icons";

interface Props {
  code: string;
  language?: string;
  hasDemo?: boolean;
  /** Shown in the frame's header bar — a file name reads better than a language. */
  filename?: string;
  embedded?: boolean;
  maxHeight?: string;
  showHeader?: boolean;
}

const Code = ({
  code,
  language = "tsx",
  filename,
  embedded = false,
  maxHeight,
  showHeader = true,
}: Props) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleCopy = async () => {
    try {
      await clipboard.setString(code);
      setCopied(true);
    } catch {
      // A denied clipboard permission is not worth interrupting the page for;
      // the source is on screen and selectable either way.
    }
  };

  return (
    <div
      className={`site-code-block w-full min-w-0 overflow-hidden bg-surface ${embedded ? "" : "rounded-xl border border-border"}`}
    >
      {showHeader && (
        <div className="flex items-center justify-between gap-3 border-b border-border bg-surface-secondary px-4 py-2">
          <span className="truncate font-mono text-xs text-muted">{filename ?? language}</span>
          <NPress
            onPress={handleCopy}
            className="inline-flex shrink-0 items-center gap-1.5 flex-row rounded-md border border-default bg-surface px-2 py-1 text-xs font-medium text-muted transition-colors hover:text-foreground"
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
          </NPress>
        </div>
      )}
      <div
        className="overflow-auto"
        style={{ maxHeight }}
        tabIndex={0}
        aria-label={`${filename ?? language} source code`}
      >
        <pre className="m-0 min-w-max bg-surface p-4 text-sm leading-relaxed">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};

export default Code;
