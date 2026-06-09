import { useEffect } from 'react';
import 'react-native-reanimated';
import { NTheme, useNTheme } from '@nayan-ui/native';
import { SplashScreen, Stack } from 'expo-router';
import '../../global.css';

SplashScreen.preventAutoHideAsync();

function RootNav() {
  const { colors } = useNTheme();

  const blurHeaderConfig = {
    headerStyle: { backgroundColor: colors.surface },
    headerShadowVisible: false,
    headerTintColor: colors.foreground,
    headerBackButtonDisplayMode: 'minimal' as const
  };

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <Stack screenOptions={blurHeaderConfig}>
      <Stack.Screen name="index" options={{ title: 'Games' }} />
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
