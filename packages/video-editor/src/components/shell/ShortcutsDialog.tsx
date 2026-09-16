import { DialogSize, NDialog } from '@nayan-ui/react';
import { CONTEXTUAL_KEYS, SHORTCUTS } from '../../lib/shortcuts';
import type { ShortcutGroup } from '../../lib/shortcuts';

const GROUPS: ShortcutGroup[] = ['Playback', 'Selection', 'Editing', 'Timeline', 'Project'];

/**
 * The key map, rendered from the same tables the listener reads, so a binding
 * cannot be added without appearing here.
 */
export const ShortcutsDialog = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
  <NDialog isOpen={isOpen} title="Keyboard shortcuts" size={DialogSize.MD} onClose={onClose}>
    <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
      {GROUPS.map(group => {
        const rows = [...SHORTCUTS, ...CONTEXTUAL_KEYS].filter(row => row.group === group);
        if (rows.length === 0) return null;

        return (
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
        );
      })}
    </div>

    <p className="mt-5 text-[11px] leading-relaxed text-muted">
      Letters act on the selection and the playhead. A text field, a slider or a focused clip keeps its own keys, so typing a name or adjusting a
      value never moves the timeline.
    </p>
  </NDialog>
);
