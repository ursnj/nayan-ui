import { useEffect } from 'react';
import { Link } from 'react-router';
import { EXAMPLES } from './examples';

export const TITLE = 'Nayan Game Engine Games';

export function Home() {
  useEffect(() => void (document.title = TITLE), []);
  return (
    <main className="mx-auto max-w-2xl space-y-3 px-4 py-10">
      <h1 className="mb-6 text-4xl font-extrabold text-white">Games</h1>
      {EXAMPLES.map((example) => (
        <Link key={example.id} to={`/${example.id}`} className="block rounded-2xl border border-slate-700 bg-slate-800 p-4 hover:border-slate-500">
          <h2 className="text-xl font-bold text-white">{example.title}</h2>
          <p className="mt-1 text-sm text-slate-300">{example.description}</p>
        </Link>
      ))}
    </main>
  );
}
