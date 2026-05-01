import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { HeroUINativeProvider } from 'heroui-native';
import { StatusBar } from 'expo-status-bar';
import { useNTheme } from '../hooks/useNTheme';
import { THEMES } from '../lib/utils';

export interface NThemeProps {
  children: React.ReactNode;
}

export const NTheme = React.memo<NThemeProps>(({ children }) => {
  const { isDarkMode } = useNTheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeroUINativeProvider>
        <StatusBar style={isDarkMode ? THEMES.light : THEMES.dark} />
        {children}
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
});

NTheme.displayName = 'NTheme';
