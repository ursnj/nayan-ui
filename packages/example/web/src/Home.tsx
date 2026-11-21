import { useEffect } from "react";
import { APP_TITLE, carRacing, conceptGroups, type Concept } from "@nayan-example/shared/catalog";
import { Link } from "react-router";

function ConceptCard({ example }: { example: Concept }) {
  return (
    <Link
      to={`/concepts/${example.id}`}
      className="example-card flex min-h-32 flex-col justify-center p-4 sm:p-5"
    >
      <h3 className="text-base font-semibold text-white">{example.title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-slate-300">{example.description}</p>
    </Link>
  );
}

export function Home() {
  useEffect(() => {
    document.title = APP_TITLE;
  }, []);
  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <header className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">{APP_TITLE}</h1>
        <p className="mt-3 max-w-xl text-base text-slate-300">
          Run focused demos on the web, iOS, and Android. Open Car Racing to see the engine in a
          complete game.
        </p>
      </header>
      <Link
        to={`/${carRacing.id}`}
        className="example-card example-feature mb-10 flex flex-wrap items-center justify-between gap-4 p-5 sm:p-7"
      >
        <div>
          <h2 className="text-xl font-semibold text-white">{carRacing.title}</h2>
          <p className="mt-1 text-sm text-slate-200">{carRacing.description}</p>
        </div>
        <span className="rounded-lg bg-sky-300 px-4 py-2 font-semibold text-slate-950">
          Play game <span aria-hidden="true">→</span>
        </span>
      </Link>
      {conceptGroups.map((group) => (
        <section key={group.title} aria-label={group.title} className="mb-9">
          <h2 className="mb-3 text-xl font-semibold tracking-tight text-white">{group.title}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {group.examples.map((example) => (
              <ConceptCard key={example.id} example={example} />
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
