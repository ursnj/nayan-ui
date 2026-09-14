import type { TransitionKind } from '../types';

type Context2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

/**
 * How the incoming layer is revealed over the outgoing one.
 *
 * Each transition is expressed as a state to apply before the incoming layer
 * is drawn — a clip path, an alpha, a translation — plus an optional overlay
 * afterwards. Keeping them declarative means the compositor needs no branch
 * per kind, and preview and export share the same code.
 */
export interface TransitionState {
  /** Alpha to draw the incoming layer at. */
  incomingAlpha: number;
  /** Alpha the outgoing layer keeps underneath. */
  outgoingAlpha: number;
  /** Applied to the incoming layer before drawing. */
  clip?: (context: Context2D, width: number, height: number) => void;
  /** Extra transform for the incoming layer, in frame pixels. */
  translate?: { x: number; y: number };
  scale?: number;
  /** Solid colour laid over everything, for dip-to-colour transitions. */
  overlay?: { color: string; alpha: number };
}

/** Smoothstep — every transition eases rather than moving linearly. */
const smooth = (t: number) => t * t * (3 - 2 * t);

/**
 * `progress` runs 0 → 1 across the transition: 0 is fully the outgoing clip,
 * 1 is fully the incoming one.
 */
export const transitionStateAt = (kind: TransitionKind, progress: number, width: number, height: number): TransitionState => {
  const t = Math.max(0, Math.min(1, progress));
  const eased = smooth(t);

  switch (kind) {
    case 'fade-to-black':
      // First half fades the outgoing clip out, second half brings the new one in.
      return {
        incomingAlpha: t >= 0.5 ? 1 : 0,
        outgoingAlpha: 1,
        overlay: { color: '#000000', alpha: 1 - Math.abs(t - 0.5) * 2 }
      };

    case 'wipe-left':
    case 'wipe-right':
      return {
        incomingAlpha: 1,
        outgoingAlpha: 1,
        clip: context => {
          context.beginPath();
          if (kind === 'wipe-left') context.rect(width * (1 - eased), 0, width * eased, height);
          else context.rect(0, 0, width * eased, height);
          context.clip();
        }
      };

    case 'slide-left':
      return { incomingAlpha: 1, outgoingAlpha: 1, translate: { x: width * (1 - eased), y: 0 } };

    case 'zoom-in':
      return { incomingAlpha: eased, outgoingAlpha: 1, scale: 0.6 + 0.4 * eased };

    case 'dissolve':
    default:
      return { incomingAlpha: eased, outgoingAlpha: 1 };
  }
};

export const TRANSITION_PREVIEW_GRADIENT: Record<TransitionKind, string> = {
  dissolve: 'linear-gradient(90deg,#6366f1,transparent)',
  'fade-to-black': 'linear-gradient(90deg,#6366f1,#000,#6366f1)',
  'wipe-left': 'linear-gradient(270deg,#6366f1 50%,#0ea5e9 50%)',
  'wipe-right': 'linear-gradient(90deg,#6366f1 50%,#0ea5e9 50%)',
  'slide-left': 'linear-gradient(270deg,#a855f7,#6366f1)',
  'zoom-in': 'radial-gradient(circle,#6366f1,#0ea5e9)'
};
