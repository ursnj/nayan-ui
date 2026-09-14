import { showToast } from '@nayan-ui/react';
import { Sparkles } from 'lucide-react';
import { TRANSITION_PREVIEW_GRADIENT } from '../../engine/transitions';
import { TEXT_PRESETS } from '../../lib/factories';
import { cn } from '../../lib/utils';
import { useEditor } from '../../store/editor';
import { BACKGROUND_LABELS, COLOR_PRESETS, GRADIENT_PRESETS, TRANSITION_LABELS } from '../../types';
import type { Background, BackgroundKind, TransitionKind } from '../../types';
import { ColorField, EmptyState, SliderField } from '../controls';

/* ------------------------------------------------------------------ *
 * Background
 * ------------------------------------------------------------------ */

const BACKGROUND_KINDS = Object.keys(BACKGROUND_LABELS) as BackgroundKind[];

/**
 * What fills the frame behind the layers.
 *
 * The kinds share one record rather than a union, so switching between them
 * and back keeps each one's settings — picking a gradient and changing your
 * mind should not silently discard the image you had chosen.
 */
export const BackgroundPanel = () => {
  const background = useEditor(state => state.project.background);
  const assets = useEditor(state => state.assets);
  const updateProject = useEditor(state => state.updateProject);

  const set = (changes: Partial<Background>) => updateProject({ background: { ...background, ...changes } });

  const images = assets.filter(asset => asset.kind === 'image');
  const gradient = background.kind === 'linear-gradient' || background.kind === 'radial-gradient';

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-3">
      <p className="mb-2 text-[11px] text-muted">
        Fills the frame behind every clip — most visible where your footage does not match the output shape.
      </p>

      <div className="mb-3 grid grid-cols-3 gap-1.5">
        {BACKGROUND_KINDS.map(kind => (
          <button
            key={kind}
            type="button"
            onClick={() => set({ kind })}
            aria-pressed={background.kind === kind}
            title={BACKGROUND_LABELS[kind]}
            className={cn(
              // Truncated rather than wrapped: the library can be dragged down
              // to 220px, which leaves these cells about 44px wide.
              'truncate rounded-md border px-1.5 py-1.5 text-[10px] transition-colors',
              background.kind === kind
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-border text-muted hover:border-separator hover:text-foreground'
            )}>
            {BACKGROUND_LABELS[kind]}
          </button>
        ))}
      </div>

      {background.kind === 'solid' && <ColorField label="Colour" value={background.color} onChange={color => set({ color })} />}

      {gradient && (
        <>
          <div className="mb-2 grid grid-cols-4 gap-1.5">
            {GRADIENT_PRESETS.map(preset => (
              <button
                key={preset.name}
                type="button"
                title={preset.name}
                aria-label={`${preset.name} gradient`}
                onClick={() => set({ from: preset.from, to: preset.to, angle: preset.angle })}
                className={cn(
                  'h-9 rounded-md border transition-colors',
                  background.from === preset.from && background.to === preset.to ? 'border-accent' : 'border-border hover:border-separator'
                )}
                style={{ background: `linear-gradient(${preset.angle}deg, ${preset.from}, ${preset.to})` }}
              />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <ColorField label="From" value={background.from} onChange={from => set({ from })} />
            <ColorField label="To" value={background.to} onChange={to => set({ to })} />
          </div>
          {background.kind === 'linear-gradient' && (
            <SliderField
              label="Angle"
              value={background.angle}
              min={0}
              max={360}
              format={value => `${value}°`}
              onChange={angle => set({ angle })}
              resetTo={135}
            />
          )}
        </>
      )}

      {background.kind === 'image' &&
        (images.length === 0 ? (
          <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-[11px] text-muted">
            Import an image in the Media panel to use it here.
          </p>
        ) : (
          <div className="mb-2 grid grid-cols-3 gap-1.5">
            {images.map(asset => (
              <button
                key={asset.id}
                type="button"
                title={asset.name}
                onClick={() => set({ assetId: asset.id })}
                aria-pressed={background.assetId === asset.id}
                className={cn(
                  'aspect-video overflow-hidden rounded-md border bg-surface-secondary transition-colors',
                  background.assetId === asset.id ? 'border-accent' : 'border-border hover:border-separator'
                )}>
                {asset.thumbnail ? (
                  <img src={asset.thumbnail} alt={asset.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full items-center justify-center text-[9px] text-muted">{asset.name}</span>
                )}
              </button>
            ))}
          </div>
        ))}

      {background.kind === 'blur' && (
        <p className="mb-2 text-[11px] text-muted">Uses the frontmost clip at the playhead, scaled to fill and defocused.</p>
      )}

      {(background.kind === 'blur' || background.kind === 'image') && (
        <>
          <SliderField
            label="Blur"
            value={background.blur}
            min={0}
            max={120}
            format={value => `${value}px`}
            onChange={blur => set({ blur })}
            resetTo={48}
          />
          <SliderField
            label="Zoom"
            value={Math.round(background.scale * 100)}
            min={100}
            max={200}
            format={value => `${value}%`}
            onChange={value => set({ scale: value / 100 })}
            resetTo={115}
          />
          <SliderField
            label="Dim"
            value={Math.round(background.dim * 100)}
            min={0}
            max={100}
            format={value => (value === 0 ? 'Off' : `${value}%`)}
            onChange={value => set({ dim: value / 100 })}
            resetTo={25}
          />
          <ColorField label="Dim colour" value={background.color} onChange={color => set({ color })} />
        </>
      )}
    </div>
  );
};

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
              <span className="block h-10 w-full" style={{ background: TRANSITION_PREVIEW_GRADIENT[kind] }} aria-hidden />
              <span title={TRANSITION_LABELS[kind]} className="block truncate px-1.5 py-1 text-[10px] text-foreground">
                {TRANSITION_LABELS[kind]}
              </span>
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
