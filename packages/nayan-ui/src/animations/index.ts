import type { AnimateOptions, AnimateTarget, ClipOptions, Entity, Keyframe } from '../games/world/types';
import type { World } from '../games/world/World';
import { type AnimationViewTarget, playSequence, resolveView, type ViewAnimationSequence, type ViewPlaybackOptions } from './playback';
import { type ViewAnimationPreset, viewPresets } from './presets';
import { captureSharedElement, transitionSharedElement } from './sharedElement';
import type { ViewAnimationOptions, ViewAnimationValues } from './view';

export { viewPresets, type ViewAnimationPreset } from './presets';
export { captureSharedElement, transitionSharedElement, type SharedElementSnapshot } from './sharedElement';
export type { AnimationViewTarget, ViewAnimationSequence, ViewAnimationStep, ViewAnimationTarget, ViewPlaybackOptions } from './playback';

export { AnimationView, type AnimationViewProps } from './AnimationView';
export { useAnimatedStyle, useSharedValue, withSpring, withTiming } from './view';
export type {
  AnimatedViewStyle,
  AnimationViewRef,
  SharedValue,
  TimingAnimation,
  ViewAnimationEasing,
  ViewAnimationHandle,
  ViewAnimationOptions,
  ViewAnimationValues,
  ViewBounds,
  ViewSpringOptions
} from './view';

export type { ModelClip } from '../games/assets/model';
export type { AnimateOptions, AnimateTarget, ClipOptions, Easing, Keyframe, SpringOptions } from '../games/world/types';

/** Animation controls for React views and Rust-backed game entities. */
export const animations = {
  /** Animate a mounted AnimationView. Pass its ref or its current handle. */
  animateView(view: AnimationViewTarget, to: Partial<ViewAnimationValues>, options?: ViewAnimationOptions) {
    return resolveView(view).animate(to, options);
  },

  /** Play a preset or a custom sequence with optional delay, repeat and reverse playback. */
  playView(view: AnimationViewTarget, preset: ViewAnimationPreset | ViewAnimationSequence, options?: ViewPlaybackOptions) {
    if (typeof preset === 'string' && !Object.hasOwn(viewPresets, preset)) throw new TypeError('Unknown view animation preset');
    return playSequence(resolveView(view), typeof preset === 'string' ? viewPresets[preset] : preset, options);
  },

  captureSharedElement,
  transitionSharedElement,

  /** Tween one or more entities. Resolves when the last track finishes, is replaced, or is stopped. */
  animate(world: World, targets: Entity | readonly Entity[], to: AnimateTarget | readonly Keyframe[], options?: AnimateOptions): Promise<void> {
    return world.animate(targets, to, options);
  },

  /** Stops an entity's tweens at their current values. */
  stopAnimation(world: World, entity: Entity): void {
    world.stopAnimation(entity);
  },

  /** Plays a named glTF clip with optional looping, speed, seeking and crossfade. */
  playClip(world: World, entity: Entity, clip: string, options?: ClipOptions): boolean {
    return world.playClip(entity, clip, options);
  },

  /** Holds the current skeletal pose, or returns to the bind pose with reset. */
  stopClip(world: World, entity: Entity, reset?: boolean): boolean {
    return world.stopClip(entity, reset);
  }
};
