import { Suspense, useEffect } from 'react';
import { Link, Navigate, useParams } from 'react-router';
import { findExample } from './examples';
import { TITLE } from './Home';

// The toolbar floats 15px from the top; the example's HUD starts below its 44px buttons.
const TOOLBAR_TOP = 15;
const TOOLBAR_HEIGHT = 44;
const OFFSET = TOOLBAR_TOP + TOOLBAR_HEIGHT + 12;

/** An example full screen, with a floating toolbar over it (as on nayanui.com/games). */
export function ExamplePage() {
  const example = findExample(useParams().id);

  useEffect(() => {
    if (example) document.title = `${example.title} · ${TITLE}`;
  }, [example]);

  if (!example) return <Navigate to="/" replace />;
  return (
    <main className="fixed inset-0 flex flex-col overflow-hidden bg-slate-900">
      <Suspense fallback={<p className="grid flex-1 place-items-center text-slate-300">Loading…</p>}>
        <example.Screen offset={OFFSET} />
      </Suspense>
      <div className="pointer-events-none absolute inset-x-4 flex items-center gap-3" style={{ top: TOOLBAR_TOP, height: TOOLBAR_HEIGHT }}>
        <Link
          to="/"
          aria-label="All examples"
          title="All examples"
          className="pointer-events-auto grid h-11 w-11 place-items-center rounded-full bg-white/90 text-slate-900 shadow-lg transition hover:bg-white"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="truncate text-lg font-bold text-white drop-shadow">{example.title}</h1>
      </div>
    </main>
  );
}
