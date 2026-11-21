'use client';

import { component } from './component';
import type { ComponentControlProps } from './types';

export interface NCarouselProps extends ComponentControlProps<number> {
  /** Direction of swipe/paging; the same Rust state owns snapping and accessibility. */
  orientation?: 'horizontal' | 'vertical';
  /** Advance while visible and enabled. Pause this when the host screen loses focus. */
  autoPlay?: boolean;
  /** Milliseconds between slides. Default: 5000. */
  interval?: number;
  showIndicators?: boolean;
  /** `overlay` draws the page dots over the slides instead of in a 44-point strip below them. */
  indicatorPlacement?: 'below' | 'overlay';
  /** Overlay dot color (CSS). Default: the theme foreground. */
  indicatorColor?: string;
  /** Soft shadow behind overlay dots (CSS). */
  indicatorShadowColor?: string;
  /** Overlay dots' distance from the bottom edge. Default: 16. */
  indicatorInset?: number;
  /** Space between overlay dots. Default: 8. */
  indicatorGap?: number;
}

/** Horizontal paging, snapping, indicators and autoplay are owned by Rust. */
export const NCarousel = /* @__PURE__ */ component<NCarouselProps>('NCarousel');
