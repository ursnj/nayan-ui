'use client';
import { type ComponentRef, type Ref, useCallback, useContext, useMemo, useState } from 'react';
import type { StyleProp, View, ViewProps, ViewStyle } from 'react-native';
import { NView } from './NView';
import {
  type SafeAreaEdges,
  SafeAreaFrameContext,
  SafeAreaInsetsContext,
  type SafeAreaMetrics,
  sameSafeArea,
  useNSafeAreaInsets
} from './safeAreaContext';
import { initialWindowMetrics, SafeAreaHost, SafeAreaView } from './SafeAreaHost';
import { ComponentRenderContext } from './ThemeContext';
import type { ComponentProps, ComponentStyle } from './types';
export { initialWindowMetrics } from './SafeAreaHost';
export { useNSafeAreaInsets, useNSafeAreaFrame, SafeAreaInsetsContext, SafeAreaFrameContext } from './safeAreaContext';
export type { SafeAreaMetrics, SafeAreaInsets, SafeAreaFrame, SafeAreaEdge, SafeAreaEdgeMode, SafeAreaEdges } from './safeAreaContext';

export interface NSafeAreaProviderProps extends ViewProps {
  ref?: Ref<ComponentRef<typeof View>>;
  initialMetrics?: SafeAreaMetrics | null;
  initialSafeAreaInsets?: SafeAreaMetrics['insets'] | null;
}
/** Mount once around a native app, and around separately positioned native modal content. */
export function NSafeAreaProvider({ children, style, initialMetrics, initialSafeAreaInsets, ...props }: NSafeAreaProviderProps) {
  const parentInsets = useContext(SafeAreaInsetsContext),
    parentFrame = useContext(SafeAreaFrameContext);
  const initial = initialMetrics ?? (parentInsets && parentFrame ? { insets: parentInsets, frame: parentFrame } : initialWindowMetrics);
  const [metrics, setMetrics] = useState<SafeAreaMetrics | null>(
    initialSafeAreaInsets && initial ? { ...initial, insets: initialSafeAreaInsets } : initial
  );
  const change = useCallback((next: SafeAreaMetrics) => setMetrics((previous) => (previous && sameSafeArea(previous, next) ? previous : next)), []);
  const insets = useMemo(() => metrics?.insets, [metrics?.insets.top, metrics?.insets.right, metrics?.insets.bottom, metrics?.insets.left]);
  const frame = useMemo(() => metrics?.frame, [metrics?.frame.x, metrics?.frame.y, metrics?.frame.width, metrics?.frame.height]);
  return (
    <SafeAreaHost {...props} style={[{ flex: 1 }, style]} onChange={change}>
      {insets && frame && (
        <SafeAreaFrameContext.Provider value={frame}>
          <SafeAreaInsetsContext.Provider value={insets}>{children}</SafeAreaInsetsContext.Provider>
        </SafeAreaFrameContext.Provider>
      )}
    </SafeAreaHost>
  );
}
export interface NSafeAreaProps extends Omit<ViewProps, 'style'> {
  ref?: Ref<ComponentRef<typeof View>>;
  className?: string;
  edges?: SafeAreaEdges;
  mode?: 'padding' | 'margin';
  style?: StyleProp<ViewStyle>;
}
/** Add selected safe-area edges to existing spacing; use maximum to enforce a minimum gap. */
export function NSafeArea({ edges, mode = 'padding', style, ...props }: NSafeAreaProps) {
  const insets = useNSafeAreaInsets();
  const rendering = useContext(ComponentRenderContext);
  if (rendering) return <NView {...(props as ComponentProps)} style={style as ComponentStyle} {...{ safeArea: { insets, edges, mode } }} />;
  return <SafeAreaView {...props} style={style} insets={insets} edges={edges} mode={mode} />;
}
export function NSafeAreaListener({ onChange, ...props }: ViewProps & { onChange(metrics: SafeAreaMetrics): void }) {
  return <SafeAreaHost {...props} style={[{ flex: 1 }, props.style]} onChange={onChange} />;
}
