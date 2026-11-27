import { type CSSProperties, useLayoutEffect, useRef } from 'react';
import type { ViewProps } from 'react-native';
import * as binding from '../../native/core/build/web/engine_core.js';
import { prepareWasm } from '../native/wasm.web';
import type { NSafeAreaProps } from './NSafeArea';
import type { SafeAreaInsets, SafeAreaMetrics } from './safeAreaContext';
// Stable server/client first render; browser measurements replace these after hydration.
export const initialWindowMetrics: SafeAreaMetrics = {
  frame: { x: 0, y: 0, width: 0, height: 0 },
  insets: { top: 0, right: 0, bottom: 0, left: 0 }
};
const flat = (value: unknown): Record<string, unknown> =>
  Array.isArray(value) ? Object.assign({}, ...value.map(flat)) : value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
let coreReady = false;

export function SafeAreaHost({
  onChange,
  children,
  style,
  onLayout,
  testID,
  accessibilityLabel,
  ref: suppliedRef,
  ...props
}: ViewProps & {
  ref?: import('react').Ref<import('react').ComponentRef<typeof import('react-native').View>>;
  onChange(metrics: SafeAreaMetrics): void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const current = useRef({ onChange, onLayout });
  current.current = { onChange, onLayout };
  useLayoutEffect(() => {
    const element = host.current;
    if (!element) return;
    const probe = document.createElement('div');
    probe.style.cssText =
      'position:fixed;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)';
    document.body.appendChild(probe);
    let alive = true;
    let core: { safe_area_request(command: string): string } | undefined;
    const update = () => {
      if (!alive || !core) return;
      const rect = element.getBoundingClientRect(),
        css = getComputedStyle(probe);
      const insets = {
        top: parseFloat(css.paddingTop) || 0,
        right: parseFloat(css.paddingRight) || 0,
        bottom: parseFloat(css.paddingBottom) || 0,
        left: parseFloat(css.paddingLeft) || 0
      };
      const frame = { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
      current.current.onChange(
        JSON.parse(
          core.safe_area_request(
            JSON.stringify({ action: 'measure', window: { width: document.documentElement.clientWidth, height: window.innerHeight, insets }, frame })
          )
        )
      );
      current.current.onLayout?.({ nativeEvent: { layout: { x: rect.x, y: rect.y, width: rect.width, height: rect.height } } } as Parameters<
        NonNullable<ViewProps['onLayout']>
      >[0]);
    };
    void prepareWasm().then(() => {
      if (alive) {
        core = binding as unknown as typeof core;
        coreReady = true;
        update();
      }
    });
    const resize = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(update);
    resize?.observe(element);
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    // Capture ancestor scrolling as a nested provider can move without resizing.
    window.addEventListener('scroll', update, true);
    return () => {
      alive = false;
      probe.remove();
      resize?.disconnect();
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      window.removeEventListener('scroll', update, true);
    };
  }, []);
  return (
    <div
      {...(props as object)}
      data-testid={testID}
      aria-label={accessibilityLabel}
      ref={(element) => {
        host.current = element;
        if (typeof suppliedRef === 'function') suppliedRef(element as never);
        else if (suppliedRef) (suppliedRef as unknown as { current: HTMLDivElement | null }).current = element;
      }}
      style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, ...flat(style) } as CSSProperties}>
      {children}
    </div>
  );
}
export function SafeAreaView({
  insets,
  edges,
  mode = 'padding',
  style,
  ref,
  testID,
  accessibilityLabel,
  ...props
}: NSafeAreaProps & { insets: SafeAreaInsets }) {
  const base = flat(style);
  const values = Object.fromEntries(
    (['top', 'right', 'bottom', 'left'] as const).map((side) => {
      const suffix = side[0]!.toUpperCase() + side.slice(1);
      return [side, base[mode + suffix] ?? base[mode + (side === 'top' || side === 'bottom' ? 'Vertical' : 'Horizontal')] ?? base[mode] ?? 0];
    })
  );
  if (coreReady && Object.values(values).every((value) => typeof value === 'number')) {
    const resolved = JSON.parse(binding.safe_area_request(JSON.stringify({ action: 'resolve', insets, edges, base: values })));
    const spacing = Object.fromEntries(Object.entries(resolved).map(([side, value]) => [mode + side[0]!.toUpperCase() + side.slice(1), value]));
    delete base[mode + 'Horizontal'];
    delete base[mode + 'Vertical'];
    return (
      <div
        {...(props as object)}
        data-testid={testID}
        aria-label={accessibilityLabel}
        ref={ref as never}
        style={{ ...base, ...spacing } as CSSProperties}
      />
    );
  }
  const spacing = Object.fromEntries(
    (['top', 'right', 'bottom', 'left'] as const).map((side) => {
      const suffix = side[0]!.toUpperCase() + side.slice(1);
      const value = base[mode + suffix] ?? base[mode + (side === 'top' || side === 'bottom' ? 'Vertical' : 'Horizontal')] ?? base[mode] ?? 0;
      const edge =
        edges == null
          ? 'additive'
          : Array.isArray(edges)
            ? edges.includes(side)
              ? 'additive'
              : 'off'
            : ((edges as Partial<Record<string, string>>)[side] ?? 'off');
      const css = typeof value === 'number' ? `${value}px` : String(value);
      return [mode + suffix, edge === 'off' ? value : edge === 'maximum' ? `max(${css}, ${insets[side]}px)` : `calc(${css} + ${insets[side]}px)`];
    })
  );
  delete base[mode + 'Horizontal'];
  delete base[mode + 'Vertical'];
  return (
    <div
      {...(props as object)}
      data-testid={testID}
      aria-label={accessibilityLabel}
      ref={ref as never}
      style={{ ...base, ...spacing } as CSSProperties}
    />
  );
}
