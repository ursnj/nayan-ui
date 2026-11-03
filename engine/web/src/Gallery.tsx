import { Suspense, useEffect, useState } from 'react';
import { EXAMPLES, type Example } from './examples';

const TITLE = 'Nayan Engine Examples';
const current = () => EXAMPLES.find((example) => `#/${example.id}` === window.location.hash) ?? null;

/** The site: a grid of examples, and the open one full screen. Each example has its own URL hash. */
export function Gallery() {
  const [open, setOpen] = useState<Example | null>(current);

  // Links, the back button and the browser's back/forward all just change the hash.
  useEffect(() => {
    const sync = () => setOpen(current());
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  useEffect(() => {
    document.title = open ? `${open.title} · ${TITLE}` : TITLE;
  }, [open]);

  if (open) {
    return (
      <main className="relative h-dvh w-full overflow-hidden">
        <Suspense fallback={<p className="grid h-full place-items-center text-slate-300">Loading…</p>}>
          <open.Screen />
        </Suspense>
        <a
          href="#/"
          aria-label="All examples"
          className="absolute right-4 top-3 rounded-xl bg-white/90 px-3.5 py-2 text-sm font-bold text-slate-900 shadow hover:bg-white"
        >
          ‹ Examples
        </a>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <p className="text-sm font-bold tracking-wide text-blue-300">@nayan-ui/engine</p>
      <h1 className="mt-1.5 text-4xl font-extrabold text-white">Examples</h1>
      <p className="mt-2 max-w-xl text-base leading-relaxed text-slate-300">
        Games and demos built on the Nayan engine, running in the browser with WebGPU or WebGL2.
      </p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {EXAMPLES.map((example) => (
          <li key={example.id}>
            <a
              href={`#/${example.id}`}
              className="block overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 transition hover:-translate-y-0.5 hover:border-slate-500"
            >
              <div className="grid h-36 place-items-center text-6xl" style={{ backgroundColor: example.color }} aria-hidden>
                {example.icon}
              </div>
              <div className="space-y-2 p-4">
                <h2 className="text-xl font-bold text-white">{example.title}</h2>
                <p className="text-sm leading-relaxed text-slate-300">{example.description}</p>
                <ul className="flex flex-wrap gap-1.5 pt-1">
                  {example.tags.map((tag) => (
                    <li key={tag} className="rounded-full bg-slate-700 px-2.5 py-1 text-xs font-semibold text-slate-200">
                      {tag}
                    </li>
                  ))}
                </ul>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
