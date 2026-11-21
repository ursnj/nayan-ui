import {
  createElement,
  type CSSProperties,
  type PointerEvent,
  type ReactElement,
  type Ref,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore
} from 'react';
import { component } from './component';
import type { IconHostProps } from './createIcon';
import type { NTextProps } from './NText';
import type { NViewProps } from './NView';
import { type NPressProps, pressEvent, pressStyle } from './press';
import type { ComponentStyleProp } from './types';

const colorSchemeQuery = '(prefers-color-scheme: dark)';
function subscribeColorScheme(listener: () => void) {
  const query = window.matchMedia(colorSchemeQuery);
  query.addEventListener('change', listener);
  return () => query.removeEventListener('change', listener);
}
export function usePlatformColorScheme(): 'light' | 'dark' {
  return useSyncExternalStore(
    subscribeColorScheme,
    () => (window.matchMedia(colorSchemeQuery).matches ? 'dark' : 'light'),
    () => 'light'
  );
}

export function usePlatformOverlayEnvironment(onResume: () => void): { width: number; height: number; position: 'absolute' | 'fixed' } {
  const [viewport, setViewport] = useState(() => ({
    width: typeof window === 'undefined' ? 0 : window.innerWidth,
    height: typeof window === 'undefined' ? 0 : window.innerHeight
  }));
  useEffect(() => {
    onResume();
    const resize = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    const resume = () => {
      if (document.visibilityState === 'visible') onResume();
    };
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', resume);
    return () => {
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', resume);
    };
  }, [onResume]);
  return { ...viewport, position: 'fixed' as const };
}

/** Browser overlays announce through their live region. */
export function announcePlatformMessage(_message: string) {}

/** Shared browser boundary; unused controls remain removable by the bundler. */
export function ViewHost({
  ref,
  children,
  className,
  tag,
  onSubmit,
  width,
  height,
  style,
  onLayout,
  pointerEvents,
  accessibilityLabel,
  accessibilityRole,
  accessibilityElementsHidden,
  importantForAccessibility,
  accessible: _accessible,
  testID,
  nativeID,
  collapsable: _collapsable,
  collapsableChildren: _collapsableChildren,
  ...props
}: NViewProps) {
  const element = useRef<HTMLDivElement | null>(null);
  const attach = useCallback(
    (node: HTMLDivElement | null) => {
      element.current = node;
      if (typeof ref === 'function') return (ref as (node: HTMLDivElement | null) => void | (() => void))(node);
      if (ref) (ref as React.RefObject<HTMLDivElement | null>).current = node;
    },
    [ref]
  );
  useLayoutEffect(() => {
    const node = element.current;
    if (!node || !onLayout) return;
    let previous = '';
    const measure = () => {
      const rect = node.getBoundingClientRect();
      const layout = { x: node.offsetLeft, y: node.offsetTop, width: rect.width, height: rect.height };
      const key = JSON.stringify(layout);
      if (key === previous) return;
      previous = key;
      onLayout({ nativeEvent: { layout }, target: node, currentTarget: node } as unknown as Parameters<NonNullable<NViewProps['onLayout']>>[0]);
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [onLayout]);
  return (
    <>
      <style href="nayan-view-reset" precedence="nayan-reset">
        {'@layer base{:where([data-nayan-view]){display:flex;flex-direction:column}}'}
      </style>
      {createElement(
        tag ?? 'div',
        {
          ...props,
          'ref': attach as Ref<HTMLDivElement>,
          'id': props.id ?? nativeID,
          className,
          'role': props.role ?? accessibilityRole,
          'aria-label': props['aria-label'] ?? accessibilityLabel,
          'aria-hidden':
            props['aria-hidden'] ?? (accessibilityElementsHidden || importantForAccessibility === 'no-hide-descendants' ? true : undefined),
          'data-testid': testID,
          'data-nayan-view': tag ? undefined : '',
          'style': { width, height, ...pressStyle(style), ...(pointerEvents ? { pointerEvents } : {}) } as CSSProperties,
          ...(tag === 'form' && onSubmit
            ? {
                onSubmit: (event: React.FormEvent<HTMLFormElement>) => {
                  event.preventDefault();
                  onSubmit(
                    Object.fromEntries(
                      [...new FormData(event.currentTarget)].filter((entry): entry is [string, string] => typeof entry[1] === 'string')
                    )
                  );
                }
              }
            : {})
        },
        children
      )}
    </>
  );
}

const Text = /* @__PURE__ */ component<NTextProps>('NText');
const Link = /* @__PURE__ */ component<NTextProps>('NLink');

export function TextHost({ onPress, ...props }: NTextProps) {
  return createElement(onPress ? Link : Text, { ...props, onPress });
}

/** Accessible browser Pressable, without a React Native Web or engine-surface dependency. */
export function PressHost(props: NPressProps) {
  const [pressed, setPressed] = useState(false);
  const current = useRef(props);
  current.current = props;
  const active = useRef(false),
    engaged = useRef(false),
    skipClick = useRef(false);
  const latest = useRef<unknown>(undefined);
  const pointerId = useRef<number | undefined>(undefined);
  const delay = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const long = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const disabled = !!props.disabled || !!props.isDisabled || !!props.accessibilityState?.disabled || props['aria-disabled'] === true;
  const blocked = useRef(disabled);
  blocked.current = disabled;
  const clear = useCallback(() => {
    clearTimeout(delay.current);
    clearTimeout(long.current);
    delay.current = undefined;
    long.current = undefined;
  }, []);
  const finish = useCallback(
    (cancel = false) => {
      clear();
      if (cancel && active.current) skipClick.current = true;
      active.current = false;
      pointerId.current = undefined;
      if (engaged.current) {
        engaged.current = false;
        setPressed(false);
        current.current.onPressOut?.(pressEvent(latest.current));
      }
    },
    [clear]
  );
  useEffect(() => {
    if (disabled) finish(true);
  }, [disabled, finish]);
  useEffect(() => clear, [clear]);

  const engage = () => {
    delay.current = undefined;
    if (!active.current || blocked.current || engaged.current) return;
    engaged.current = true;
    setPressed(true);
    current.current.onPressIn?.(pressEvent(latest.current));
    if (current.current.onLongPress)
      long.current = setTimeout(
        () => {
          if (!engaged.current || blocked.current) return;
          skipClick.current = true;
          current.current.onLongPress?.(pressEvent(latest.current));
        },
        Math.max(0, current.current.delayLongPress ?? 500)
      );
  };
  const begin = (event: unknown) => {
    if (blocked.current || active.current) return false;
    latest.current = pressEvent(event);
    active.current = true;
    pointerId.current = (event as { pointerId?: number }).pointerId;
    skipClick.current = false;
    const wait = Math.max(0, current.current.unstable_pressDelay ?? 0);
    if (wait) delay.current = setTimeout(engage, wait);
    else engage();
    return true;
  };
  const pointer = (event: PointerEvent<HTMLButtonElement>) => {
    latest.current = pressEvent(event);
    current.current.onPointerMove?.(event as never);
    if (pointerId.current !== undefined && event.pointerId !== pointerId.current) return;
    if (!active.current) return;
    current.current.onPressMove?.(pressEvent(event));
    const bounds = event.currentTarget.getBoundingClientRect();
    const retained = current.current.pressRetentionOffset;
    const side = (name: 'top' | 'right' | 'bottom' | 'left') =>
      typeof retained === 'number' ? retained : (retained?.[name] ?? (name === 'bottom' ? 30 : 20));
    const inside =
      event.clientX >= bounds.left - side('left') &&
      event.clientX <= bounds.right + side('right') &&
      event.clientY >= bounds.top - side('top') &&
      event.clientY <= bounds.bottom + side('bottom');
    if (!inside) {
      clear();
      if (engaged.current) {
        engaged.current = false;
        setPressed(false);
        current.current.onPressOut?.(pressEvent(event));
      }
    } else if (inside && !engaged.current) engage();
  };

  const attributes: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props))
    if (
      key.startsWith('aria-') ||
      key.startsWith('data-') ||
      ['title', 'name', 'value', 'form', 'formAction', 'formMethod', 'popoverTarget', 'popoverTargetAction'].includes(key)
    )
      attributes[key] = value;
  const state = { pressed: !disabled && (props.testOnly_pressed ?? pressed) };
  const style = pressStyle(typeof props.style === 'function' ? props.style(state) : props.style);
  const slop = props.hitSlop;
  const hit = slop
    ? Object.fromEntries(
        ['top', 'right', 'bottom', 'left'].map((side) => [
          side,
          -Math.max(0, typeof slop === 'number' ? slop : (slop[side as keyof typeof slop] ?? 0))
        ])
      )
    : undefined;
  const a11y = props.accessibilityState;
  return (
    <>
      <style href="nayan-press-reset" precedence="nayan-reset">
        {
          '@layer base{:where([data-nayan-press]){display:inline-flex;flex-direction:column;align-items:stretch;appearance:none;background:transparent;border:0;padding:0;font:inherit;color:inherit;text-align:inherit;cursor:pointer;touch-action:manipulation}:where([data-nayan-press]:disabled){cursor:default}}'
        }
      </style>
      <button
        {...attributes}
        ref={props.ref as React.Ref<HTMLButtonElement>}
        id={props.id ?? props.nativeID}
        type={props.type ?? 'button'}
        className={props.className}
        disabled={disabled}
        tabIndex={props.focusable === false ? -1 : props.tabIndex}
        role={(props.role ?? props.accessibilityRole ?? 'button') as React.AriaRole}
        aria-label={props.accessibilityLabel ?? props['aria-label']}
        aria-describedby={props['aria-describedby']}
        aria-disabled={disabled || undefined}
        aria-busy={props['aria-busy'] ?? a11y?.busy}
        aria-expanded={props['aria-expanded'] ?? a11y?.expanded}
        aria-checked={props['aria-checked'] ?? a11y?.checked}
        aria-selected={props['aria-selected'] ?? a11y?.selected}
        aria-hidden={
          props['aria-hidden'] ?? (props.accessibilityElementsHidden || props.importantForAccessibility === 'no-hide-descendants' ? true : undefined)
        }
        data-testid={props.testID}
        data-nayan-press=""
        data-pressed={state.pressed || undefined}
        title={props.accessibilityHint ?? (attributes.title as string | undefined)}
        style={
          {
            ...(hit ? { position: 'relative' } : {}),
            width: props.width,
            height: props.height,
            ...style
          } as CSSProperties
        }
        onPointerDown={(event) => {
          props.onPointerDown?.(event as never);
          if (event.button !== 0 || event.isPrimary === false || disabled) return;
          if (!begin(event)) return;
          try {
            event.currentTarget.setPointerCapture(event.pointerId);
          } catch {
            /* Older browsers may not support pointer capture. */
          }
        }}
        onPointerMove={pointer}
        onPointerUp={(event) => {
          props.onPointerUp?.(event as never);
          if (pointerId.current !== undefined && event.pointerId !== pointerId.current) return;
          if (!active.current) return;
          latest.current = pressEvent(event);
          const cancelled = !engaged.current;
          // A quick release still activates a delayed press, as native Pressable does.
          if (cancelled && delay.current && !blocked.current) engage();
          finish(cancelled && !engaged.current);
        }}
        onPointerCancel={(event) => {
          props.onPointerCancel?.(event as never);
          if (pointerId.current !== undefined && event.pointerId !== pointerId.current) return;
          latest.current = pressEvent(event);
          finish(true);
        }}
        onLostPointerCapture={(event) => {
          if (pointerId.current !== undefined && event.pointerId !== pointerId.current) return;
          if (active.current) finish(true);
        }}
        onPointerEnter={(event) => {
          props.onPointerEnter?.(event as never);
          if (!disabled && event.pointerType !== 'touch') props.onHoverIn?.(pressEvent(event) as never);
        }}
        onPointerLeave={(event) => {
          props.onPointerLeave?.(event as never);
          if (!disabled && event.pointerType !== 'touch') props.onHoverOut?.(pressEvent(event) as never);
        }}
        onFocus={(event) => props.onFocus?.(pressEvent(event) as never)}
        onBlur={(event) => {
          finish(true);
          props.onBlur?.(pressEvent(event) as never);
        }}
        onKeyDown={(event) => {
          props.onKeyDown?.(event as never);
          if (!event.defaultPrevented && !event.repeat && (event.key === ' ' || event.key === 'Enter')) begin(event);
        }}
        onKeyUp={(event) => {
          props.onKeyUp?.(event as never);
          if (event.key === ' ' || event.key === 'Enter') {
            latest.current = pressEvent(event);
            finish();
          }
        }}
        onClick={(event) => {
          if (disabled || skipClick.current) {
            skipClick.current = false;
            event.preventDefault();
            return;
          }
          (props.onPress ?? props.onClick ?? props.onAction)?.(pressEvent(event));
        }}
        onContextMenu={(event) => {
          if (props.onLongPress) event.preventDefault();
        }}>
        {hit && <span aria-hidden="true" style={{ position: 'absolute', ...hit }} />}
        {typeof props.children === 'function' ? props.children(state) : props.children}
      </button>
    </>
  );
}

function flatten(style: ComponentStyleProp): CSSProperties {
  if (Array.isArray(style)) return Object.assign({}, ...style.map(flatten));
  return style && typeof style === 'object' ? (style as CSSProperties) : {};
}

/** Browser attachment using the same bundled outlines as the Rust UI renderer. */
export function IconHost({
  outline,
  name,
  size = 24,
  width = size,
  height = size,
  color = 'currentColor',
  style,
  className,
  id,
  onPress,
  accessibilityLabel,
  strokeWidth,
  fillRule
}: IconHostProps): ReactElement {
  const label = accessibilityLabel ?? (onPress ? name : undefined);
  const shared = {
    id,
    className,
    'aria-label': label,
    'aria-hidden': label ? undefined : true,
    'style': {
      display: 'inline-block',
      width,
      height,
      verticalAlign: 'middle',
      flexShrink: 0,
      ...flatten(style)
    }
  };
  const icon = outline
    ? createElement(
        'svg',
        {
          ...shared,
          role: label ? 'img' : undefined,
          viewBox: Array.isArray(outline.viewBox) ? outline.viewBox.join(' ') : `0 0 ${outline.viewBox ?? 24} ${outline.viewBox ?? 24}`,
          width,
          height,
          color,
          fill: strokeWidth ? 'none' : 'currentColor',
          stroke: strokeWidth ? 'currentColor' : undefined,
          strokeWidth,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          fillRule
        },
        ...(typeof outline.paths === 'string' ? [outline.paths] : outline.paths).map((path, key) => createElement('path', { key, d: path }))
      )
    : createElement('span', { ...shared, role: label ? 'img' : undefined, style: { color, ...shared.style, fontSize: size, lineHeight: 1 } }, name);
  return onPress
    ? createElement(
        'button',
        {
          'type': 'button',
          'onClick': onPress,
          'aria-label': label,
          'style': {
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            border: 0,
            background: 'transparent',
            color,
            cursor: 'pointer'
          }
        },
        icon
      )
    : icon;
}
