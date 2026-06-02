import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { NTheme, useNTheme } from '@nayan-ui/native';
import { SplashScreen, Stack } from 'expo-router';
import '../../global.css';

SplashScreen.preventAutoHideAsync();

function RootNav() {
  const { headerConfig } = useNTheme();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Games', ...headerConfig }} />
      <Stack.Screen name="[id]" options={{ title: 'Game' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
      <NTheme>
        <RootNav />
      </NTheme>
  );
}
