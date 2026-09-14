import { NDialog } from '@nayan-ui/react';
import { DialogSize } from '@nayan-ui/react';

const GROUPS: { title: string; items: [string, string][] }[] = [
  {
    title: 'Playback',
    items: [
      ['Space', 'Play / pause'],
      ['← / →', 'Step one frame'],
      ['⇧ ← / →', 'Step ten frames'],
      ['↑ / ↓', 'Jump to previous / next edit'],
      ['Home / End', 'Go to start / end'],
      ['I / O', 'Set in / out point'],
      ['⇧ X', 'Clear in and out points']
    ]
  },
  {
    title: 'Editing',
    items: [
      ['S', 'Split at playhead'],
      ['⌫ / Del', 'Delete selection'],
      ['⇧ ⌫', 'Ripple delete'],
      ['⌘ D', 'Duplicate'],
      ['⌘ C / ⌘ X / ⌘ V', 'Copy / cut / paste'],
      ['⌘ A', 'Select all'],
      ['⌘ G / ⇧ ⌘ G', 'Group / ungroup'],
      ['M', 'Add marker'],
      ['⌘ Z / ⇧ ⌘ Z', 'Undo / redo']
    ]
  },
  {
    title: 'Tools',
    items: [
      ['V', 'Select tool'],
      ['C', 'Razor tool'],
      ['N', 'Toggle snapping'],
      ['T', 'Add text'],
      ['Esc', 'Deselect']
    ]
  },
  {
    title: 'View',
    items: [
      ['+ / −', 'Zoom timeline in / out'],
      ['⌘ scroll', 'Zoom around pointer'],
      ['⇧ F', 'Zoom to fit'],
      ['⌘ K', 'Command palette'],
      ['⌘ E', 'Export'],
      ['?', 'This dialog']
    ]
  }
];

export const ShortcutsDialog = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
  <NDialog isOpen={isOpen} title="Keyboard shortcuts" size={DialogSize.MD} onClose={onClose}>
    <div className="grid gap-5 sm:grid-cols-2">
      {GROUPS.map(group => (
        <section key={group.title}>
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">{group.title}</h3>
          <dl className="space-y-1">
            {group.items.map(([keys, description]) => (
              <div key={keys} className="flex items-center justify-between gap-3">
                <dt className="text-xs text-foreground">{description}</dt>
                <dd className="shrink-0 rounded border border-border bg-surface-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted">{keys}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
    <p className="mt-5 text-[11px] leading-relaxed text-muted">
      Modifier keys are shown for macOS; on Windows and Linux use Ctrl wherever ⌘ appears.
    </p>
  </NDialog>
);
