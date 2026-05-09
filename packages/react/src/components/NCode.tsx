import { Highlight, themes } from 'prism-react-renderer';
import { cn } from '../lib/utils';
import { THEMES } from './Types';

export interface NCodeProps {
  code: string;
  language?: string;
  theme?: THEMES;
  copied?: boolean;
  onCopy?: (code: string) => void;
  className?: string;
}

export const NCode = ({ code, language = 'tsx', theme = THEMES.LIGHT, copied = false, onCopy, className }: NCodeProps) => {
  return (
    <div className={cn('nyn-code relative group', className)}>
      {onCopy && (
        <button
          onClick={() => onCopy(code)}
          className="absolute top-2.5 right-2.5 p-1.5 rounded-md bg-default/50 hover:bg-default text-muted hover:text-foreground opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
          title="Copy code">
          {copied ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-emerald-500">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
            </svg>
          )}
        </button>
      )}
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
    </div>
  );
};
