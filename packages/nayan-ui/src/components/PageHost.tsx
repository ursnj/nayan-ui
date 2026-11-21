import { type PropsWithChildren, useContext } from 'react';
import { NKeyboard } from './NKeyboard';
import { NSafeAreaProvider } from './NSafeArea';
import { KeyboardContext } from './theme/contexts';

export function PageHost({ children, keyboard }: PropsWithChildren<{ keyboard: boolean }>) {
  const scope = useContext(KeyboardContext);
  const content = <NSafeAreaProvider style={{ flex: 1, minHeight: 0 }}>{children}</NSafeAreaProvider>;
  return keyboard && !scope ? <NKeyboard toolbar={false}>{content}</NKeyboard> : content;
}
