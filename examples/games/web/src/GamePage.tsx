import { Suspense, useEffect, useRef, useState } from 'react';
import { createKeyboardInput } from '@nayan-ui/engine';
import { DEFAULT_GAME_SETTINGS, type GameSettings } from '@nayan-engine-example/shared';
import { Link, Navigate, useParams } from 'react-router';
import { findExample } from './examples';
import { TITLE } from './Home';

const OFFSET = 70;
const BUTTON = 'grid h-11 w-11 place-items-center rounded-full bg-white/90 text-xl text-slate-900 shadow-lg hover:bg-white';
const deviceTheme = () => (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

export function GamePage() {
  const example = findExample(useParams().id);
  const surface = useRef<HTMLDivElement>(null);
  const [settings, setSettings] = useState<GameSettings>({ ...DEFAULT_GAME_SETTINGS, theme: deviceTheme(), offset: OFFSET });

  useEffect(() => void (document.title = `${example?.title} · ${TITLE}`), [example]);

  useEffect(() => {
    const element = surface.current;
    if (!element || settings.isVisible) return;
    element.focus();
    const keyboard = createKeyboardInput(element, {
      mode: 'drag',
      primary: () => ({ x: element.clientWidth / 2, y: element.clientHeight - 47 })
    });
    return () => keyboard.dispose();
  }, [settings.isVisible]);

  if (!example) return <Navigate to="/" replace />;
  return (
    <main className="fixed inset-0 flex bg-slate-900">
      <div ref={surface} tabIndex={0} className="flex flex-1 outline-none">
        <Suspense fallback={<p className="m-auto text-slate-300">Loading…</p>}>
          <example.Screen settings={settings} onSettingsChange={setSettings} />
        </Suspense>
      </div>
      <div className="pointer-events-none absolute inset-x-4 top-4 flex justify-between [&>*]:pointer-events-auto">
        <Link to="/" aria-label="All games" className={BUTTON}>
          ←
        </Link>
        <button type="button" aria-label="Game settings" className={BUTTON} onClick={() => setSettings((s) => ({ ...s, isVisible: true }))}>
          ⚙
        </button>
      </div>
    </main>
  );
}
