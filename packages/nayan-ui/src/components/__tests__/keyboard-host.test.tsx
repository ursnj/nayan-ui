import { act, forwardRef, type ReactNode, useImperativeHandle, useRef } from 'react';
import { afterAll, expect, mock, test } from 'bun:test';
import { installDom } from '../../__tests__/dom';
import type { ComponentDocument } from '../ComponentDocument';
import { KeyboardStore } from '../keyboardStore';
import { KeyboardContext } from '../theme/contexts';
import type { ComponentSemantic, ComponentSnapshot } from '../types';

type InputProps = {
  autoFocus?: boolean;
  accessibilityLabel: string;
  defaultValue: string;
  onFocus(): void;
  onBlur(): void;
  onSubmitEditing?(): void;
  pointerEvents: string;
};
const inputs = new Map<string, InputProps>();
type KeyboardTestEvent = { endCoordinates: { height: number; screenY?: number } };
const events = new Map<string, (event: KeyboardTestEvent) => void>();
let platform = 'ios';
let avoiding: { behavior?: string; enabled: boolean; keyboardVerticalOffset: number; style: { paddingBottom: number } };
const dismiss = mock(() => {});
const animate = mock(() => {});
let hostHeight = 640;
let hostLayout: (() => void) | undefined;
const Box = forwardRef(({ children, onLayout }: { children?: ReactNode; onLayout?: () => void }, ref) => {
  if (onLayout) hostLayout = onLayout;
  useImperativeHandle(ref, () => ({
    measureInWindow: (callback: (x: number, y: number, width: number, height: number) => void) => callback(0, 96, 360, hostHeight)
  }));
  return <div>{children}</div>;
});
mock.module('react-native', () => ({
  View: Box,
  KeyboardAvoidingView: (props: typeof avoiding & { children?: ReactNode }) => {
    avoiding = props;
    return <div>{props.children}</div>;
  },
  Dimensions: { get: () => ({ height: 800 }) },
  Platform: {
    get OS() {
      return platform;
    }
  },
  Keyboard: {
    dismiss,
    metrics: () => undefined,
    isVisible: () => true,
    scheduleLayoutAnimation: animate,
    addListener: (name: string, callback: (event: KeyboardTestEvent) => void) => {
      events.set(name, callback);
      return {
        remove: () => {
          events.delete(name);
        }
      };
    }
  },
  AppState: { addEventListener: () => ({ remove() {} }) },
  TextInput: forwardRef((props: InputProps, ref) => {
    inputs.set(props.accessibilityLabel, props);
    const input = useRef<HTMLInputElement>(null);
    useImperativeHandle(ref, () => ({ focus: () => input.current?.focus(), setNativeProps: () => {} }));
    return (
      <input
        ref={input}
        autoFocus={props.autoFocus}
        aria-label={props.accessibilityLabel}
        defaultValue={props.defaultValue}
        onFocus={props.onFocus}
        onBlur={props.onBlur}
      />
    );
  }),
  AccessibilityInfo: {
    isReduceMotionEnabled: async () => false,
    isScreenReaderEnabled: async () => false,
    addEventListener: () => ({ remove() {} })
  },
  BackHandler: { addEventListener: () => ({ remove() {} }) },
  Linking: { openURL: () => {} },
  useColorScheme: () => 'light',
  useWindowDimensions: () => ({ fontScale: 1 })
}));
mock.module('../../native/surface/DocumentSurface', () => ({ DocumentSurface: () => null }));
const dom = installDom();
const { createRoot } = await import('react-dom/client');
const { KeyboardHost } = await import('../KeyboardHost');
const { ComponentHost } = await import('../ComponentHost');
afterAll(() => dom.cleanup());

const field = (id: string): ComponentSemantic => ({
  id,
  kind: 'NInput',
  label: id,
  value: '',
  disabled: false,
  readOnly: false,
  secret: false,
  multiline: false,
  rect: [0, 0, 200, 48],
  inputType: 'text',
  maxLength: null,
  platformEdit: false,
  min: 0,
  max: 100,
  step: 1
});

test('OS transitions update state, animate iOS layout once, and Android relies on resize', async () => {
  const root = createRoot(document.createElement('div'));
  const controller = new KeyboardStore(dismiss);
  try {
    await act(async () =>
      root.render(
        <KeyboardHost controller={controller} enabled offset={64} toolbar={null}>
          <div />
        </KeyboardHost>
      )
    );
    expect(avoiding.behavior).toBe('padding');
    expect(avoiding.keyboardVerticalOffset).toBe(64);
    await act(async () =>
      root.render(
        <KeyboardHost controller={controller} enabled toolbar={null}>
          <div />
        </KeyboardHost>
      )
    );
    await act(async () => hostLayout?.());
    expect(avoiding.keyboardVerticalOffset).toBe(96);
    await act(async () => events.get('keyboardWillShow')!({ endCoordinates: { height: 320 } }));
    expect(controller.getSnapshot()).toMatchObject({ visible: true, height: 320 });
    expect(animate).toHaveBeenCalledTimes(1);
    await act(async () => events.get('keyboardWillHide')!({ endCoordinates: { height: 0 } }));
    expect(controller.getSnapshot()).toMatchObject({ visible: false, height: 0 });
    await act(async () => events.get('keyboardWillChangeFrame')!({ endCoordinates: { screenY: 800, height: 320 } }));
    expect(controller.getSnapshot()).toMatchObject({ visible: false, height: 0 });
    await act(async () => root.unmount());
    expect(events.size).toBe(0);
    platform = 'android';
    const android = createRoot(document.createElement('div'));
    await act(async () =>
      android.render(
        <KeyboardHost controller={controller} enabled offset={0} toolbar={null}>
          <div />
        </KeyboardHost>
      )
    );
    expect(avoiding.behavior).toBeUndefined();
    expect(events.has('keyboardDidShow')).toBe(true);
    await act(async () => events.get('keyboardDidShow')!({ endCoordinates: { height: 300, screenY: 500 } }));
    expect(avoiding.style.paddingBottom).toBe(236);
    // Android may already have resized the window. Account only for real overlap.
    hostHeight = 404;
    await act(async () => hostLayout?.());
    expect(avoiding.style.paddingBottom).toBe(0);
    hostHeight = 640;
    await act(async () => android.unmount());
  } finally {
    platform = 'ios';
  }
});

test('autofocus is retained when it arrives before the keyboard group registers', async () => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  const controller = new KeyboardStore(dismiss);
  const handle = { request: () => {}, dispatch: () => {} } as unknown as ComponentDocument;
  const first = {
    ...field('first'),
    editor: {
      color: '#000000',
      placeholderColor: '#777777',
      placeholder: '',
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 24,
      padding: [10, 12, 10, 12] as [number, number, number, number],
      textAlign: 'left' as const,
      autoFocus: true
    }
  };
  try {
    await act(async () =>
      root.render(
        <KeyboardContext.Provider value={controller}>
          <ComponentHost document={handle} snapshot={{ revision: 1, nodes: [first, field('second')], events: [] }} onSnapshot={() => {}} />
        </KeyboardContext.Provider>
      )
    );
    expect(controller.getSnapshot().focusedInput).toBe('first');
    await act(async () => {
      controller.focusNext();
    });
    expect(document.activeElement?.getAttribute('aria-label')).toBe('second');
  } finally {
    await act(async () => root.unmount());
    container.remove();
  }
});

test('Next reveals an offscreen field before focusing it, and scrolling preserves the OS editor', async () => {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  const controller = new KeyboardStore(dismiss);
  const request = mock((_command: Record<string, unknown>) => ({}));
  const handle = { request, dispatch: request, edit: () => ({}) } as unknown as ComponentDocument;
  const render = async (nodes: ComponentSemantic[]) => {
    const snapshot: ComponentSnapshot = { revision: 1, nodes, inputFields: ['name', 'about'], events: [] };
    await act(async () =>
      root.render(
        <KeyboardContext.Provider value={controller}>
          <ComponentHost document={handle} snapshot={snapshot} onSnapshot={() => {}} />
        </KeyboardContext.Provider>
      )
    );
  };
  try {
    await render([field('name')]);
    await act(async () => (container.querySelector('input') as HTMLInputElement).focus());
    expect(controller.getSnapshot().focusedInput).toBe('name');
    await render([]);
    expect(container.querySelectorAll('input').length).toBe(1);
    expect(inputs.get('name')?.pointerEvents).toBe('none');
    expect(document.activeElement).toBe(container.querySelector('input'));
    await act(async () => {
      expect(controller.focusNext()).toBe(true);
    });
    expect(request).toHaveBeenCalledWith({ action: 'focusInput', id: 'about' });
    await render([field('about')]);
    expect(document.activeElement?.getAttribute('aria-label')).toBe('about');
    expect(controller.getSnapshot().focusedInput).toBe('about');
    await act(async () => inputs.get('about')?.onSubmitEditing?.());
    expect(dismiss).toHaveBeenCalled();
  } finally {
    await act(async () => root.unmount());
    container.remove();
  }
});
