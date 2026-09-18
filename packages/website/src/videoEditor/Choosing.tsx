import { HelpCircle } from 'lucide-react';
import { CHOOSING } from './content';

/**
 * The buyer's-guide section, written to be useful to someone who goes on to
 * pick something else. Each item is a question worth asking of any editor,
 * with this one's answer stated plainly rather than implied — which is the
 * only version of this section that is worth a reader's time.
 */
const Choosing = () => (
  <section id="choosing" aria-labelledby="choosing-heading" className="container mx-auto scroll-mt-32 px-4 py-14 sm:px-6 lg:px-8">
    <header className="mx-auto mb-10 max-w-3xl text-center">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">What matters</p>
      <h2 id="choosing-heading" className="text-2xl font-bold sm:text-4xl">
        What to look for in a video editor
      </h2>
      <p className="mt-4 text-muted">
        Six questions worth asking before you commit a weekend of footage to any tool — including this one. The answers here are this editor&apos;s;
        the questions are yours to take elsewhere.
      </p>
    </header>

    <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
      {CHOOSING.map((item, index) => (
        <article key={item.question} className="relative rounded-2xl border border-default bg-surface p-6 lg:p-7">
          <div className="mb-3 flex items-start gap-3">
            <span
              aria-hidden
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-indigo-500/25 bg-indigo-500/10 text-xs font-bold text-indigo-600 dark:text-indigo-300">
              {index + 1}
            </span>
            <h3 className="text-base font-semibold leading-snug text-foreground sm:text-lg">{item.question}</h3>
          </div>
          <p className="text-sm leading-relaxed text-muted">{item.body}</p>
        </article>
      ))}
    </div>

    <p className="mx-auto mt-8 flex max-w-3xl items-start gap-2.5 rounded-2xl border border-default bg-surface px-5 py-4 text-sm leading-relaxed text-muted">
      <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
      <span>
        Where this editor is the wrong tool: multi-editor collaboration, cloud storage, motion graphics and keyframed animation, and edits longer than
        your machine&apos;s memory will hold. A desktop suite still wins on depth, and a hosted service still wins on working across a team. It is
        worth saying so.
      </span>
    </p>
  </section>
);

export default Choosing;
