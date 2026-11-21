'use client';
import { component } from './component';
import type { ComponentProps } from './types';
export interface NConfettiProps extends ComponentProps {
  /** Change this positive value to start another celebration. Zero is idle. */
  run: number;
  count?: number;
  /** Seconds; default 1.4, clamped to 0.1..10. */
  duration?: number;
  colors?: never;
  confettiColors?: readonly string[];
}
/** A decorative burst animated on the engine clock, respecting reduced motion. */
export const NConfetti = /* @__PURE__ */ component<NConfettiProps>('NConfetti');
