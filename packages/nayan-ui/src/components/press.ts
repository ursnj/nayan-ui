import type { CSSProperties, ReactNode, Ref } from 'react';
import type { GestureResponderEvent, PressableProps, PressableStateCallbackType, StyleProp, View, ViewStyle } from 'react-native';
import type { ComponentProps, ComponentStyleProp } from './types';

export type NPressState = PressableStateCallbackType;
export type NPressEvent = GestureResponderEvent;
export type NPressStyle = ComponentStyleProp | StyleProp<ViewStyle>;
export type NPressRef = View | HTMLButtonElement | { id: string; kind: string };

export interface NPressProps extends Omit<PressableProps, 'children' | 'style'> {
  'ref'?: Ref<NPressRef>;
  'id'?: string;
  'className'?: string;
  'width'?: number;
  'height'?: number;
  'isDisabled'?: boolean;
  /** Retained selection semantics for engine menu/list controls. */
  'isSelected'?: boolean;
  'style'?: NPressStyle | ((state: NPressState) => NPressStyle);
  'children'?: ReactNode | ((state: NPressState) => ReactNode);
  'onAction'?: ComponentProps['onAction'];
  'onClick'?: (event: NPressEvent) => void;
  'type'?: 'button' | 'submit' | 'reset';
  'title'?: string;
  'name'?: string;
  'value'?: string;
  'form'?: string;
  'formAction'?: string;
  'formMethod'?: string;
  'popoverTarget'?: string;
  'popoverTargetAction'?: 'toggle' | 'show' | 'hide';
  'aria-describedby'?: string;
  'aria-pressed'?: boolean;
}

/** Flatten the shared style arrays without importing a native styling runtime on the web. */
export function pressStyle(style: NPressStyle): CSSProperties {
  if (Array.isArray(style)) return Object.assign({}, ...style.map(pressStyle));
  if (!style || typeof style !== 'object') return {};
  const value = { ...style } as Record<string, unknown>;
  for (const [key, sides] of [
    ['paddingHorizontal', ['paddingLeft', 'paddingRight']],
    ['paddingVertical', ['paddingTop', 'paddingBottom']],
    ['marginHorizontal', ['marginLeft', 'marginRight']],
    ['marginVertical', ['marginTop', 'marginBottom']]
  ] as const) {
    if (value[key] !== undefined) for (const side of sides) value[side] ??= value[key];
    delete value[key];
  }
  if (Array.isArray(value.transform))
    value.transform = value.transform
      .flatMap((transform: Record<string, string | number>) =>
        Object.entries(transform).map(
          ([key, amount]) => `${key}(${amount}${typeof amount === 'number' && /^(translate|perspective)/.test(key) ? 'px' : ''})`
        )
      )
      .join(' ');
  for (const key of ['elevation', 'shadowColor', 'shadowOffset', 'shadowOpacity', 'shadowRadius']) delete value[key];
  return value as CSSProperties;
}

/** Normalize browser and Rust events to the nativeEvent shape used by Pressable callbacks. */
export function pressEvent(value?: unknown): NPressEvent {
  const event = value as
    | {
        nativeEvent?: Record<string, unknown>;
        currentTarget?: EventTarget | null;
        target?: EventTarget | null;
        timeStamp?: number;
        defaultPrevented?: boolean;
        preventDefault?: () => void;
        stopPropagation?: () => void;
        persist?: () => void;
      }
    | undefined;
  if (event?.nativeEvent && 'locationX' in event.nativeEvent) return value as NPressEvent;
  const point = (event?.nativeEvent ?? value ?? {}) as {
    clientX?: number;
    clientY?: number;
    pageX?: number;
    pageY?: number;
    x?: number;
    y?: number;
    pointerId?: number;
    target?: unknown;
    timestamp?: number;
  };
  const bounds = (event?.currentTarget as HTMLElement | undefined)?.getBoundingClientRect?.();
  const x = point.x ?? point.clientX ?? 0,
    y = point.y ?? point.clientY ?? 0;
  let prevented = !!event?.defaultPrevented,
    stopped = false;
  return {
    nativeEvent: {
      locationX: bounds ? x - bounds.left : x,
      locationY: bounds ? y - bounds.top : y,
      pageX: point.pageX ?? x,
      pageY: point.pageY ?? y,
      identifier: point.pointerId ?? 0,
      timestamp: point.timestamp ?? event?.timeStamp ?? Date.now(),
      target: event?.target ?? point.target,
      touches: [],
      changedTouches: []
    },
    currentTarget: event?.currentTarget,
    target: event?.target ?? point.target,
    timeStamp: event?.timeStamp ?? Date.now(),
    bubbles: true,
    cancelable: true,
    get defaultPrevented() {
      return prevented;
    },
    eventPhase: 3,
    isTrusted: false,
    preventDefault: () => {
      prevented = true;
      event?.preventDefault?.();
    },
    stopPropagation: () => {
      stopped = true;
      event?.stopPropagation?.();
    },
    persist: () => event?.persist?.(),
    isDefaultPrevented: () => prevented,
    isPropagationStopped: () => stopped,
    type: 'press'
  } as unknown as NPressEvent;
}
