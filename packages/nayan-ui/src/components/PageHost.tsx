import { type PropsWithChildren, useContext } from 'react';
import type { ViewStyle } from 'react-native';
import { NKeyboard } from './NKeyboard';
import { NSafeAreaProvider } from './NSafeArea';
import { KeyboardContext } from './theme/contexts';

export function PageHost({
  children,
  keyboard,
  style
}: PropsWithChildren<{ keyboard: boolean; fillViewport?: boolean; style?: ViewStyle }>) {
  const scope = useContext(KeyboardContext);
  const content = <NSafeAreaProvider style={[{ flex: 1, minHeight: 0 }, style]}>{children}</NSafeAreaProvider>;
  return keyboard && !scope ? <NKeyboard toolbar={false}>{content}</NKeyboard> : content;
}
