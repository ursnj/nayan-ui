import { DialogSize, NDialog } from '@nayan-ui/react';
import { CONTEXTUAL_KEYS, SHORTCUTS } from '../../lib/shortcuts';
import type { KeyRow, ShortcutGroup } from '../../lib/shortcuts';

const GROUPS: ShortcutGroup[] = ['Playback', 'Selection', 'Editing', 'Timeline', 'Project'];

const COLUMN_COUNT = 3;

/**
 * A group's height in rows, for the packing below: its own rows plus a couple
 * for the heading and the gap beneath the section. Rows are near enough the
 * same height to count rather than measure — the longest labels wrap to two
 * lines, but they are spread evenly enough across the groups not to change
 * which column anything lands in.
 */
const weigh = (rows: KeyRow[]) => rows.length + 2;

/**
 * The groups dealt into three columns of about equal height.
 *
 * Neither of the obvious layouts gets there. A three-track grid makes every
 * row as tall as its tallest cell, so the short groups each sit above a band
 * of dead space while the next row waits for Editing — twelve rows — to
 * finish. CSS multi-column flow fills greedily left to right, which on these
 * five groups packs Playback and Selection into the first column and leaves it
 * a third taller than the one holding Editing alone.
 *
 * So the columns are built here instead: walk the groups in the order they are
 * declared and drop each into the shortest column so far. Two properties come
 * out of that, and both matter. The heights land within a row or two of each
 * other, and because the first three groups necessarily go into three empty
 * columns, the top of the dialog still reads across in declared order —
 * Playback, Selection, Editing — with the remainder tucked underneath.
 */
const buildColumns = () => {
  const all = [...SHORTCUTS, ...CONTEXTUAL_KEYS];
  const columns = Array.from({ length: COLUMN_COUNT }, () => ({ height: 0, sections: [] as { group: ShortcutGroup; rows: KeyRow[] }[] }));

  for (const group of GROUPS) {
    const rows = all.filter(row => row.group === group);
    if (rows.length === 0) continue;
    const target = columns.reduce((shortest, column) => (column.height < shortest.height ? column : shortest));
    target.sections.push({ group, rows });
    target.height += weigh(rows);
  }

  return columns.filter(column => column.sections.length > 0);
};

/**
 * The key map, rendered from the same tables the listener reads, so a binding
 * cannot be added without appearing here.
 */
export const ShortcutsDialog = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
  /*
   * The width is set here rather than left to `DialogSize`, whose widest step
   * is `max-w-4xl` — still short of what three columns of label-plus-key rows
   * want, which is about 300px each to keep all but the longest labels on one
   * line. `twMerge` inside the dialog keeps whichever comes last, so this wins
   * over the size's own class.
   *
   * It has to be spelled out in this package, too. The size the dialog asks
   * for is a Tailwind class inside the component library, and the library's
   * classes are not in this app's Tailwind scan (the `@source` in index.css
   * points at a directory that does not exist), so `DialogSize` currently has
   * no width of its own to give — every dialog falls back to HeroUI's own
   * `max-w-lg`. Written here, in a file Tailwind does scan, the class exists.
   */
  <NDialog isOpen={isOpen} title="Keyboard shortcuts" size={DialogSize.LG} className="max-w-5xl" onClose={onClose}>
    {isOpen ? <ShortcutTable /> : null}
  </NDialog>
);

/** Split out so the closed dialog costs nothing: forty-odd rows of element
 *  tree were being built on every app render to sit behind a hidden dialog. */
const ShortcutTable = () => (
  <>
    {/* One grid row of three columns, so nothing here has a row height to
        share — the balancing is `buildColumns`' job, not the grid's. Narrow
        windows stack to one column: three columns of two-word wrapped lines
        would be worse than a single readable one. */}
    <div className="grid grid-cols-1 gap-x-8 lg:grid-cols-3">
      {buildColumns().map(column => (
        <div key={column.sections[0].group} className="space-y-5">
          {column.sections.map(({ group, rows }) => (
            <section key={group}>
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">{group}</h3>
              <dl className="space-y-1">
                {rows.map(row => (
                  <div key={`${group}:${row.keys}:${row.label}`} className="flex items-baseline justify-between gap-3">
                    <dd className="min-w-0 text-[11px] leading-relaxed text-foreground">{row.label}</dd>
                    <dt className="shrink-0 whitespace-nowrap rounded border border-border bg-surface-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted">
                      {row.keys}
                    </dt>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      ))}
    </div>

    <p className="mt-5 text-[11px] leading-relaxed text-muted">
      Letters act on the selection and the playhead. A text field, a slider or a focused clip keeps its own keys, so typing a name or adjusting a
      value never moves the timeline.
    </p>
  </>
);
