'use client';

import { createElement, type ReactElement, type Ref, useEffect, useMemo, useRef } from 'react';
import type { Animated, ViewProps } from 'react-native';
import { springCurve } from './spring';
import {
  type AnimatedViewStyle,
  type AnimationViewRef,
  easingCurves,
  initialViewValues,
  useViewAnimation,
  type ViewAnimationValues,
  viewKeys
} from './view';

export interface AnimationViewProps extends Omit<ViewProps, 'ref'> {
  ref?: Ref<AnimationViewRef>;
  initial?: Partial<ViewAnimationValues>;
  animatedStyle?: AnimatedViewStyle;
}

export function AnimationView({ ref, initial, animatedStyle, style, ...props }: AnimationViewProps): ReactElement {
  const { AccessibilityInfo, Animated, Easing } = require('react-native') as typeof import('react-native');
  const element = useRef<React.ComponentRef<typeof Animated.View>>(null);
  const start = useRef<ViewAnimationValues | null>(null);
  start.current ??= initialViewValues(initial, animatedStyle);
  const [values, transforms] = useMemo(() => {
    const numbers = Object.fromEntries(viewKeys.map((key) => [key, new Animated.Value(start.current![key])])) as Record<
      keyof ViewAnimationValues,
      Animated.Value
    >;
    const angle = (key: keyof ViewAnimationValues) =>
      numbers[key].interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '1deg']
      });
    const { translateX, translateY, scale, scaleX, scaleY } = numbers;
    return [
      numbers,
      [
        { translateX },
        { translateY },
        { rotate: angle('rotate') },
        { scale },
        { scaleX },
        { scaleY },
        { rotateX: angle('rotateX') },
        { rotateY: angle('rotateY') },
        { skewX: angle('skewX') },
        { skewY: angle('skewY') }
      ]
    ] as const;
  }, [Animated]);
  const reducedMotion = useRef(false);
  useEffect(() => {
    let current = true;
    let receivedEvent = false;
    const listener = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      receivedEvent = true;
      reducedMotion.current = enabled;
    });
    void AccessibilityInfo.isReduceMotionEnabled().then(
      (enabled) => {
        if (current && !receivedEvent) reducedMotion.current = enabled;
      },
      () => {}
    );
    return () => {
      current = false;
      listener.remove();
    };
  }, [AccessibilityInfo]);

  useViewAnimation(
    ref,
    animatedStyle,
    (key, to, options, done) => {
      const value = values[key];
      if (!options.duration || options.reduceMotion === 'always' || (options.reduceMotion === 'system' && reducedMotion.current)) {
        value.setValue(to);
        done(true);
        return () => {};
      }
      const motion = Animated.timing(value, {
        toValue: to,
        duration: options.duration,
        easing: options.spring ? springCurve(options.spring, options.duration) : Easing.bezier(...easingCurves[options.easing]),
        isInteraction: false,
        useNativeDriver: true
      });
      motion.start(({ finished }) => done(finished));
      return () => motion.stop();
    },
    () =>
      new Promise((resolve) => {
        const view = element.current;
        if (!view?.measureInWindow) return resolve(null);
        // An offscreen native view can detach before Fabric supplies its measurement.
        const timeout = setTimeout(() => resolve(null), 500);
        view.measureInWindow((x, y, width, height) => {
          clearTimeout(timeout);
          resolve({ x, y, width, height });
        });
      }),
    () => reducedMotion.current
  );

  return createElement(Animated.View, {
    ...props,
    collapsable: ref ? false : props.collapsable,
    ref: element,
    style: [style, { opacity: values.opacity, transform: transforms }]
  });
}
