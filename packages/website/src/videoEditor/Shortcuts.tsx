import { Keyboard } from 'lucide-react';
import { SHORTCUT_GROUPS } from './content';

/**
 * A slice of the key map.
 *
 * The full table lives behind `?` inside the editor, where it is generated
 * from the same array that binds the keys and so cannot fall out of date.
 * Repeating all of it here would only create a second copy to maintain, so
 * this shows enough to make the point and points at the real one.
 */
const Shortcuts = () => (
  <section id="shortcuts" aria-labelledby="shortcuts-heading" className="container mx-auto scroll-mt-32 px-4 py-14 sm:px-6 lg:px-8">
    <header className="mx-auto mb-10 max-w-3xl text-center">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">Shortcuts</p>
      <h2 id="shortcuts-heading" className="text-2xl font-bold sm:text-4xl">
        Built to be driven from the keyboard
      </h2>
      <p className="mt-4 text-muted">
        Anything you do more than twice has a key. These are the ones you will wear out — press{' '}
        <kbd className="rounded border border-default bg-surface px-1.5 py-0.5 font-mono text-xs text-foreground">?</kbd> in the editor for the full
        map.
      </p>
    </header>

    <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-4">
      {SHORTCUT_GROUPS.map(group => (
        <div key={group.group} className="rounded-2xl border border-default bg-surface p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Keyboard className="h-4 w-4 text-indigo-500" />
            {group.group}
          </h3>
          <dl className="space-y-3">
            {group.rows.map(row => (
              <div key={row.label}>
                <dt className="flex flex-wrap items-center gap-1">
                  {row.keys.map(key => (
                    <kbd
                      key={key}
                      className="min-w-[1.75rem] rounded-md border border-default bg-background px-1.5 py-1 text-center font-mono text-[11px] font-medium text-foreground shadow-sm">
                      {key}
                    </kbd>
                  ))}
                </dt>
                <dd className="mt-1 text-xs leading-relaxed text-muted">{row.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>

    <p className="mt-6 text-center text-xs text-muted">
      <kbd className="rounded border border-default bg-surface px-1.5 py-0.5 font-mono text-foreground">⌘</kbd> is{' '}
      <kbd className="rounded border border-default bg-surface px-1.5 py-0.5 font-mono text-foreground">Ctrl</kbd> on Windows and Linux — the editor
      shows whichever your machine uses.
    </p>
  </section>
);

export default Shortcuts;
