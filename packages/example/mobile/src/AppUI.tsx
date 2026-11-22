import { useIsFocused } from 'expo-router';
import { type PropsWithChildren } from 'react';
import { NTheme, type NThemeProps, type SystemBarsOptions } from 'nayan-ui/components';
import { COLORS } from './theme';

export function AppUI({ children }: PropsWithChildren) {
  return (
    <NTheme defaultTheme="dark" systemBars={false} surface={false}>
      {children}
    </NTheme>
  );
}

type AppPageProps = Pick<NThemeProps, 'children' | 'className' | 'style'> & { keyboard?: boolean; systemBars?: SystemBarsOptions };

export function AppPage({ children, keyboard, systemBars, ...props }: AppPageProps) {
  const focused = useIsFocused();
  return (
    <NTheme surface={{ active: focused, background: COLORS.background, keyboard }} systemBars={focused && systemBars} {...props}>
      {children}
    </NTheme>
  );
}
