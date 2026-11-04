import { useCallback, useEffect, useId, useRef, useState } from 'react';

export const GAME_TOOLBAR_BUTTON = 'game-toolbar-button';

export function GameIcon({ name }: { name: 'back' | 'keyboard' | 'settings' | 'close' }) {
  const paths = {
    back: 'm12 19-7-7 7-7M5 12h14',
    keyboard: 'M10 8h.01M14 8h.01M18 8h.01M6 8h.01M10 12h.01M14 12h.01M18 12h.01M6 12h.01M8 16h8',
    settings:
      'M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915',
    close: 'm6 6 12 12M6 18 18 6'
  };
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {name === 'keyboard' && <rect x="2" y="4" width="20" height="16" rx="2" />}
      <path d={paths[name]} />
      {name === 'settings' && <circle cx="12" cy="12" r="3" />}
    </svg>
  );
}

/** The same light-dismiss keyboard guide used by the website's game player. */
export function GameKeyboardControls({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState({ top: 70, right: 16 });
  const position = useCallback(() => {
    const bounds = trigger.current?.getBoundingClientRect();
    if (!bounds) return;
    const width = Math.min(360, window.innerWidth - 32);
    setAnchor({
      top: bounds.bottom + 10,
      right: Math.min(Math.max(16, window.innerWidth - width - 16), Math.max(16, window.innerWidth - bounds.right))
    });
  }, []);
  useEffect(() => {
    window.addEventListener('resize', position);
    return () => window.removeEventListener('resize', position);
  }, [position]);

  return (
    <>
      <button
        ref={trigger}
        type="button"
        className={GAME_TOOLBAR_BUTTON}
        aria-label="Keyboard controls"
        title="Keyboard controls"
        aria-haspopup="dialog"
        aria-controls={id}
        aria-expanded={open}
        popoverTarget={id}
      >
        <GameIcon name="keyboard" />
      </button>
      <div
        id={id}
        popover="auto"
        role="dialog"
        aria-labelledby={`${id}-title`}
        className="game-keyboard-popover"
        style={anchor}
        onBeforeToggle={(event) => {
          if (event.newState === 'open') {
            position();
            setOpen(true);
            onOpenChange(true);
          }
        }}
        onToggle={(event) => {
          const visible = event.newState === 'open';
          setOpen(visible);
          onOpenChange(visible);
        }}
      >
        <div className="mb-3 flex shrink-0 items-center justify-between gap-4">
          <h2 id={`${id}-title`} className="text-base font-semibold">
            Keyboard controls
          </h2>
          <button
            type="button"
            className="game-popover-close"
            aria-label="Close keyboard controls"
            popoverTarget={id}
            popoverTargetAction="hide"
            autoFocus
          >
            <GameIcon name="close" />
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto overscroll-contain text-sm leading-relaxed">
          <ul className="space-y-2.5">
            <li>
              <kbd>←</kbd> <kbd>↑</kbd> <kbd>→</kbd> <kbd>↓</kbd> or <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd>
              <span className="mt-1 block">Move or steer.</span>
            </li>
            <li>
              <kbd>Space</kbd>
              <span className="mt-1 block">Tap.</span>
            </li>
            <li>
              <kbd>Enter</kbd>
              <span className="mt-1 block">Start, stop or play again.</span>
            </li>
          </ul>
          <p className="mt-4 border-t pt-3 text-xs" style={{ borderColor: 'var(--game-border)' }}>
            Mouse and touch work too.
          </p>
        </div>
      </div>
    </>
  );
}
