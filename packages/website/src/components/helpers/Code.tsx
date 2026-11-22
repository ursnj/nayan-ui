'use client';

import { useEffect, useMemo, useState } from 'react';
import { clipboard } from 'nayan-ui/clipboard';
import { NCode, NPress, NText, NView } from 'nayan-ui/components';
import { Check, Code2, Copy } from '@/design/Icons';

interface Props {
  code: string;
  language?: string;
  hasDemo?: boolean;
  filename?: string;
  embedded?: boolean;
  maxHeight?: string;
  showHeader?: boolean;
  tone?: 'ink';
}

const typedLanguages = new Set(['js', 'jsx', 'ts', 'tsx', 'javascript', 'typescript']);
const tokenStyles = ['text-(--code-muted)', 'text-(--code-string)', 'text-(--code-keyword)', 'text-(--code-number)', 'text-(--code-name)'];
const tokens =
  /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\b(?:as|async|await|const|export|false|from|function|if|import|let|new|null|return|true|type|undefined)\b)|(\b\d+(?:\.\d+)?\b)|(\b[A-Z][A-Za-z0-9_]*\b)/g;

function colorCode(code: string, language: string) {
  if (!typedLanguages.has(language)) return code;

  const parts = [];
  let cursor = 0;

  for (const match of code.matchAll(tokens)) {
    const start = match.index;
    if (start > cursor) parts.push(code.slice(cursor, start));
    const kind = tokenStyles[match.slice(1).findIndex(Boolean)];
    parts.push(
      <NText tag="span" key={start} className={kind}>
        {match[0]}
      </NText>
    );
    cursor = start + match[0].length;
  }

  parts.push(code.slice(cursor));
  return parts;
}

export function CodeText({ code, language = 'tsx' }: { code: string; language?: string }) {
  const formatted = useMemo(() => colorCode(code, language), [code, language]);
  return <NCode tag="code">{formatted}</NCode>;
}

export default function Code({ code, language = 'tsx', filename, embedded = false, maxHeight, showHeader = true, tone }: Props) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copyCode() {
    try {
      await clipboard.setString(code);
      setCopied(true);
    } catch {
      // Keep the snippet selectable if clipboard access is denied.
    }
  }

  return (
    <NView
      tag="div"
      data-code-tone={tone}
      data-code-embedded={embedded || undefined}
      className={`site-code-block [--code-bg:#fff] [--code-fg:#2b1a43] [--code-header:#f2eafb] [--code-muted:#615371] [--code-line:#e1d5ee] [--code-keyword:#6b21a8] [--code-string:#166353] [--code-name:#24449c] [--code-number:#9a4418] dark:[--code-bg:#211634] dark:[--code-fg:#f1e9ff] dark:[--code-header:#2b1d43] dark:[--code-muted:#c6b5d9] dark:[--code-line:#493760] dark:[--code-keyword:#eca9ff] dark:[--code-string:#cde98d] dark:[--code-name:#b9bcff] dark:[--code-number:#ffba8a] [&[data-code-tone=ink]]:[--code-bg:#211634] [&[data-code-tone=ink]]:[--code-fg:#f1e9ff] [&[data-code-tone=ink]]:[--code-header:#2b1d43] [&[data-code-tone=ink]]:[--code-muted:#c6b5d9] [&[data-code-tone=ink]]:[--code-line:#493760] [&[data-code-tone=ink]]:[--code-keyword:#eca9ff] [&[data-code-tone=ink]]:[--code-string:#cde98d] [&[data-code-tone=ink]]:[--code-name:#b9bcff] [&[data-code-tone=ink]]:[--code-number:#ffba8a] w-full min-w-0 overflow-hidden bg-[var(--code-bg)] [color:var(--code-fg)] ${embedded ? '' : 'rounded-[0.95rem] border border-[var(--code-line)]'}`}
    >
      {showHeader && (
        <NView
          tag="div"
          className="site-code-header flex items-center justify-between gap-3 border-b border-[var(--code-line)] bg-[var(--code-header)] px-3 py-1.5 text-xs [color:var(--code-muted)]"
        >
          <NText tag="span" className="flex min-w-0 items-center gap-2 overflow-hidden font-mono whitespace-nowrap">
            <Code2 aria-hidden size={16} className="shrink-0" />
            {filename ?? language}
          </NText>
          <NPress
            onPress={copyCode}
            className="site-code-copy flex shrink-0 flex-row items-center gap-1.5 rounded-md border border-[var(--code-line)] px-2 py-1 text-xs font-semibold [color:var(--code-fg)] hover:bg-[var(--code-bg)]"
            aria-live="polite"
          >
            {copied ? <Check aria-hidden size={15} /> : <Copy aria-hidden size={15} />}
            {copied ? 'Copied' : 'Copy'}
          </NPress>
        </NView>
      )}
      <NView
        tag="div"
        className="site-code-scroll overflow-auto focus-visible:[outline-offset:-3px]"
        style={{ maxHeight }}
        tabIndex={0}
        aria-label={`${filename ?? language} source code`}
      >
        <NView tag="pre" className="min-w-[max-content] px-4 py-3.5 text-[0.85rem] leading-[1.62]">
          <CodeText code={code} language={language} />
        </NView>
      </NView>
    </NView>
  );
}
