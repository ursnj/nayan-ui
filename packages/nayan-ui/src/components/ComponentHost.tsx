import { type ComponentRef, memo, type ReactNode, useContext, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  BackHandler,
  type GestureResponderEvent,
  Keyboard,
  Linking,
  TextInput,
  type TextInputProps,
  type TextStyle,
  useColorScheme,
  useWindowDimensions,
  View,
  type ViewStyle
} from 'react-native';
import { DocumentSurface } from '../native/surface/DocumentSurface';
import type { ComponentDocument } from './ComponentDocument';
import { PresentationGestureContext } from './theme/contexts';
import type { ComponentSemantic, ComponentSnapshot } from './types';
import { useKeyboardFields } from './useKeyboardFields';

export type ComponentHostStyle = ViewStyle;

export const inputEventValue = (value: string) => value;
export const selectEventValue = (value: unknown): unknown =>
  Array.isArray(value) ? value.map(selectEventValue) : typeof value === 'object' && value !== null && 'value' in value ? value.value : (value ?? '');

export function openLink(href: string) {
  if (/^(https?:|mailto:|tel:)/i.test(href)) void Linking.openURL(href);
}

export interface ComponentHostProps {
  active?: boolean;
  document: ComponentDocument;
  snapshot: ComponentSnapshot;
  onSnapshot: (snapshot: ComponentSnapshot) => void;
  style?: ComponentHostStyle;
  onError?: (error: Error) => void;
  overlays?: Readonly<Record<string, ReactNode>>;
  scrollableOverlays?: readonly string[];
}

/** Rust paints layout/chrome; platform text editors paint their own text, selection and caret. */
export function ComponentHost({ active = true, document, snapshot, onSnapshot, style, onError, overlays, scrollableOverlays }: ComponentHostProps) {
  const surface = useRef<ComponentRef<typeof View>>(null);
  const fields = useKeyboardFields(document, snapshot);
  const presentation = useContext(PresentationGestureContext);
  useEffect(
    () =>
      presentation?.register(
        () => {
          if (!document.isDisposed) document.cancel();
        },
        (x, y) => {
          if (document.isDisposed || !surface.current) return false;
          // The entry animation and keyboard move the surface after onLayout.
          // Measure its current window position before querying Rust hit/scroll state.
          return new Promise<boolean>((resolve) =>
            surface.current?.measureInWindow((left, top) => {
              if (document.isDisposed) {
                resolve(false);
                return;
              }
              document.setSurfaceOrigin(left, top);
              try {
                resolve(document.canStartSheetDrag(x, y));
              } catch (error) {
                onError?.(error instanceof Error ? error : new Error(String(error)));
                resolve(false);
              }
            })
          );
        }
      ),
    [presentation, document, onError]
  );
  const overlayDrag = useRef<{ x: number; y: number; anchorX: number; anchorY: number; captured: boolean } | null>(null);
  const forwardDrag = (event: GestureResponderEvent, phase: 1 | 2) => {
    const drag = overlayDrag.current;
    if (drag?.captured && !document.isDisposed)
      document.input(phase, drag.anchorX + event.nativeEvent.pageX - drag.x, drag.anchorY + event.nativeEvent.pageY - drag.y);
    if (phase === 2) overlayDrag.current = null;
  };

  useEffect(
    () => () => {
      if (overlayDrag.current?.captured && !document.isDisposed) document.cancel();
      overlayDrag.current = null;
    },
    [document]
  );

  // Popup children are emitted by Rust only while the popup is open. Keep invisible
  // OS editors/SDK attachments underneath that foreground layer from stealing taps.
  const popupRoots = snapshot.nodes
    .filter((node) => node.kind === 'NDatePicker' || node.kind === 'NSelect')
    .filter((root) =>
      root.kind === 'NSelect' && root.expanded !== undefined ? root.expanded : snapshot.nodes.some((node) => node.id.startsWith(`${root.id}:`))
    )
    .map((node) => `${node.id}:`);
  const hasPopup = popupRoots.length > 0;
  const closePopup = () => {
    if (document.isDisposed) return false;
    document.request({ action: 'key', key: 'Escape', pressed: true });
    document.request({ action: 'key', key: 'Escape', pressed: false });
    return true;
  };
  useEffect(() => {
    if (!hasPopup) return;
    Keyboard.dismiss();
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (document.isDisposed) return false;
      document.request({ action: 'key', key: 'Escape', pressed: true });
      document.request({ action: 'key', key: 'Escape', pressed: false });
      return true;
    });
    return () => subscription.remove();
  }, [hasPopup, document]);

  const scheme = useColorScheme();
  const { fontScale } = useWindowDimensions();

  useEffect(() => {
    let alive = true;
    const forward = (reducedMotion: boolean) => {
      if (alive && !document.isDisposed) document.request({ action: 'environment', reducedMotion });
    };
    void AccessibilityInfo.isReduceMotionEnabled().then(forward);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', forward);
    return () => {
      alive = false;
      subscription.remove();
    };
  }, [document]);

  useEffect(() => {
    if (document.isDisposed) return;
    document.request({ action: 'environment', dark: scheme === 'dark', fontScale, native: true, platformInputs: true });
  }, [document, scheme, fontScale]);

  // Accessibility views follow every scroll; without a screen reader they are only main-thread work.
  const [screenReader, setScreenReader] = useState(false);

  useEffect(() => {
    let alive = true;
    void AccessibilityInfo.isScreenReaderEnabled().then((enabled) => alive && setScreenReader(enabled));
    const subscription = AccessibilityInfo.addEventListener('screenReaderChanged', setScreenReader);
    return () => {
      alive = false;
      subscription.remove();
    };
  }, []);

  return (
    <View
      ref={surface}
      onAccessibilityEscape={hasPopup ? closePopup : undefined}
      onLayout={() => {
        surface.current?.measureInWindow((x, y) => document.setSurfaceOrigin(x, y));
        fields.reveal();
      }}
      style={{ flex: 1, minHeight: 200, overflow: 'hidden', ...style }}
      onMoveShouldSetResponderCapture={(event) => {
        const drag = overlayDrag.current;
        return (
          !!drag &&
          event.nativeEvent.touches.length === 1 &&
          Math.abs(event.nativeEvent.pageY - drag.y) > 8 &&
          Math.abs(event.nativeEvent.pageY - drag.y) > Math.abs(event.nativeEvent.pageX - drag.x)
        );
      }}
      onResponderGrant={(event) => {
        const drag = overlayDrag.current;
        if (drag && !document.isDisposed) {
          drag.captured = true;
          document.input(0, drag.anchorX, drag.anchorY);
          forwardDrag(event, 1);
        }
      }}
      onResponderMove={(event) => forwardDrag(event, 1)}
      onResponderRelease={(event) => forwardDrag(event, 2)}
      onResponderTerminate={() => {
        if (overlayDrag.current?.captured && !document.isDisposed) document.cancel();
        overlayDrag.current = null;
      }}
      onTouchEnd={() => {
        if (!overlayDrag.current?.captured) overlayDrag.current = null;
      }}
      onResponderTerminationRequest={() => !overlayDrag.current?.captured}
    >
      <DocumentSurface
        active={active}
        document={document}
        mode="components"
        onError={onError}
        onChange={(update) => {
          if (update.ui) onSnapshot(update.ui);
        }}
      />
      <View pointerEvents="box-none" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}>
        {fields.nodes.map((node) => {
          const [left, top, width, height] = node.rect;
          const style: ViewStyle = { position: 'absolute', left, top, width, height };
          if (['NInput', 'NTextarea', 'NSearchField', 'NInputOtp'].includes(node.kind))
            return (
              <NativeTextField
                key={node.id}
                node={node}
                document={document}
                onSnapshot={onSnapshot}
                style={style}
                blocked={(hasPopup && !popupRoots.some((prefix) => node.id.startsWith(prefix))) || left < -9999}
                bind={fields.bind}
                onFocus={fields.focus}
                onBlur={fields.blur}
                onSubmit={fields.submit}
                last={!fields.hasController || fields.lastInput === node.id}
              />
            );
          if (!screenReader || (hasPopup && !popupRoots.some((prefix) => node.id.startsWith(prefix)))) return null;
          const multiOption = Boolean(node.selectOwner && node.multiple);
          const radio = node.kind === 'NRadio' || node.kind === 'NRadioGroup';
          const toggle = multiOption || ['NCheck', 'NSwitch', 'NToggleButton'].includes(node.kind);
          const adjustable = ['NSlider', 'NNumberField', 'NCarousel'].includes(node.kind);
          const list = node.kind === 'NList';
          const button =
            ['NButton', 'NPress', 'NLink', 'NMenuItem', 'NActionItem', 'NSelect', 'NDatePicker'].includes(node.kind) || node.id.includes(':option:');

          return (
            <View
              key={node.id}
              pointerEvents="none"
              accessible={node.kind !== 'NImage' || Boolean(node.label)}
              accessibilityRole={
                node.headingLevel
                  ? 'header'
                  : node.kind === 'NLink'
                    ? 'link'
                    : node.kind === 'NTabs'
                      ? 'tab'
                      : node.kind === 'NTabsList'
                        ? 'tablist'
                        : node.kind === 'NSelect' && !node.selectOwner
                          ? 'combobox'
                          : list
                            ? 'list'
                            : node.kind === 'NImage'
                              ? 'image'
                              : adjustable
                                ? 'adjustable'
                                : radio
                                  ? 'radio'
                                  : toggle
                                    ? node.kind === 'NSwitch'
                                      ? 'switch'
                                      : 'checkbox'
                                    : button
                                      ? 'button'
                                      : node.kind === 'NProgress' || node.kind === 'NLoading'
                                        ? 'progressbar'
                                        : 'text'
              }
              accessibilityLabel={node.label || undefined}
              accessibilityValue={
                node.kind === 'NSelect' && !node.selectOwner
                  ? { text: node.valueLabel ?? '' }
                  : adjustable || node.kind === 'NProgress'
                    ? { min: node.min, max: node.max, now: Number(node.value) }
                    : undefined
              }
              accessibilityActions={
                list
                  ? [{ name: 'scrollForward' }, { name: 'scrollBackward' }]
                  : adjustable
                    ? [{ name: 'increment' }, { name: 'decrement' }]
                    : undefined
              }
              onAccessibilityAction={(event) => {
                if (list) {
                  const value = node.value as { offset: number; viewportHeight: number };
                  document.request({
                    action: 'listScroll',
                    id: node.id,
                    offset: Math.max(0, value.offset + value.viewportHeight * (event.nativeEvent.actionName === 'scrollBackward' ? -1 : 1))
                  });
                }
                if (adjustable)
                  document.request({
                    action: event.nativeEvent.actionName,
                    id: node.id
                  });
              }}
              accessibilityState={{
                busy: node.kind === 'NLoading' ? node.value !== false : undefined,
                disabled: node.disabled,
                checked: multiOption || radio ? node.selected : toggle ? Boolean(node.value) : undefined,
                selected: radio ? undefined : node.selected,
                expanded: node.expanded
              }}
              onAccessibilityTap={list ? undefined : () => document.request({ action: 'activate', id: node.id })}
              style={style}
            />
          );
        })}
      </View>
      {Object.entries(snapshot.overlays ?? {}).map(([id, [left, top, width, height]]) => {
        if (!overlays?.[id]) return null;
        const [clipLeft, clipTop, clipWidth, clipHeight] = snapshot.overlayClips?.[id] ?? [left, top, width, height];

        return (
          <View
            key={id}
            pointerEvents={hasPopup ? 'none' : 'box-none'}
            onTouchStart={
              scrollableOverlays?.includes(id)
                ? (event) => {
                    if (event.nativeEvent.touches.length === 1)
                      overlayDrag.current = {
                        x: event.nativeEvent.pageX,
                        y: event.nativeEvent.pageY,
                        anchorX: clipLeft + clipWidth / 2,
                        anchorY: clipTop + clipHeight / 2,
                        captured: false
                      };
                  }
                : undefined
            }
            style={{ position: 'absolute', left: clipLeft, top: clipTop, width: clipWidth, height: clipHeight, overflow: 'hidden' }}
          >
            <View pointerEvents="box-none" style={{ position: 'absolute', left: left - clipLeft, top: top - clipTop, width, height }}>
              {overlays[id]}
            </View>
          </View>
        );
      })}
    </View>
  );
}

/** Keep the live native editor uncontrolled; apply only external value changes. */
const NativeTextField = memo(
  function NativeTextField({
    node,
    document,
    onSnapshot,
    style,
    blocked,
    bind,
    onFocus,
    onBlur,
    onSubmit,
    last
  }: {
    node: ComponentSemantic;
    document: ComponentDocument;
    onSnapshot: (snapshot: ComponentSnapshot) => void;
    style: ViewStyle;
    blocked: boolean;
    bind: ReturnType<typeof useKeyboardFields>['bind'];
    onFocus: (id: string) => void;
    onBlur: (id: string) => void;
    onSubmit: () => boolean;
    last: boolean;
  }) {
    const input = useRef<ComponentRef<typeof TextInput>>(null);
    const initial = useRef(String(node.value ?? '')).current;
    const nativeValue = useRef(initial);
    const editor = node.editor;
    const [left, top, width, height] = editor?.rect ?? node.rect;
    useEffect(() => (input.current ? bind(node.id, input.current) : undefined), [bind, node.id]);

    useEffect(() => {
      if (!node.platformEdit && nativeValue.current !== String(node.value ?? '')) {
        nativeValue.current = String(node.value ?? '');
        input.current?.setNativeProps({ text: nativeValue.current });
      }
    }, [node.platformEdit, node.value]);

    return (
      <View pointerEvents={blocked ? 'none' : 'box-none'} style={{ ...style, overflow: 'hidden', opacity: blocked ? 0 : 1 }}>
        <TextInput
          ref={input}
          pointerEvents={blocked ? 'none' : 'auto'}
          accessible={!blocked}
          accessibilityElementsHidden={blocked}
          importantForAccessibility={blocked ? 'no-hide-descendants' : 'auto'}
          accessibilityLabel={node.label || 'Text input'}
          editable={!node.disabled && !node.readOnly}
          secureTextEntry={node.secret}
          multiline={node.multiline}
          maxLength={node.maxLength ?? undefined}
          keyboardType={
            node.keyboardType ??
            (node.inputType === 'tel'
              ? 'phone-pad'
              : node.inputType === 'email'
                ? 'email-address'
                : node.inputType === 'number'
                  ? 'numeric'
                  : 'default')
          }
          defaultValue={initial}
          placeholder={editor?.placeholder}
          placeholderTextColor={editor?.placeholderColor}
          autoCapitalize={editor?.autoCapitalize as TextInputProps['autoCapitalize']}
          autoComplete={editor?.autoComplete as TextInputProps['autoComplete']}
          autoCorrect={editor?.autoCorrect}
          autoFocus={editor?.autoFocus && !blocked}
          inputMode={editor?.inputMode as TextInputProps['inputMode']}
          style={{
            position: 'absolute',
            left: left - node.rect[0],
            top: top - node.rect[1],
            width,
            height,
            backgroundColor: 'transparent',
            borderWidth: 0,
            color: editor?.color ?? 'transparent',
            fontSize: editor?.fontSize ?? 16,
            fontWeight: editor?.fontWeight as TextStyle['fontWeight'],
            lineHeight: node.multiline ? editor?.lineHeight : undefined,
            textAlign: editor?.textAlign,
            textAlignVertical: node.multiline ? 'top' : 'center',
            paddingTop: editor?.padding[0] ?? 0,
            paddingRight: editor?.padding[1] ?? 0,
            paddingBottom: editor?.padding[2] ?? 0,
            paddingLeft: editor?.padding[3] ?? 0,
            includeFontPadding: false
          }}
          underlineColorAndroid="transparent"
          returnKeyType={(editor?.returnKeyType as TextInputProps['returnKeyType']) ?? (node.multiline ? 'default' : last ? 'done' : 'next')}
          submitBehavior={node.multiline ? 'newline' : 'submit'}
          onSubmitEditing={
            node.multiline
              ? undefined
              : () => {
                  if (!onSubmit()) input.current?.blur();
                }
          }
          onFocus={() => {
            if (!blocked && !node.disabled && !node.readOnly) onFocus(node.id);
          }}
          onBlur={() => {
            if (!node.disabled && !node.readOnly) onBlur(node.id);
          }}
          onChangeText={(value) => {
            nativeValue.current = value;
            if (!document.isDisposed) onSnapshot(document.edit(node.id, value, true));
          }}
        />
      </View>
    );
  },
  (previous, next) =>
    previous.blocked === next.blocked &&
    previous.bind === next.bind &&
    previous.onFocus === next.onFocus &&
    previous.onBlur === next.onBlur &&
    previous.onSubmit === next.onSubmit &&
    previous.last === next.last &&
    previous.document === next.document &&
    previous.onSnapshot === next.onSnapshot &&
    previous.node.rect.every((value, index) => value === next.node.rect[index]) &&
    JSON.stringify(previous.node.editor) === JSON.stringify(next.node.editor) &&
    (['id', 'label', 'disabled', 'readOnly', 'secret', 'multiline', 'maxLength', 'inputType', 'keyboardType', 'platformEdit'] as const).every(
      (key) => previous.node[key] === next.node[key]
    ) &&
    (next.node.platformEdit || previous.node.value === next.node.value)
);
