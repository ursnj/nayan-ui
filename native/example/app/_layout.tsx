import '../src/global.css';

import { Stack } from 'expo-router';
import { HeroUINativeProvider } from 'heroui-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useNTheme } from '@nayan-ui/react-native';

function AppStack() {
  const { headerConfig } = useNTheme();

  return (
    <Stack screenOptions={headerConfig} />
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeroUINativeProvider>
        <AppStack />
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}
