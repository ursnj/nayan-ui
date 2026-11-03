import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { createKeyboardInput } from '@nayan-ui/engine';
import { DEFAULT_GAME_SETTINGS, type GameSettings } from '@nayan-engine-example/shared';
import { Link, Navigate, useParams } from 'react-router';
import { findExample } from './examples';
import { TITLE } from './Home';

/** Below this width the toolbar sits above the scoreboard; above it, beside it (as on nayanui.com). */
const WIDE_LAYOUT = 900;

const BUTTON =
  'pointer-events-auto grid h-11 w-11 place-items-center rounded-full border border-black/10 bg-white/90 text-slate-900 shadow-lg backdrop-blur transition hover:bg-white min-[900px]:h-[52px] min-[900px]:w-[52px]';

const systemTheme = () => (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

/** A game full screen, hosted like nayanui.com/games: a floating toolbar, settings and keyboard play. */
export function ExamplePage() {
  const example = findExample(useParams().id);
  const [settings, setSettings] = useState<GameSettings>(() => ({ ...DEFAULT_GAME_SETTINGS, theme: systemTheme() }));
  const surface = useRef<HTMLDivElement>(null);
  const toolbar = useRef<HTMLDivElement>(null);
  const settingsButton = useRef<HTMLButtonElement>(null);
  const [offset, setOffset] = useState(64);

  useEffect(() => {
    if (example) document.title = `${example.title} · ${TITLE}`;
  }, [example]);

  // Follow the system theme (the settings modal's switch can still change it for the game).
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const sync = () => setSettings((current) => ({ ...current, theme: systemTheme() }));
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  // Phones: the scoreboard sits under the toolbar. Wide screens: beside it, on the same row. The
  // settings popover hangs from the settings button.
  useEffect(() => {
    const bar = toolbar.current;
    const host = surface.current;
    if (!bar || !host) return;
    const layout = () => {
      const box = bar.getBoundingClientRect();
      const top = host.getBoundingClientRect().top;
      setOffset(box.width < WIDE_LAYOUT ? box.bottom - top : Math.max(0, box.top - top - 15));
      const trigger = settingsButton.current?.getBoundingClientRect();
      if (trigger) {
        const anchor = { top: trigger.bottom + 10, right: Math.max(12, window.innerWidth - trigger.right) };
        setSettings((current) => (current.anchor?.top === anchor.top && current.anchor.right === anchor.right ? current : { ...current, anchor }));
      }
    };
    const observer = new ResizeObserver(layout);
    observer.observe(bar);
    observer.observe(host);
    layout();
    return () => observer.disconnect();
  }, [example]);

  // Arrow keys / WASD steer and Space taps, as touch would; Enter presses Start, Stop or Play Again.
  const settingsOpen = settings.isVisible;
  useEffect(() => {
    const element = surface.current;
    if (!element || settingsOpen) return;
    element.focus({ preventScroll: true });
    const keyboard = createKeyboardInput(element, {
      mode: 'drag',
      // The shared HUD's Start / Stop button, bottom-centre of the surface.
      primary: () => ({ x: element.clientWidth / 2, y: element.clientHeight - 47 })
    });
    return () => keyboard.dispose();
  }, [settingsOpen, example]);

  const openSettings = useCallback(() => setSettings((current) => ({ ...current, isVisible: true })), []);

  if (!example) return <Navigate to="/" replace />;
  return (
    <main className="fixed inset-0 flex overflow-hidden bg-slate-900">
      <div ref={surface} tabIndex={0} aria-label={`${example.title} game`} className="relative flex h-full w-full overflow-hidden outline-none">
        <Suspense fallback={<p className="m-auto text-slate-300">Loading…</p>}>
          <example.Screen settings={{ ...settings, offset }} onSettingsChange={setSettings} />
        </Suspense>
      </div>

      <div
        ref={toolbar}
        className="pointer-events-none absolute inset-x-0 z-10 flex h-11 items-center justify-between min-[900px]:h-[68px]"
        style={{ top: 15, paddingLeft: 'max(16px, env(safe-area-inset-left))', paddingRight: 'max(16px, env(safe-area-inset-right))' }}
      >
        <Link to="/" aria-label="All examples" title="All examples" className={BUTTON}>
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <button
          ref={settingsButton}
          type="button"
          onClick={openSettings}
          aria-label="Game settings"
          title="Game settings"
          aria-haspopup="dialog"
          aria-expanded={settings.isVisible}
          className={BUTTON}
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
      </div>
    </main>
  );
}
