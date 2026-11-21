import type { ComponentRef, Ref } from 'react';
import { requireNativeComponent, StyleSheet, UIManager, View, type ViewProps } from 'react-native';
import NativeEngine from '../native/NativeNayanEngine';
import type { NSafeAreaProps } from './NSafeArea';
import type { SafeAreaInsets, SafeAreaMetrics } from './safeAreaContext';

const Host = /* @__PURE__ */ requireNativeComponent<
  ViewProps & { onMetricsChange(event: { nativeEvent: SafeAreaMetrics | { metrics: string } }): void }
>('NayanEngineSafeArea');
export const initialWindowMetrics: SafeAreaMetrics | null =
  (UIManager.getViewManagerConfig('NayanEngineSafeArea') as { Constants?: { initialWindowMetrics?: SafeAreaMetrics } } | null)?.Constants
    ?.initialWindowMetrics ?? null;
export function SafeAreaHost({
  onChange,
  children,
  ...props
}: ViewProps & { ref?: Ref<ComponentRef<typeof View>>; onChange(metrics: SafeAreaMetrics): void }) {
  return (
    <View {...props}>
      {/* Keep the measuring view out of Fabric's responder path. App children stay in a normal View. */}
      <Host
        pointerEvents="none"
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        testID={props.testID ? `${props.testID}-metrics` : undefined}
        style={StyleSheet.absoluteFill}
        onMetricsChange={({ nativeEvent }) => {
          if ('metrics' in nativeEvent) {
            const result = JSON.parse(nativeEvent.metrics);
            if (result.ok) onChange(result.value);
          } else onChange(nativeEvent);
        }}
      />
      {children}
    </View>
  );
}
export function SafeAreaView({ insets, edges, mode = 'padding', style, ...props }: NSafeAreaProps & { insets: SafeAreaInsets }) {
  if (!NativeEngine?.safeAreaRequest) throw new Error('NSafeArea requires a native app rebuilt with safe-area support');
  const flat = StyleSheet.flatten(style as ViewProps['style']) ?? {};
  const base = Object.fromEntries(
    ['Top', 'Right', 'Bottom', 'Left'].map((side) => {
      const value =
        flat[`${mode}${side}` as keyof typeof flat] ??
        flat[`${mode}${side === 'Top' || side === 'Bottom' ? 'Vertical' : 'Horizontal'}` as keyof typeof flat] ??
        flat[mode];
      if (value != null && typeof value !== 'number') throw new Error('NSafeArea spacing must use numeric points');
      return [side.toLowerCase(), value ?? 0];
    })
  );
  const result = JSON.parse(NativeEngine.safeAreaRequest(JSON.stringify({ action: 'resolve', insets, edges, base })));
  if (!result.ok) throw new Error(result.error);
  const spacing = Object.fromEntries(
    Object.entries(result.value).map(([side, value]) => [`${mode}${side[0]!.toUpperCase()}${side.slice(1)}`, value])
  );
  return <View {...props} style={[style as ViewProps['style'], spacing]} />;
}
