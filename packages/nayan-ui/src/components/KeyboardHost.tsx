import { type ComponentRef, type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Dimensions, Keyboard, KeyboardAvoidingView, Platform, View, type ViewStyle } from 'react-native';
import type { KeyboardStore } from './keyboardStore';

export type KeyboardHostStyle = ViewStyle;
export interface KeyboardHostProps {
  children: ReactNode;
  toolbar: ReactNode;
  controller: KeyboardStore;
  enabled: boolean;
  offset?: number;
  style?: KeyboardHostStyle;
}
export const dismissKeyboard = () => Keyboard.dismiss();

/** OS keyboard transitions drive native layout animation; there is no JS frame loop. */
export function KeyboardHost({ children, toolbar, controller, enabled, offset, style }: KeyboardHostProps) {
  const host = useRef<ComponentRef<typeof View>>(null);
  const [windowTop, setWindowTop] = useState(0);
  const [androidInset, setAndroidInset] = useState(0);
  const keyboardTop = useRef<number | null>(null);
  const measure = useCallback(() => {
    host.current?.measureInWindow((_x, y, _width, height) => {
      if (Platform.OS === 'ios') {
        if (offset === undefined) setWindowTop(y);
      } else setAndroidInset(keyboardTop.current === null ? 0 : Math.max(0, y + height - keyboardTop.current));
    });
  }, [offset]);
  useEffect(() => {
    if (!enabled) {
      keyboardTop.current = null;
      setAndroidInset(0);
      controller.setKeyboard(false, 0);
      return;
    }
    const refresh = () => {
      const metrics = Keyboard.metrics();
      controller.setKeyboard(Boolean(metrics?.height), metrics?.height ?? 0);
      if (Platform.OS === 'android') {
        keyboardTop.current = metrics?.screenY ?? null;
        measure();
      }
    };
    refresh();
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', (event) => {
      if (Platform.OS === 'ios') Keyboard.scheduleLayoutAnimation(event);
      controller.setKeyboard(true, event.endCoordinates.height);
      if (Platform.OS === 'android') {
        keyboardTop.current = event.endCoordinates.screenY;
        measure();
      }
    });
    const change =
      Platform.OS === 'ios'
        ? Keyboard.addListener('keyboardWillChangeFrame', (event) => {
            Keyboard.scheduleLayoutAnimation(event);
            const { screenY, height } = event.endCoordinates;
            const covered = Math.max(0, Math.min(height, Dimensions.get('screen').height - screenY));
            controller.setKeyboard(covered > 0, covered);
          })
        : null;
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', (event) => {
      if (Platform.OS === 'ios') Keyboard.scheduleLayoutAnimation(event);
      keyboardTop.current = null;
      setAndroidInset(0);
      controller.setKeyboard(false, 0);
    });
    const app = AppState.addEventListener('change', (state) => (state === 'active' ? refresh() : controller.setKeyboard(false, 0)));
    return () => {
      show.remove();
      change?.remove();
      hide.remove();
      app.remove();
    };
  }, [controller, enabled, measure]);
  return (
    <View ref={host} style={[{ flex: 1, minHeight: 0 }, style]} onLayout={measure}>
      <KeyboardAvoidingView
        enabled={enabled}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={offset ?? windowTop}
        style={{ flex: 1, minHeight: 0, paddingBottom: Platform.OS === 'android' ? androidInset : 0 }}>
        <View style={{ flex: 1, minHeight: 0 }}>{children}</View>
        {enabled && toolbar}
      </KeyboardAvoidingView>
    </View>
  );
}
