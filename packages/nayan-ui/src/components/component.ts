import { type ComponentType, createElement } from 'react';
import type { ComponentProps } from './types';
import { useComponentRenderer } from './useComponentRenderer';

/** Host tags are interpreted by the engine's React reconciler, never the DOM or RN renderer. */
export function component<P = ComponentProps>(name: string): ComponentType<P> {
  const Control = (props: P) => {
    useComponentRenderer(name);
    return createElement(name, props as Record<string, unknown>);
  };
  Control.displayName = name;
  return Control;
}
