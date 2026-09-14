import { useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface Command {
  id: string;
  label: string;
  group: string;
  shortcut?: string;
  run: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  commands: Command[];
  onClose: () => void;
}

/**
 * ⌘K launcher for every editor action.
 *
 * A pro tool accumulates more commands than fit in toolbars; this keeps them
 * all one keystroke away without adding chrome. Matching is a simple
 * subsequence test so "spl" finds "Split at playhead".
 */
export const CommandPalette = ({ isOpen, commands, onClose }: CommandPaletteProps) =>
  // Mounted only while open, so the query and highlight reset by unmounting
  // rather than by being cleared in an effect.
  isOpen ? <Palette commands={commands} onClose={onClose} /> : null;

const Palette = ({ commands, onClose }: { commands: Command[]; onClose: () => void }) => {
  const [query, setQuery] = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return commands;
    return commands.filter(command => subsequence(needle, `${command.group} ${command.label}`.toLowerCase()));
  }, [commands, query]);

  useEffect(() => {
    // Focus after paint so the dialog is actually in the DOM.
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setHighlighted(index => Math.min(index + 1, results.length - 1));
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setHighlighted(index => Math.max(index - 1, 0));
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        const command = results[highlighted];
        if (command) {
          onClose();
          command.run();
        }
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [highlighted, onClose, results]);

  // Keep the highlighted row in view while arrowing through a long list.
  useEffect(() => {
    listRef.current?.querySelector('[data-highlighted="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [highlighted]);

  let lastGroup = '';

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center bg-black/50 pt-[12vh] backdrop-blur-sm" onPointerDown={onClose}>
      <div
        role="dialog"
        aria-label="Command palette"
        onPointerDown={event => event.stopPropagation()}
        className="animate-in w-full max-w-lg overflow-hidden rounded-xl border border-border bg-overlay elevate-lg">
        <div className="flex items-center gap-2 border-b border-border px-3">
          <Search className="h-4 w-4 shrink-0 text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={event => {
              setQuery(event.target.value);
              // Reset here rather than in an effect: a new query means a new list.
              setHighlighted(0);
            }}
            placeholder="Search commands…"
            aria-label="Search commands"
            className="w-full bg-transparent py-3 text-sm text-foreground outline-none placeholder:text-field-placeholder"
          />
          <kbd className="shrink-0 rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted">esc</kbd>
        </div>

        <div ref={listRef} className="max-h-80 overflow-y-auto p-1">
          {results.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-muted">No matching commands.</p>
          ) : (
            results.map((command, index) => {
              const showGroup = command.group !== lastGroup;
              lastGroup = command.group;
              return (
                <div key={command.id}>
                  {showGroup && <p className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted">{command.group}</p>}
                  <button
                    type="button"
                    data-highlighted={index === highlighted}
                    onPointerEnter={() => setHighlighted(index)}
                    onClick={() => {
                      onClose();
                      command.run();
                    }}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs transition-colors',
                      index === highlighted ? 'bg-accent text-accent-foreground' : 'text-foreground hover:bg-default'
                    )}>
                    <span className="flex-1">{command.label}</span>
                    {command.shortcut && (
                      <span className={cn('font-mono text-[10px]', index === highlighted ? 'text-accent-foreground/80' : 'text-muted')}>
                        {command.shortcut}
                      </span>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

/** True when every character of `needle` appears in order within `haystack`. */
const subsequence = (needle: string, haystack: string) => {
  let index = 0;
  for (const char of haystack) {
    if (char === needle[index]) index++;
    if (index === needle.length) return true;
  }
  return index === needle.length;
};
