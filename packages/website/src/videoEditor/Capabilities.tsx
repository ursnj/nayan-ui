import { Blend, MonitorPlay, Palette, Scissors, SlidersHorizontal } from 'lucide-react';
import { FILTERS, GRADE_GROUPS, PREVIEW_OPS, TIMELINE_OPS, TRANSITIONS } from './content';

/**
 * The inventory sections — what is actually in the shelves.
 *
 * Naming every look and every transition is not padding: they are what people
 * search for, and a page that claims "18 transitions" without saying which is
 * asking to be taken on faith.
 */
const Capabilities = () => (
  <section aria-labelledby="capabilities-heading" className="container mx-auto px-4 pb-14 sm:px-6 lg:px-8">
    <h2 id="capabilities-heading" className="sr-only">
      The full list of looks, transitions and editing operations
    </h2>

    <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
      {/* Looks */}
      <div className="rounded-2xl border border-default bg-surface p-6 lg:p-8">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-md">
            <Palette className="h-5 w-5 text-white" />
          </span>
          <h3 className="text-lg font-semibold text-foreground">Fifteen looks, plus neutral</h3>
        </div>
        <p className="mb-4 text-sm leading-relaxed text-muted">
          One click applies a full grade; the strength dial blends it back towards neutral, so a look is a starting point rather than a commitment.
        </p>
        <ul className="flex flex-wrap gap-1.5">
          {FILTERS.map(filter => (
            <li
              key={filter}
              className="rounded-lg border border-default bg-background px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-amber-500/40">
              {filter}
            </li>
          ))}
        </ul>

        <div className="mt-6 flex items-center gap-2 border-t border-default pt-5">
          <SlidersHorizontal className="h-4 w-4 text-muted" />
          <h4 className="text-sm font-semibold text-foreground">And the dials underneath</h4>
        </div>
        <dl className="mt-3 space-y-2.5">
          {GRADE_GROUPS.map(group => (
            <div key={group.title} className="flex flex-col gap-1 sm:flex-row sm:gap-3">
              <dt className="w-16 shrink-0 text-xs font-semibold uppercase tracking-wider text-muted">{group.title}</dt>
              <dd className="text-sm text-foreground">{group.items.join(' · ')}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Transitions */}
      <div className="rounded-2xl border border-default bg-surface p-6 lg:p-8">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 shadow-md">
            <Blend className="h-5 w-5 text-white" />
          </span>
          <h3 className="text-lg font-semibold text-foreground">Eighteen transitions</h3>
        </div>
        <p className="mb-4 text-sm leading-relaxed text-muted">
          Drop one on a clip&apos;s incoming edge and set its length. The outgoing clip keeps playing through the blend instead of freezing on its
          last frame — the difference between a transition and a slideshow.
        </p>
        <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {TRANSITIONS.map(transition => (
            <li
              key={transition}
              className="rounded-lg border border-default bg-background px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-rose-500/40">
              {transition}
            </li>
          ))}
        </ul>
      </div>

      {/* Editing operations */}
      <div className="rounded-2xl border border-default bg-surface p-6 lg:p-8">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-md">
            <Scissors className="h-5 w-5 text-white" />
          </span>
          <h3 className="text-lg font-semibold text-foreground">Editing operations</h3>
        </div>
        <ul className="space-y-2">
          {TIMELINE_OPS.map(item => (
            <li key={item} className="flex items-start gap-2 text-sm text-muted">
              <span aria-hidden className="mt-0.5 shrink-0 text-indigo-500">
                ✓
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Preview and workspace */}
      <div className="rounded-2xl border border-default bg-surface p-6 lg:p-8">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-500 shadow-md">
            <MonitorPlay className="h-5 w-5 text-white" />
          </span>
          <h3 className="text-lg font-semibold text-foreground">Preview and workspace</h3>
        </div>
        <ul className="space-y-2">
          {PREVIEW_OPS.map(item => (
            <li key={item} className="flex items-start gap-2 text-sm text-muted">
              <span aria-hidden className="mt-0.5 shrink-0 text-fuchsia-500">
                ✓
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </section>
);

export default Capabilities;
