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
      <div className="grid grid-cols-2 gap-2">
        {COLOR_PRESETS.map(preset => (
          <button
            key={preset.name}
            type="button"
            onClick={() =>
              updateSelectedClips({
                // Presets are partial: merge onto the default so switching
                // between looks never leaves a stray value behind.
                colorAdjust: { ...COLOR_PRESETS[0].color, ...preset.color } as never
              })
            }
            className="group overflow-hidden rounded-lg border border-border transition-all hover:border-accent hover:elevate">
            <span
              className="block h-12 w-full bg-gradient-to-br from-sky-400 via-fuchsia-500 to-amber-400"
              style={{ filter: previewFilter(preset.name) }}
            />
            <span className="block px-1.5 py-1 text-[10px] text-foreground">{preset.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

/** Cheap CSS approximation of each look, just for the swatch. */
const previewFilter = (name: string) => {
  switch (name) {
    case 'Vivid':
      return 'saturate(1.45) contrast(1.15)';
    case 'Warm':
      return 'sepia(0.25) saturate(1.2)';
    case 'Cool':
      return 'hue-rotate(-15deg) saturate(1.1)';
    case 'Mono':
      return 'grayscale(1) contrast(1.15)';
    case 'Faded':
      return 'contrast(0.8) brightness(1.15) saturate(0.75)';
    case 'Teal & Orange':
      return 'sepia(0.2) saturate(1.4) hue-rotate(-8deg)';
    case 'Noir':
      return 'grayscale(1) contrast(1.5) brightness(0.9)';
    case 'Dreamy':
      return 'blur(1px) brightness(1.12) saturate(1.2)';
    case 'Cinematic':
      return 'contrast(1.25) saturate(0.9) brightness(0.95)';
    case 'Sepia':
      return 'sepia(0.75)';
    case 'Invert':
      return 'invert(1)';
    default:
      return 'none';
  }
};
