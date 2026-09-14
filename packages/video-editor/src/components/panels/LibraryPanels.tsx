import { showToast } from '@nayan-ui/react';
import { Sparkles } from 'lucide-react';
import { TRANSITION_PREVIEW_GRADIENT } from '../../engine/transitions';
import { TEXT_PRESETS } from '../../lib/factories';
import { cn } from '../../lib/utils';
import { useEditor } from '../../store/editor';
import { COLOR_PRESETS, TRANSITION_LABELS } from '../../types';
import type { TransitionKind } from '../../types';
import { EmptyState } from '../controls';

/* ------------------------------------------------------------------ *
 * Text
 * ------------------------------------------------------------------ */

export const TextPanel = () => {
  const addTextClip = useEditor(state => state.addTextClip);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-3">
      <p className="mb-2 text-[11px] text-muted">Click a style to drop it on the timeline at the playhead.</p>
      <div className="grid grid-cols-2 gap-2">
        {TEXT_PRESETS.map(preset => (
          <button
            key={preset.name}
            type="button"
            onClick={() => addTextClip(preset.preset)}
            className="group flex aspect-video flex-col items-center justify-center gap-1 rounded-lg border border-border bg-surface-secondary transition-all hover:border-accent hover:elevate">
            <span
              className="text-foreground transition-transform group-hover:scale-110"
              style={{
                fontWeight: preset.preset.fontWeight ?? 700,
                fontFamily: preset.preset.fontFamily,
                color: preset.preset.textColor,
                WebkitTextStroke: preset.preset.strokeWidth ? `1px ${preset.preset.strokeColor}` : undefined,
                background: preset.preset.backgroundColor !== 'transparent' ? preset.preset.backgroundColor : undefined,
                padding: preset.preset.backgroundColor !== 'transparent' ? '2px 8px' : undefined,
                borderRadius: 4
              }}>
              Aa
            </span>
            <span className="text-[10px] text-muted">{preset.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ *
 * Transitions
 * ------------------------------------------------------------------ */

export const TransitionsPanel = () => {
  const selectedClipIds = useEditor(state => state.selectedClipIds);
  const setTransition = useEditor(state => state.setTransition);
  const clips = useEditor(state => state.clips);

  const target = clips.find(clip => clip.id === selectedClipIds[0]) ?? null;

  const apply = (kind: TransitionKind) => {
    if (!target) {
      showToast('Select the clip the transition should open with.', 'No clip selected');
      return;
    }
    setTransition(target.id, kind, 500_000);
  };

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-3">
      {target ? (
        <p className="mb-2 text-[11px] text-muted">
          Applies to the start of <span className="text-foreground">{target.name}</span>, blending from the clip before it.
        </p>
      ) : (
        <p className="mb-2 text-[11px] text-muted">Select a clip first — a transition opens the clip you apply it to.</p>
      )}

      <div className="grid grid-cols-2 gap-2">
        {(Object.keys(TRANSITION_LABELS) as TransitionKind[]).map(kind => {
          const active = target?.transitionIn?.kind === kind;
          return (
            <button
              key={kind}
              type="button"
              onClick={() => apply(kind)}
              aria-pressed={active}
              className={cn(
                'overflow-hidden rounded-lg border transition-all hover:elevate',
                active ? 'border-accent ring-1 ring-accent' : 'border-border hover:border-accent'
              )}>
              <span className="block h-10 w-full" style={{ background: TRANSITION_PREVIEW_GRADIENT[kind] }} />
              <span className="block px-1.5 py-1 text-[10px] text-foreground">{TRANSITION_LABELS[kind]}</span>
            </button>
          );
        })}
      </div>

      {target?.transitionIn && (
        <button
          type="button"
          onClick={() => setTransition(target.id, null)}
          className="mt-3 w-full rounded-md border border-border py-1.5 text-[11px] text-muted transition-colors hover:border-danger hover:text-danger">
          Remove transition
        </button>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ *
 * Effects (colour presets)
 * ------------------------------------------------------------------ */

export const EffectsPanel = () => {
  const selectedClipIds = useEditor(state => state.selectedClipIds);
  const clips = useEditor(state => state.clips);
  const updateSelectedClips = useEditor(state => state.updateSelectedClips);

  const selected = clips.filter(clip => selectedClipIds.includes(clip.id));

  if (selected.length === 0) {
    return <EmptyState icon={<Sparkles className="h-8 w-8" />} title="No clip selected" hint="Select one or more clips to apply a look." />;
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-3">
      <p className="mb-2 text-[11px] text-muted">
        Applying to {selected.length} clip{selected.length > 1 ? 's' : ''}. Fine-tune in the Colour section of the inspector.
      </p>
      <div className="grid grid-cols-3 gap-2">
        {COLOR_PRESETS.map(preset => {
          const none = preset.name === 'None';
          return (
            <button
              key={preset.name}
              type="button"
              onClick={() =>
                updateSelectedClips({
                  // Presets are complete `ColorAdjust` values, so this is an
                  // assignment rather than a merge — switching looks can never
                  // leave a stray dial behind.
                  colorAdjust: { ...preset.color } as never,
                  // Record the look so the inspector's strength slider can
                  // keep re-deriving it. Without this the panel and the
                  // inspector would disagree about what is applied.
                  filter: (none ? null : { name: preset.name, intensity: 1 }) as never
                })
              }
              title={preset.name}
              className="group overflow-hidden rounded-lg border border-border transition-all hover:border-accent hover:elevate">
              <span
                className="block h-12 w-full"
                style={{ background: `linear-gradient(135deg, ${preset.swatch[0]}, ${preset.swatch[1]})` }}
                aria-hidden
              />
              <span className="block truncate px-1.5 py-1 text-[10px] text-foreground">{preset.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
