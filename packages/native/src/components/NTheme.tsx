import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { HeroUINativeProvider } from 'heroui-native';
import { useNToast } from './NToast';

export interface NThemeProps {
  children: React.ReactNode;
}

const NToastRegistrar: React.FC = () => {
  useNToast();
  return null;
};

export const NTheme = React.memo<NThemeProps>(({ children }) => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeroUINativeProvider>
        <NToastRegistrar />
        {children}
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
});

NTheme.displayName = 'NTheme';
