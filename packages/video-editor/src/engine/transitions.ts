import type { TransitionKind } from '../types';

type Context2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

/**
 * How the incoming layer is revealed over the outgoing one.
 *
 * Each transition is expressed as a state per layer — an alpha, a clip path, a
 * translation, a scale, a blur — plus an optional overlay afterwards. Keeping
 * them declarative means the compositor needs no branch per kind, and preview
 * and export share the same code.
 *
 * Both sides get a state because the cheap version of this — moving only the
 * incoming layer and leaving the outgoing one nailed down — is what makes a
 * slide read as a sticker sliding over a photo rather than as a camera move.
 */
export interface LayerTransitionState {
  alpha: number;
  clip?: (context: Context2D, width: number, height: number) => void;
  /** Offset in frame pixels, applied before the clip's own transform. */
  translate?: { x: number; y: number };
  scale?: number;
  /** Pixels at 1080p; the compositor scales it with output height. */
  blur?: number;
}

export interface TransitionState {
  incoming: LayerTransitionState;
  outgoing: LayerTransitionState;
  /** Solid colour laid over everything, for dip-to-colour transitions. */
  overlay?: { color: string; alpha: number };
}

/*
 * Easing.
 *
 * The curve matters more than the shape of the move. A slide on a symmetric
 * curve feels like it is being dragged; the same slide on an ease-out leaves
 * immediately and settles, which is what reads as "smooth". So each transition
 * picks a curve deliberately rather than sharing one.
 */

/** Symmetric and gentle at both ends — right for cross-fades, wrong for motion. */
const smoothstep = (t: number) => t * t * (3 - 2 * t);
/** Leaves fast, lands soft. The default for anything that travels. */
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
/** Accelerates and decelerates — for scale, where a hard start looks like a glitch. */
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
/** Very fast out, very long settle — the whip. */
const easeOutQuint = (t: number) => 1 - (1 - t) ** 5;

/**
 * 0 at both ends, 1 in the middle — for effects that peak mid-transition.
 *
 * The endpoints are snapped because `sin(PI)` is 1.2e-16, not 0. That residue
 * is invisible but non-zero, which is enough to leave a blur in the filter
 * chain on the last frame of a transition.
 */
const arch = (t: number) => (t <= 0 || t >= 1 ? 0 : Math.sin(Math.PI * t));

const NONE: LayerTransitionState = { alpha: 1 };

/**
 * `progress` runs 0 → 1 across the transition: 0 is fully the outgoing clip,
 * 1 is fully the incoming one.
 */
export const transitionStateAt = (kind: TransitionKind, progress: number, width: number, height: number): TransitionState => {
  const t = Math.max(0, Math.min(1, progress));

  switch (kind) {
    /* ---- Dips ---- */

    case 'fade-to-black':
    case 'fade-to-white': {
      // Each half is eased on its own, so the picture settles into the colour
      // and leaves it again rather than ramping through at a constant rate.
      // The swap happens exactly at the peak, where the overlay is opaque.
      const half = t < 0.5 ? easeInOutCubic(t * 2) : 1 - easeInOutCubic((t - 0.5) * 2);
      return {
        incoming: { alpha: t >= 0.5 ? 1 : 0 },
        outgoing: NONE,
        overlay: { color: kind === 'fade-to-black' ? '#000000' : '#ffffff', alpha: half }
      };
    }

    /* ---- Dissolves ---- */

    case 'blur-dissolve': {
      const eased = smoothstep(t);
      const peak = arch(t) * 12;
      // Both sides defocus into the middle of the blend and resolve out of it,
      // which hides the moment the two pictures are equally weighted.
      return {
        incoming: { alpha: eased, blur: peak },
        outgoing: { alpha: 1, blur: peak }
      };
    }

    /* ---- Wipes ---- */

    case 'wipe-left':
    case 'wipe-right':
    case 'wipe-up':
    case 'wipe-down': {
      const eased = easeInOutCubic(t);
      return {
        incoming: {
          alpha: 1,
          clip: context => {
            context.beginPath();
            if (kind === 'wipe-left') context.rect(width * (1 - eased), 0, width * eased, height);
            else if (kind === 'wipe-right') context.rect(0, 0, width * eased, height);
            else if (kind === 'wipe-up') context.rect(0, height * (1 - eased), width, height * eased);
            else context.rect(0, 0, width, height * eased);
            context.clip();
          }
        },
        outgoing: NONE
      };
    }

    case 'iris': {
      const eased = easeInOutCubic(t);
      // Reach the far corner, not the edge, or the last sliver pops.
      const maxRadius = Math.hypot(width, height) / 2;
      return {
        incoming: {
          alpha: 1,
          clip: context => {
            context.beginPath();
            context.arc(width / 2, height / 2, eased * maxRadius, 0, Math.PI * 2);
            context.clip();
          }
        },
        outgoing: NONE
      };
    }

    /* ---- Slides: the incoming layer travels, the outgoing one holds ---- */

    case 'slide-left':
    case 'slide-right':
    case 'slide-up':
    case 'slide-down': {
      const eased = easeOutCubic(t);
      const gap = 1 - eased;
      const translate =
        kind === 'slide-left'
          ? { x: width * gap, y: 0 }
          : kind === 'slide-right'
            ? { x: -width * gap, y: 0 }
            : kind === 'slide-up'
              ? { x: 0, y: height * gap }
              : { x: 0, y: -height * gap };
      return { incoming: { alpha: 1, translate }, outgoing: NONE };
    }

    /* ---- Pushes: both layers travel together, as one strip ---- */

    case 'push-left':
    case 'push-right': {
      const eased = easeInOutCubic(t);
      const direction = kind === 'push-left' ? 1 : -1;
      return {
        incoming: { alpha: 1, translate: { x: direction * width * (1 - eased), y: 0 } },
        outgoing: { alpha: 1, translate: { x: -direction * width * eased, y: 0 } }
      };
    }

    /* ---- Scale ---- */

    case 'zoom-in': {
      const eased = easeInOutCubic(t);
      // The outgoing frame keeps pushing towards the viewer while the incoming
      // one arrives from behind it; matching the two moves is what sells it as
      // one continuous camera move rather than two stacked clips.
      return {
        incoming: { alpha: eased, scale: 0.7 + 0.3 * eased },
        outgoing: { alpha: 1, scale: 1 + 0.35 * eased }
      };
    }

    case 'zoom-out': {
      const eased = easeInOutCubic(t);
      return {
        incoming: { alpha: eased, scale: 1.35 - 0.35 * eased },
        outgoing: { alpha: 1, scale: 1 - 0.3 * eased }
      };
    }

    case 'whip-pan': {
      // Overshoot past the frame edge and a blur that peaks mid-swing: the eye
      // reads the smear as speed and stops looking for the cut underneath it.
      const eased = easeOutQuint(t);
      const smear = arch(t) * 18;
      return {
        incoming: { alpha: 1, translate: { x: width * 1.15 * (1 - eased), y: 0 }, blur: smear },
        outgoing: { alpha: 1, translate: { x: -width * 1.15 * eased, y: 0 }, blur: smear }
      };
    }

    case 'dissolve':
    default:
      return { incoming: { alpha: smoothstep(t) }, outgoing: NONE };
  }
};

export const TRANSITION_PREVIEW_GRADIENT: Record<TransitionKind, string> = {
  dissolve: 'linear-gradient(90deg,#6366f1,transparent)',
  'blur-dissolve': 'linear-gradient(90deg,#6366f1,#a5b4fc,#0ea5e9)',
  'fade-to-black': 'linear-gradient(90deg,#6366f1,#000,#6366f1)',
  'fade-to-white': 'linear-gradient(90deg,#6366f1,#fff,#6366f1)',
  'wipe-left': 'linear-gradient(270deg,#6366f1 50%,#0ea5e9 50%)',
  'wipe-right': 'linear-gradient(90deg,#6366f1 50%,#0ea5e9 50%)',
  'wipe-up': 'linear-gradient(0deg,#6366f1 50%,#0ea5e9 50%)',
  'wipe-down': 'linear-gradient(180deg,#6366f1 50%,#0ea5e9 50%)',
  'slide-left': 'linear-gradient(270deg,#a855f7,#6366f1)',
  'slide-right': 'linear-gradient(90deg,#a855f7,#6366f1)',
  'slide-up': 'linear-gradient(0deg,#a855f7,#6366f1)',
  'slide-down': 'linear-gradient(180deg,#a855f7,#6366f1)',
  'push-left': 'linear-gradient(270deg,#ec4899,#6366f1)',
  'push-right': 'linear-gradient(90deg,#ec4899,#6366f1)',
  'zoom-in': 'radial-gradient(circle,#6366f1,#0ea5e9)',
  'zoom-out': 'radial-gradient(circle,#0ea5e9,#6366f1)',
  'whip-pan': 'linear-gradient(90deg,#6366f1,#fff,#ec4899)',
  iris: 'radial-gradient(circle,#fff 30%,#6366f1 30%)'
};
