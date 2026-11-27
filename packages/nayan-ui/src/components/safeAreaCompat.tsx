/** Playtura's Metro adapter for navigation packages that import the former safe-area API. */
import { type ComponentType, createElement } from 'react';
import { type SafeAreaInsets, SafeAreaInsetsContext, useNSafeAreaInsets } from './safeAreaContext';
export {
  NSafeArea as SafeAreaView,
  NSafeAreaProvider as SafeAreaProvider,
  NSafeAreaListener as SafeAreaListener,
  initialWindowMetrics
} from './NSafeArea';
export type { NSafeAreaProps as SafeAreaViewProps, NSafeAreaProviderProps as SafeAreaProviderProps } from './NSafeArea';
export {
  SafeAreaInsetsContext,
  SafeAreaFrameContext,
  useNSafeAreaInsets as useSafeAreaInsets,
  useNSafeAreaFrame as useSafeAreaFrame,
  useNSafeAreaInsets as useSafeArea
} from './safeAreaContext';
export type {
  SafeAreaInsets as EdgeInsets,
  SafeAreaFrame as Rect,
  SafeAreaMetrics as Metrics,
  SafeAreaEdge as Edge,
  SafeAreaEdgeMode as EdgeMode
} from './safeAreaContext';
export const SafeAreaContext = SafeAreaInsetsContext;
export const SafeAreaConsumer = SafeAreaInsetsContext.Consumer;
export function withSafeAreaInsets<P extends object>(Component: ComponentType<P & { insets: SafeAreaInsets }>) {
  return (props: P) => createElement(Component, { ...props, insets: useNSafeAreaInsets() });
}
