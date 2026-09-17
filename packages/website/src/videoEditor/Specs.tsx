import { GLOSSARY, SPECS } from './content';

/**
 * Specifications, then the vocabulary.
 *
 * The glossary is the same set of terms the editor's own labels use, so
 * someone who arrives from a search for "what is ripple delete" lands one
 * click from the tool that does it. It is also emitted as a `DefinedTermSet`.
 */
const Specs = () => (
  <section id="specs" aria-labelledby="specs-heading" className="container mx-auto scroll-mt-32 px-4 py-14 sm:px-6 lg:px-8">
    <header className="mx-auto mb-10 max-w-3xl text-center">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">Specs</p>
      <h2 id="specs-heading" className="text-2xl font-bold sm:text-4xl">
        Specifications and requirements
      </h2>
    </header>

    <dl className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
      {SPECS.map(spec => (
        <div key={spec.title} className="rounded-2xl border border-default bg-surface p-6">
          <dt className="mb-2 text-sm font-semibold text-foreground">{spec.title}</dt>
          <dd className="text-sm leading-relaxed text-muted">{spec.body}</dd>
        </div>
      ))}
    </dl>

    <div id="glossary" className="mt-14 scroll-mt-32">
      <header className="mx-auto mb-8 max-w-3xl text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">Glossary</p>
        <h3 className="text-xl font-bold sm:text-3xl">Video editing terms, briefly</h3>
        <p className="mt-4 text-muted">
          The words the editor&apos;s own labels use. Useful if this is your first timeline, and a reasonable refresher if it is not.
        </p>
      </header>

      <dl className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
        {GLOSSARY.map(entry => (
          <div key={entry.term} className="rounded-2xl border border-default bg-surface p-5">
            <dt className="mb-1.5 text-sm font-semibold text-foreground">{entry.term}</dt>
            <dd className="text-sm leading-relaxed text-muted">{entry.definition}</dd>
          </div>
        ))}
      </dl>
    </div>
  </section>
);

export default Specs;
