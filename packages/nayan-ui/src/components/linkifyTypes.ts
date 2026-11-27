import type { ReactNode } from 'react';
import type { ComponentProps, ComponentStyleProp } from './types';

export interface NLinkifyProps extends Omit<ComponentProps, 'onPress'> {
  /** Text or inline engine content to scan for links. */
  children?: ReactNode;
  /** @deprecated Pass the content as children. */
  text?: string;
  linkStyle?: ComponentStyleProp;
  onPress?: (url: string, text: string) => void;
}
