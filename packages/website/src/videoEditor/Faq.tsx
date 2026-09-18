import { ChevronDown } from 'lucide-react';
import { FAQS } from './content';

/**
 * The FAQ, as native `<details>` elements.
 *
 * An accordion component would work, but this needs no JavaScript to open and
 * every answer sits in the delivered HTML whether or not it is expanded —
 * which is what the `FAQPage` schema claims, and what a crawler that does not
 * run scripts will see.
 */
const Faq = () => (
  <section id="faq" aria-labelledby="faq-heading" className="container mx-auto scroll-mt-32 px-4 py-14 sm:px-6 lg:px-8">
    <header className="mx-auto mb-10 max-w-3xl text-center">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">FAQ</p>
      <h2 id="faq-heading" className="text-2xl font-bold sm:text-4xl">
        Frequently asked questions
      </h2>
    </header>

    <div className="mx-auto grid max-w-5xl gap-3 md:grid-cols-2">
      {FAQS.map(faq => (
        <details key={faq.q} className="group rounded-2xl border border-default bg-surface transition-colors open:border-indigo-500/30">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-3 p-5 [&::-webkit-details-marker]:hidden">
            <h3 className="text-sm font-semibold leading-snug text-foreground sm:text-base">{faq.q}</h3>
            <ChevronDown aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-muted transition-transform duration-200 group-open:rotate-180" />
          </summary>
          <p className="px-5 pb-5 text-sm leading-relaxed text-muted">{faq.a}</p>
        </details>
      ))}
    </div>
  </section>
);

export default Faq;
