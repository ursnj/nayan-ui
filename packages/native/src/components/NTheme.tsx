import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { HeroUINativeProvider } from 'heroui-native';

export interface NThemeProps {
  children: React.ReactNode;
}

export const NTheme = React.memo<NThemeProps>(({ children }) => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeroUINativeProvider>{children}</HeroUINativeProvider>
    </GestureHandlerRootView>
  );
});

NTheme.displayName = 'NTheme';
