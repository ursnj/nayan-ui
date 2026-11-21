import type { ViewAnimationSequence, ViewAnimationTarget } from './playback';
import type { ViewAnimationOptions } from './view';

function tween(initial: ViewAnimationTarget, to: ViewAnimationTarget, duration = 260, motion: ViewAnimationOptions = {}): ViewAnimationSequence {
  return { initial, steps: [{ to, duration, ...motion }] };
}

function slide(axis: 'translateX' | 'translateY', delta: number, exit: boolean, fade = false): ViewAnimationSequence {
  const edge = { [axis]: delta, ...(fade ? { opacity: 0 } : {}) };
  const rest = { [axis]: 0, ...(fade ? { opacity: 1 } : {}) };
  return exit ? tween(rest, edge, 230, { easing: 'easeIn' }) : tween(edge, rest);
}

function zoom(start: number, exit: boolean, bounce = false): ViewAnimationSequence {
  const edge = { opacity: 0, scale: start };
  const rest = { opacity: 1, scale: 1 };
  if (exit) return tween(rest, edge, 200, { easing: 'easeIn' });
  return bounce ? tween(edge, rest, 550, { spring: { damping: 12 } }) : tween(edge, rest);
}

function flip(axis: 'rotateX' | 'rotateY', exit: boolean): ViewAnimationSequence {
  const edge = { [axis]: exit ? -90 : 90, opacity: 0 };
  const rest = { [axis]: 0, opacity: 1 };
  return exit ? tween(rest, edge, 270, { easing: 'easeIn' }) : tween(edge, rest, 340);
}

function frames(initial: ViewAnimationTarget, points: readonly ViewAnimationTarget[], duration: number): ViewAnimationSequence {
  return { initial, steps: points.map((to) => ({ to, duration, easing: 'easeInOut' })) };
}

/** Ready-to-play entrances, exits and attention effects. */
export const viewPresets = {
  fadeIn: tween({ opacity: 0 }, { opacity: 1 }),
  fadeOut: tween({ opacity: 1 }, { opacity: 0 }, 200, { easing: 'easeIn' }),
  fadeInUp: slide('translateY', 24, false, true),
  fadeInDown: slide('translateY', -24, false, true),
  fadeInLeft: slide('translateX', -24, false, true),
  fadeInRight: slide('translateX', 24, false, true),
  fadeOutUp: slide('translateY', -24, true, true),
  fadeOutDown: slide('translateY', 24, true, true),
  fadeOutLeft: slide('translateX', -24, true, true),
  fadeOutRight: slide('translateX', 24, true, true),
  slideInUp: slide('translateY', 48, false),
  slideInDown: slide('translateY', -48, false),
  slideInLeft: slide('translateX', -48, false),
  slideInRight: slide('translateX', 48, false),
  slideOutUp: slide('translateY', -48, true),
  slideOutDown: slide('translateY', 48, true),
  slideOutLeft: slide('translateX', -48, true),
  slideOutRight: slide('translateX', 48, true),
  zoomIn: zoom(0.75, false),
  zoomOut: zoom(0.75, true),
  zoomInFromLarge: zoom(1.25, false),
  zoomOutToLarge: zoom(1.25, true),
  bounceIn: zoom(0.65, false, true),
  bounceOut: frames(
    { scale: 1, opacity: 1 },
    [
      { scale: 1.15, opacity: 1 },
      { scale: 0.55, opacity: 0 }
    ],
    140
  ),
  flipInX: flip('rotateX', false),
  flipInY: flip('rotateY', false),
  flipOutX: flip('rotateX', true),
  flipOutY: flip('rotateY', true),
  rotateIn: tween({ rotate: -35, opacity: 0, scale: 0.85 }, { rotate: 0, opacity: 1, scale: 1 }),
  rotateOut: tween({ rotate: 0, opacity: 1, scale: 1 }, { rotate: 35, opacity: 0, scale: 0.85 }, 240, { easing: 'easeIn' }),
  spin: tween({ rotate: 0 }, { rotate: 360 }, 600, { easing: 'linear' }),
  pulse: frames({ scale: 1 }, [{ scale: 1.09 }, { scale: 1 }], 220),
  heartbeat: frames({ scale: 1 }, [{ scale: 1.13 }, { scale: 1 }, { scale: 1.07 }, { scale: 1 }], 145),
  shakeX: frames(
    { translateX: 0 },
    [-9, 9, -7, 7, -3, 0].map((translateX) => ({ translateX })),
    56
  ),
  shakeY: frames(
    { translateY: 0 },
    [-9, 9, -7, 7, -3, 0].map((translateY) => ({ translateY })),
    56
  ),
  wobble: frames(
    { rotate: 0 },
    [-9, 8, -5, 3, 0].map((rotate) => ({ rotate })),
    85
  ),
  swing: frames(
    { rotate: 0 },
    [13, -10, 6, -3, 0].map((rotate) => ({ rotate })),
    95
  ),
  bounce: frames(
    { translateY: 0 },
    [-19, 0, -9, 0].map((translateY) => ({ translateY })),
    125
  ),
  flash: frames(
    { opacity: 1 },
    [0.35, 1, 0.35, 1].map((opacity) => ({ opacity })),
    100
  ),
  float: frames({ translateY: 0 }, [{ translateY: -8 }, { translateY: 0 }], 600),
  rubberBand: frames(
    { scaleX: 1, scaleY: 1 },
    [
      { scaleX: 1.22, scaleY: 0.8 },
      { scaleX: 0.91, scaleY: 1.12 },
      { scaleX: 1, scaleY: 1 }
    ],
    150
  ),
  jiggle: frames(
    { skewX: 0, scale: 1 },
    [
      { skewX: 8, scale: 1.06 },
      { skewX: -6, scale: 0.97 },
      { skewX: 0, scale: 1 }
    ],
    125
  )
} satisfies Record<string, ViewAnimationSequence>;

export type ViewAnimationPreset = keyof typeof viewPresets;
