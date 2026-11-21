'use client';

import { reducedMotionQuery } from '../native/reducedMotion.web';
import { type ComponentPropsWithoutRef, createElement, type ReactElement, type Ref, useRef } from 'react';
import { browserSpring } from './spring';
import {
  angleKeys,
  type AnimatedViewStyle,
  type AnimationViewRef,
  easingCurves,
  initialViewValues,
  useViewAnimation,
  type ViewAnimationValues,
  viewKeys
} from './view';

export interface AnimationViewProps extends ComponentPropsWithoutRef<'div'> {
  ref?: Ref<AnimationViewRef>;
  initial?: Partial<ViewAnimationValues>;
  animatedStyle?: AnimatedViewStyle;
}

const properties = {
  opacity: 'opacity',
  translateX: '--nayan-animate-x',
  translateY: '--nayan-animate-y',
  scale: 'scale',
  scaleX: '--nayan-animate-sx',
  scaleY: '--nayan-animate-sy',
  rotate: 'rotate',
  rotateX: '--nayan-animate-rx',
  rotateY: '--nayan-animate-ry',
  skewX: '--nayan-animate-kx',
  skewY: '--nayan-animate-ky'
} as const;
const angleSet = new Set<keyof ViewAnimationValues>(angleKeys);
const registered = new WeakMap<Document, Set<string>>();

function registerTransform(view: HTMLElement, key: keyof ViewAnimationValues, name: string): boolean {
  const document = view.ownerDocument;
  const css = document.defaultView?.CSS;
  if (typeof css?.registerProperty !== 'function') return false;
  const keys = registered.get(document) ?? new Set<string>();
  if (!keys.has(name)) {
    const syntax = angleSet.has(key) ? '<angle>' : key === 'scaleX' || key === 'scaleY' ? '<number>' : '<length>';
    try {
      css.registerProperty({ name, syntax, inherits: false, initialValue: styleValue(key, 0) });
    } catch (error) {
      if (!error || typeof error !== 'object' || !('name' in error) || error.name !== 'InvalidModificationError') throw error;
    }
    keys.add(name);
    registered.set(document, keys);
  }
  return true;
}

function styleValue(key: keyof ViewAnimationValues, value: number): string {
  if (key === 'translateX' || key === 'translateY') return `${value}px`;
  if (angleSet.has(key)) return `${value}deg`;
  return String(value);
}

export function AnimationView({ ref, initial, animatedStyle, style, ...props }: AnimationViewProps): ReactElement {
  const element = useRef<HTMLDivElement>(null);
  const reducedMotion = () => !!element.current?.ownerDocument.defaultView?.matchMedia?.(reducedMotionQuery).matches;
  const initialStyle = useRef<React.CSSProperties | null>(null);
  if (!initialStyle.current) {
    const start = initialViewValues(initial, animatedStyle);
    initialStyle.current = {
      ...Object.fromEntries(viewKeys.map((key) => [properties[key], styleValue(key, start[key])])),
      translate: `var(${properties.translateX}) var(${properties.translateY})`,
      transform: `scaleX(var(${properties.scaleX})) scaleY(var(${properties.scaleY})) rotateX(var(${properties.rotateX})) rotateY(var(${properties.rotateY})) skewX(var(${properties.skewX})) skewY(var(${properties.skewY}))`
    };
  }

  useViewAnimation(
    ref,
    animatedStyle,
    (key, to, options, done) => {
      const view = element.current!;
      const property = properties[key];
      const destination = styleValue(key, to);
      const window = view.ownerDocument.defaultView;
      const current = () => window?.getComputedStyle(view).getPropertyValue(property).trim() || view.style.getPropertyValue(property);
      const reduced = options.reduceMotion === 'always' || (options.reduceMotion === 'system' && reducedMotion());
      if (
        !options.duration ||
        reduced ||
        typeof view.animate !== 'function' ||
        (property.startsWith('--') && !registerTransform(view, key, property))
      ) {
        view.style.setProperty(property, destination);
        done(true);
        return () => {};
      }
      const spring = options.spring && browserSpring(options.spring, options.duration);
      const easing =
        spring && view.ownerDocument.defaultView?.CSS?.supports?.('animation-timing-function', spring)
          ? spring
          : `cubic-bezier(${easingCurves[options.easing].join(',')})`;
      const animation = view.animate(
        { [property]: [current(), destination] },
        {
          duration: options.duration,
          easing,
          fill: 'forwards'
        }
      );
      let canceled = false;
      void animation.finished.then(
        () => {
          if (canceled) return;
          view.style.setProperty(property, destination);
          animation.cancel();
          done(true);
        },
        () => done(false)
      );
      return () => {
        canceled = true;
        view.style.setProperty(property, current());
        animation.cancel();
      };
    },
    async () => {
      const bounds = element.current?.getBoundingClientRect();
      return bounds ? { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height } : null;
    },
    reducedMotion
  );

  return createElement('div', { ...props, ref: element, style: { ...style, ...initialStyle.current } });
}
