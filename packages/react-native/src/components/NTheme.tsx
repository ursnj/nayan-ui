import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { HeroUINativeProvider } from 'heroui-native';
import type { HeroUINativeConfig } from 'heroui-native';
import { Uniwind } from 'uniwind';
import { setAndroidNavigationBar } from '@/lib/android-navigation-bar';
import { THEMES } from '@/lib/utils';

export interface NThemeProps {
  children: React.ReactNode;
  theme?: string;
  config?: HeroUINativeConfig;
}

export const NTheme = React.memo<NThemeProps>(({ children, theme: rawTheme, config }) => {
  useEffect(() => {
    const finalTheme = rawTheme ?? THEMES.light;
    Uniwind.setTheme(finalTheme as any);
    setAndroidNavigationBar(finalTheme);
  }, [rawTheme]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeroUINativeProvider config={config}>{children}</HeroUINativeProvider>
    </GestureHandlerRootView>
  );
});

NTheme.displayName = 'NTheme';
