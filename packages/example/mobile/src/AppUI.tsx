import { useIsFocused } from 'expo-router';
import { type PropsWithChildren } from 'react';
import { NPage, type NPageProps, NTheme, type SystemBarsOptions } from 'nayan-ui/components';
import { COLORS } from './theme';

export function AppUI({ children }: PropsWithChildren) {
  return (
    <NTheme defaultTheme="dark" systemBars={false}>
      {children}
    </NTheme>
  );
}

export function AppPage({ children, systemBars, ...props }: NPageProps & { systemBars?: SystemBarsOptions }) {
  const focused = useIsFocused();
  const page = (
    <NPage active={focused} background={COLORS.background} {...props}>
      {children}
    </NPage>
  );
  return systemBars ? <NTheme systemBars={focused ? systemBars : false}>{page}</NTheme> : page;
}
