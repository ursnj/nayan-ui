import { NView, NText } from 'nayan-ui/components';
import { DialogSize, NDialog, NKbd } from "@/components/ui";
import { CONTEXTUAL_KEYS, SHORTCUTS } from "../../lib/shortcuts";
import type { KeyRow, ShortcutGroup } from "../../lib/shortcuts";

const GROUPS: ShortcutGroup[] = ["Playback", "Selection", "Editing", "Timeline", "Project"];

const COLUMN_COUNT = 3;

const weigh = (rows: KeyRow[]) => rows.length + 2;

const buildColumns = () => {
  const all = [...SHORTCUTS, ...CONTEXTUAL_KEYS];
  const columns = Array.from({ length: COLUMN_COUNT }, () => ({
    height: 0,
    sections: [] as { group: ShortcutGroup; rows: KeyRow[] }[],
  }));

  for (const group of GROUPS) {
    const rows = all.filter((row) => row.group === group);
    if (rows.length === 0) continue;
    const target = columns.reduce((shortest, column) =>
      column.height < shortest.height ? column : shortest,
    );
    target.sections.push({ group, rows });
    target.height += weigh(rows);
  }

  return columns.filter((column) => column.sections.length > 0);
};

export const ShortcutsDialog = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
  <NDialog
    isOpen={isOpen}
    title="Keyboard shortcuts"
    size={DialogSize.LG}
    className="max-w-5xl"
    onClose={onClose}
  >
    {isOpen ? <ShortcutTable /> : null}
  </NDialog>
);

const ShortcutTable = () => (
  <>
    <NView tag="div" className="grid grid-cols-1 gap-x-8 lg:grid-cols-3">
      {buildColumns().map((column) => (
        <NView tag="div" key={column.sections[0].group} className="space-y-5">
          {column.sections.map(({ group, rows }) => (
            <NView tag="section" key={group}>
              <NText tag="h3" className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
                {group}
              </NText>
              <NView tag="dl" className="space-y-1">
                {rows.map((row) => (
                  <NView tag="div"
                    key={`${group}:${row.keys}:${row.label}`}
                    className="flex items-baseline justify-between gap-3"
                  >
                    <NText tag="dd" className="min-w-0 text-[11px] leading-relaxed text-foreground">
                      {row.label}
                    </NText>
                    <NText tag="dt" className="shrink-0">
                      <NKbd className="text-[10px]">{row.keys}</NKbd>
                    </NText>
                  </NView>
                ))}
              </NView>
            </NView>
          ))}
        </NView>
      ))}
    </NView>

    <NText tag="p" className="mt-5 text-[11px] leading-relaxed text-muted">
      Letters act on the selection and the playhead. A text field, a slider or a focused clip keeps
      its own keys, so typing a name or adjusting a value never moves the timeline.
    </NText>
  </>
);
