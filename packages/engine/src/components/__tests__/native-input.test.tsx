import { act, forwardRef, useImperativeHandle, useRef } from 'react';
import type { TextStyle, ViewProps } from 'react-native';
import { afterAll, expect, mock, test } from 'bun:test';
import { installDom } from '../../__tests__/dom';
import type { ComponentDocument } from '../ComponentDocument';
import { PresentationGestureContext } from '../theme/contexts';
import type { ComponentSemantic, ComponentSnapshot } from '../types';

let inputProps: {
  defaultValue: string;
  value?: string;
  keyboardType: string;
  pointerEvents?: string;
  accessible?: boolean;
  style: TextStyle;
  caretHidden?: boolean;
  selectionColor?: string;
  onSubmitEditing?: () => void;
  onChangeText: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onSelectionChange?: () => void;
};
const dismissKeyboard = mock(() => {});
const blurInput = mock(() => {});
let backHandler: (() => boolean | null | undefined) | undefined;
const write = mock((_props: { text: string }) => {});
let nativeRenders = 0;
let views: ViewProps[] = [];
let surfacePosition = { x: 0, y: 0 };

const TextInput = forwardRef((props: typeof inputProps, ref) => {
  nativeRenders++;
  inputProps = props;
  const input = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    blur: blurInput,
    setNativeProps: (next: { text: string }) => {
      write(next);
      input.current!.value = next.text;
    }
  }));

  return <input ref={input} defaultValue={props.defaultValue} />;
});

mock.module('react-native', () => ({
  View: forwardRef((props: ViewProps, ref) => {
    useImperativeHandle(ref, () => ({
      measureInWindow: (callback: (x: number, y: number) => void) => callback(surfacePosition.x, surfacePosition.y)
    }));
    views.push(props);

    return <div>{props.children}</div>;
  }),
  TextInput,
  Keyboard: { dismiss: dismissKeyboard },
  BackHandler: {
    addEventListener: (_event: string, handler: () => boolean | null | undefined) => {
      backHandler = handler;
      return {
        remove() {
          backHandler = undefined;
        }
      };
    }
  },
  AccessibilityInfo: {
    isReduceMotionEnabled: async () => false,
    isScreenReaderEnabled: async () => false,
    addEventListener: () => ({ remove() {} })
  },
  Linking: { openURL: () => {} },
  useColorScheme: () => 'light',
  useWindowDimensions: () => ({ fontScale: 1 })
}));

mock.module('../../native/surface/DocumentSurface', () => ({ DocumentSurface: () => null }));

const dom = installDom();
const { createRoot } = await import('react-dom/client');
const { ComponentHost } = await import('../ComponentHost');

afterAll(() => dom.cleanup());

test('Rust IME acknowledgements preserve the native composition buffer and external resets still apply', async () => {
  const node: ComponentSemantic = {
    id: 'mobile',
    kind: 'NInput',
    label: 'Mobile',
    value: '',
    disabled: false,
    rect: [0, 0, 200, 44],
    maxLength: 10,
    readOnly: false,
    secret: false,
    multiline: false,
    inputType: 'tel',
    platformEdit: false,
    min: 0,
    max: 100,
    step: 1
  };
  const host = document.createElement('div');
  const root = createRoot(host);
  const state = (entry: ComponentSemantic): ComponentSnapshot => ({ revision: 1, nodes: [entry], events: [] });
  const next = state({ ...node, value: '1234567890', platformEdit: true });
  const edit = mock(() => next);
  const dispatch = mock(() => {});
  const documentHandle = { request: () => {}, edit, dispatch } as unknown as ComponentDocument;
  const accept = mock((_snapshot: ComponentSnapshot) => {});
  try {
    await act(async () => root.render(<ComponentHost document={documentHandle} snapshot={state(node)} onSnapshot={accept} />));
    write.mockClear();
    expect(inputProps.keyboardType).toBe('phone-pad');
    await act(() => inputProps.onFocus());
    const native = host.querySelector('input')!;
    native.value = '1234567890';
    inputProps.onChangeText(native.value);
    expect(edit).toHaveBeenCalledWith('mobile', '1234567890', true);
    expect(accept).toHaveBeenCalledWith(next);
    await act(async () => root.render(<ComponentHost document={documentHandle} snapshot={next} onSnapshot={accept} />));
    expect(inputProps.value).toBeUndefined();
    expect(native.value).toBe('1234567890');
    expect(write).not.toHaveBeenCalled();
    expect(inputProps.onSelectionChange).toBeUndefined();
    expect(inputProps.caretHidden).toBeUndefined();
    expect(inputProps.selectionColor).toBeUndefined();
    dispatch.mockClear();
    inputProps.onChangeText('123456789');
    expect(edit).toHaveBeenLastCalledWith('mobile', '123456789', true);
    expect(dispatch).not.toHaveBeenCalled();
    const before = nativeRenders;
    native.value = '1234567899';
    await act(async () =>
      root.render(
        <ComponentHost document={documentHandle} snapshot={state({ ...node, value: native.value, platformEdit: true })} onSnapshot={accept} />
      )
    );
    expect(nativeRenders).toBe(before);
    expect(native.value).toBe('1234567899');
    await act(async () => root.render(<ComponentHost document={documentHandle} snapshot={state({ ...node, value: '987' })} onSnapshot={accept} />));
    expect(native.value).toBe('987');
    await act(() => inputProps.onBlur());
    expect(dispatch).not.toHaveBeenCalled();
    blurInput.mockClear();
    inputProps.onSubmitEditing?.();
    expect(blurInput).toHaveBeenCalledTimes(1);
  } finally {
    await act(async () => root.unmount());
  }
});

test('visible native text retains its composition and selection through style updates', async () => {
  const container = document.createElement('div');
  const root = createRoot(container);
  const dispatch = mock(() => {});
  const handle = { request: () => {}, dispatch } as unknown as ComponentDocument;
  const editor: NonNullable<ComponentSemantic['editor']> = {
    color: '#123456',
    placeholderColor: '#777777',
    placeholder: 'Write...',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    padding: [10, 12, 10, 12],
    textAlign: 'left'
  };
  const node = { id: 'draft', kind: 'NInput', value: 'Hello', rect: [0, 0, 200, 44], platformEdit: true, editor } as ComponentSemantic;
  await act(() => root.render(<ComponentHost document={handle} snapshot={{ revision: 1, nodes: [node], events: [] }} onSnapshot={() => {}} />));
  await act(() => inputProps.onFocus());
  const native = container.querySelector('input')!;
  native.value = '日本👋';
  native.setSelectionRange(2, 4);
  write.mockClear();
  await act(() =>
    root.render(
      <ComponentHost
        document={handle}
        snapshot={{ revision: 2, nodes: [{ ...node, editor: { ...editor, color: '#ffffff', fontSize: 20 } }], events: [] }}
        onSnapshot={() => {}}
      />
    )
  );
  expect(native.value).toBe('日本👋');
  expect(native.selectionStart).toBe(2);
  expect(native.selectionEnd).toBe(4);
  expect(write).not.toHaveBeenCalled();
  expect(inputProps.style.color).toBe('#ffffff');
  expect(inputProps.style.fontSize).toBe(20);
  expect(inputProps.onSelectionChange).toBeUndefined();
  await act(() => root.unmount());
});

test('native ad attachments clip below sticky headers and forward vertical drags after the row unmounts', async () => {
  const root = createRoot(document.createElement('div'));
  const input = mock((_phase: number, _x: number, _y: number) => {});
  const cancel = mock(() => {});
  const handle = { request: () => {}, input, cancel } as unknown as ComponentDocument;
  const snapshot: ComponentSnapshot = {
    revision: 1,
    nodes: [],
    events: [],
    overlays: { ad: [12, 8, 180, 350] },
    overlayClips: { ad: [12, 64, 180, 294] }
  };
  const event = (pageX: number, pageY: number) =>
    ({ nativeEvent: { pageX, pageY, touches: [{}] } }) as unknown as Parameters<NonNullable<ViewProps['onTouchStart']>>[0];
  const render = async (state: ComponentSnapshot) => {
    views = [];
    await act(async () =>
      root.render(
        <ComponentHost document={handle} snapshot={state} onSnapshot={() => {}} overlays={{ ad: <div>Ad</div> }} scrollableOverlays={['ad']} />
      )
    );
  };
  try {
    await render(snapshot);
    const attachment = views.find((view) => view.onTouchStart)!;
    expect(attachment.style).toEqual({ position: 'absolute', left: 12, top: 64, width: 180, height: 294, overflow: 'hidden' });
    const host = views[0]!;
    attachment.onTouchStart!(event(30, 120));
    expect(host.onMoveShouldSetResponderCapture!(event(70, 122))).toBe(false);
    expect(host.onMoveShouldSetResponderCapture!(event(32, 96))).toBe(true);
    host.onResponderGrant!(event(32, 96));
    expect(input.mock.calls).toEqual([
      [0, 102, 211],
      [1, 104, 187]
    ]);
    await render({ revision: 2, nodes: [], events: [], overlays: {} });
    views[0]!.onResponderMove!(event(32, 40));
    views[0]!.onResponderRelease!(event(32, 20));
    expect(input.mock.calls.slice(-2)).toEqual([
      [1, 104, 131],
      [2, 104, 111]
    ]);
    expect(cancel).not.toHaveBeenCalled();
    await render(snapshot);
    views.find((view) => view.onTouchStart)!.onTouchStart!(event(30, 120));
    views[0]!.onResponderGrant!(event(30, 90));
    views[0]!.onResponderTerminate!(event(30, 90));
    expect(cancel).toHaveBeenCalledTimes(1);
  } finally {
    await act(async () => root.unmount());
  }
});

test('Rust calendar popups block underlying native editors and handle Android back', async () => {
  const root = createRoot(document.createElement('div'));
  const request = mock((_command: Record<string, unknown>) => {});
  const handle = { request } as unknown as ComponentDocument;
  const node: ComponentSemantic = {
    id: 'name',
    kind: 'NInput',
    label: 'Name',
    value: 'Ada',
    disabled: false,
    rect: [0, 0, 200, 44],
    maxLength: null,
    readOnly: false,
    secret: false,
    multiline: false,
    inputType: 'text',
    platformEdit: false,
    min: 0,
    max: 0,
    step: 1
  };
  const render = async (open: boolean) => {
    const nodes = [node, { ...node, id: 'birthday', kind: 'NDatePicker', value: '2000-02-28' }];
    if (open) nodes.push({ ...node, id: 'birthday:2000-02-29', kind: 'NButton' });
    await act(async () =>
      root.render(<ComponentHost document={handle} snapshot={{ revision: open ? 2 : 1, nodes, events: [] }} onSnapshot={() => {}} />)
    );
  };
  try {
    await render(false);
    expect(inputProps.pointerEvents).toBe('auto');
    dismissKeyboard.mockClear();
    await render(true);
    expect(inputProps.pointerEvents).toBe('none');
    expect(inputProps.accessible).toBe(false);
    expect(dismissKeyboard).toHaveBeenCalledTimes(1);
    request.mockClear();
    expect(backHandler?.()).toBe(true);
    expect(request.mock.calls.map(([command]) => command)).toEqual([
      { action: 'key', key: 'Escape', pressed: true },
      { action: 'key', key: 'Escape', pressed: false }
    ]);
    await render(false);
    expect(inputProps.pointerEvents).toBe('auto');
    expect(backHandler).toBeUndefined();
  } finally {
    await act(async () => root.unmount());
  }
});

test('sheet body gestures measure the animated surface before querying Rust and release hooks on unmount', async () => {
  const root = createRoot(document.createElement('div'));
  const cancel = mock(() => {});
  const setSurfaceOrigin = mock(() => {});
  const canStartSheetDrag = mock(() => true);
  const handle = { request: () => {}, cancel, setSurfaceOrigin, canStartSheetDrag, isDisposed: false };
  let cancelSurface: (() => void) | undefined;
  let canStart: ((x: number, y: number) => boolean | Promise<boolean>) | undefined;
  const unregister = mock(() => {
    cancelSurface = undefined;
  });
  const presentation = {
    register(callback: () => void, check?: typeof canStart) {
      cancelSurface = callback;
      canStart = check;
      return unregister;
    }
  };
  try {
    await act(async () =>
      root.render(
        <PresentationGestureContext.Provider value={presentation}>
          <ComponentHost document={handle as unknown as ComponentDocument} snapshot={{ revision: 0, nodes: [], events: [] }} onSnapshot={() => {}} />
        </PresentationGestureContext.Provider>
      )
    );
    expect(cancelSurface).toBeDefined();
    surfacePosition = { x: 0, y: 520 };
    expect(await canStart?.(100, 800)).toBe(true);
    expect(setSurfaceOrigin).toHaveBeenLastCalledWith(0, 520);
    expect(canStartSheetDrag).toHaveBeenLastCalledWith(100, 800);
    surfacePosition = { x: 0, y: 300 };
    expect(await canStart?.(100, 800)).toBe(true);
    expect(setSurfaceOrigin).toHaveBeenLastCalledWith(0, 300);
    cancelSurface?.();
    expect(cancel).toHaveBeenCalledTimes(1);
    handle.isDisposed = true;
    expect(await canStart?.(100, 800)).toBe(false);
    cancelSurface?.();
    expect(cancel).toHaveBeenCalledTimes(1);
  } finally {
    await act(async () => root.unmount());
  }
  expect(unregister).toHaveBeenCalledTimes(1);
  expect(cancelSurface).toBeUndefined();
});
