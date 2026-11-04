import { Suspense, useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { createKeyboardInput } from '@nayan-ui/engine';
import { DEFAULT_GAME_SETTINGS, type GameSettings } from '@nayan-engine-example/shared';
import { Link, Navigate, useParams } from 'react-router';
import { findExample } from './examples';
import { TITLE } from './Home';
import { GAME_TOOLBAR_BUTTON, GameIcon, GameKeyboardControls } from './GameToolbar';

const deviceTheme = () => (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

export function GamePage() {
  const example = findExample(useParams().id);
  const surface = useRef<HTMLDivElement>(null);
  const toolbar = useRef<HTMLDivElement>(null);
  const settingsTrigger = useRef<HTMLButtonElement>(null);
  const [settings, setSettings] = useState<GameSettings>(() => ({ ...DEFAULT_GAME_SETTINGS, theme: deviceTheme() }));
  const [showKeys, setShowKeys] = useState(false);
  const [offset, setOffset] = useState(64);

  useEffect(() => void (document.title = `${example?.title} · ${TITLE}`), [example]);

  useEffect(() => {
    const element = surface.current;
    if (!element || settings.isVisible || showKeys) return;
    const focus = requestAnimationFrame(() => element.focus({ preventScroll: true }));
    const keyboard = createKeyboardInput(element, {
      mode: 'drag',
      primary: () => ({ x: element.clientWidth / 2, y: element.clientHeight - 47 })
    });
    return () => {
      cancelAnimationFrame(focus);
      keyboard.dispose();
    };
  }, [settings.isVisible, showKeys]);

  useEffect(() => {
    const bar = toolbar.current;
    const host = surface.current;
    if (!bar || !host) return;
    const layout = () => {
      const bounds = bar.getBoundingClientRect();
      const origin = host.getBoundingClientRect().top;
      setOffset(bounds.width < 900 ? bounds.bottom - origin : Math.max(0, bounds.top - origin - 15));
      const trigger = settingsTrigger.current?.getBoundingClientRect();
      if (trigger)
        setSettings((current) => {
          const anchor = { top: trigger.bottom + 10, right: Math.max(12, window.innerWidth - trigger.right) };
          return current.anchor?.top === anchor.top && current.anchor.right === anchor.right ? current : { ...current, anchor };
        });
    };
    const observer = new ResizeObserver(layout);
    observer.observe(bar);
    observer.observe(host);
    window.addEventListener('resize', layout);
    layout();
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', layout);
    };
  }, []);

  const onKeyboardOpenChange = useCallback((open: boolean) => {
    setShowKeys(open);
    if (open) setSettings((current) => ({ ...current, isVisible: false }));
  }, []);

  if (!example) return <Navigate to="/" replace />;
  return (
    <main
      className="fixed inset-0 flex overflow-hidden"
      style={
        {
          '--game-surface': settings.theme === 'dark' ? '#1c172b' : '#ffffff',
          '--game-text': settings.theme === 'dark' ? '#f9f8fb' : '#0f1729',
          '--game-border': settings.theme === 'dark' ? '#3d3454' : '#ded9e9',
          '--game-accent': settings.theme === 'dark' ? '#b69afa' : '#6f3ef4'
        } as CSSProperties
      }
    >
      <div ref={surface} tabIndex={0} className="relative flex h-full w-full overflow-hidden outline-none" aria-label={`${example.title} game`}>
        <Suspense fallback={<p className="m-auto text-slate-300">Loading…</p>}>
          <example.Screen settings={{ ...settings, offset, paused: showKeys }} onSettingsChange={setSettings} />
        </Suspense>
      </div>
      <div
        ref={toolbar}
        className="game-toolbar pointer-events-none absolute inset-x-0 top-[15px] z-10 flex h-11 items-center justify-between min-[900px]:h-[68px]"
      >
        <Link to="/" aria-label="All games" title="All games" className={GAME_TOOLBAR_BUTTON}>
          <GameIcon name="back" />
        </Link>
        <div className="flex items-center gap-2">
          <GameKeyboardControls onOpenChange={onKeyboardOpenChange} />
          <button
            ref={settingsTrigger}
            type="button"
            aria-label="Game settings"
            title="Game settings"
            aria-haspopup="dialog"
            aria-expanded={settings.isVisible}
            className={GAME_TOOLBAR_BUTTON}
            onClick={() => setSettings((s) => ({ ...s, isVisible: true }))}
          >
            <GameIcon name="settings" />
          </button>
        </div>
      </div>
    </main>
  );
}
