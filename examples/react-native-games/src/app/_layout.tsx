import { useLayoutEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SplashScreen, Stack } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useLayoutEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false, title: 'Home' }} />
        <Stack.Screen name="[id]" options={{ title: 'Game' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
