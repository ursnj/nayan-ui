import type { ComponentProps, ComponentStyleProp } from './types';

export interface NLinkifyProps extends Omit<ComponentProps, 'onPress'> {
  linkStyle?: ComponentStyleProp;
  onPress?: (url: string, text: string) => void;
}
