import '../src/global.css';

import { Stack } from 'expo-router';
import { HeroUINativeProvider } from 'heroui-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeroUINativeProvider>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: '#18181b' },
            headerTintColor: '#fff',
          }}
        />
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}
