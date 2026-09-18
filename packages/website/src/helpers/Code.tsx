'use client';

import { useEffect, useState } from 'react';
import { NCode, THEMES } from '@nayan-ui/react';
import { Check, Copy } from 'lucide-react';
import { useTheme } from '@/helpers/ThemeProvider';

interface Props {
  code: string;
  language?: string;
  hasDemo?: boolean;
  /** Shown in the frame's header bar — a file name reads better than a language. */
  filename?: string;
}

/**
 * A code sample in a titled frame.
 *
 * `NCode` renders the highlighted source and carries its own copy button, but
 * that button only fades in on hover — which is invisible on a touch screen
 * and easy to miss anywhere else. The frame adds a persistent header with the
 * language and a labelled copy control, and the inner button is left alone so
 * the two are not fighting over the same corner.
 *
 * Copy state lives here rather than in `NCode` because the confirmation has
 * to be readable — a tick that replaces an icon for two seconds is easy to
 * miss, so this one says "Copied".
 */
const Code = ({ code, language = 'tsx', filename }: Props) => {
  /* From context, so a theme switch restyles the highlighted source with the
     rest of the page instead of on the next reload. */
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

  /*
   * `min-w-0` matters more than it looks. `NCode`'s `<pre>` scrolls its own
   * overflow, but a grid or flex child defaults to `min-width: auto`, so a
   * long line grows the frame instead of scrolling inside it — and takes the
   * page's horizontal scrollbar with it on a phone. `max-w-full` on the `pre`
   * gives it the bound it needs to start scrolling.
   */
  return (
    <div className="w-full min-w-0 overflow-hidden rounded-xl border border-default bg-surface">
      {/*
       * `bg-surface`, not `bg-background`. A code frame on a documentation page
       * sits directly on the page, and the page is `--background` — so a header
       * filled with `--background` was the same colour as the page behind it.
       * The strip read as a gap in the top of the frame rather than as its
       * header, and in light mode the white code body below made it look like
       * the frame started an inch too low.
       *
       * `--surface-secondary` would be the obvious tint, but in this palette
       * it is hsl(214 40% 96%) against a page of hsl(214 45% 95%) — the same
       * problem again. The frame is one surface, and the hairline below does
       * the separating, which is the rule the rest of the site follows.
       */}
      <div className="flex items-center justify-between gap-3 border-b border-default bg-surface px-3 py-2">
        <span className="truncate font-mono text-xs text-muted">{filename ?? language}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-default bg-surface px-2 py-1 text-xs font-medium text-muted transition-colors hover:text-foreground"
          aria-live="polite">
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
      {/* `border-0` so the frame owns the outline; NCode draws its own otherwise. */}
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
