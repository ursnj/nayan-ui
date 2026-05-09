'use client';

import { useEffect, useState } from 'react';
import { THEMES, useLocalStorage } from '@nayan-ui/react';
import { Check, Copy } from 'lucide-react';
import { Highlight, themes } from 'prism-react-renderer';

interface Props {
  code: string;
  language?: string;
  hasDemo?: boolean;
}

const Code = (props: Props) => {
  const [theme] = useLocalStorage('THEME', THEMES.LIGHT);
  const { code, language = 'tsx' } = props;
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mb-5 relative group">
      <button
        onClick={handleCopy}
        className="absolute top-2.5 right-2.5 p-1.5 rounded-md bg-default/50 hover:bg-default text-muted hover:text-foreground opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
        title="Copy code">
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
      {mounted ? (
        <Highlight theme={theme === THEMES.LIGHT ? themes.github : themes.dracula} code={code.trim()} language={language}>
          {({ style, tokens, getLineProps, getTokenProps }) => (
            <pre
              className="overflow-x-auto rounded-lg border border-default text-sm leading-relaxed"
              style={{ ...style, padding: '12px 16px', margin: 0, backgroundColor: 'var(--surface)' }}>
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })}>
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </div>
              ))}
            </pre>
          )}
        </Highlight>
      ) : (
        <pre
          className="overflow-x-auto rounded-lg border border-default text-sm leading-relaxed"
          style={{ padding: '12px 16px', margin: 0, backgroundColor: 'var(--surface)' }}>
          <code>{code.trim()}</code>
        </pre>
      )}
    </div>
  );
};

export default Code;
