import { useLayoutEffect } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SplashScreen, Stack } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useLayoutEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <View className="flex-1">
      <GestureHandlerRootView className="flex-1">
        <Stack>
          <Stack.Screen name="(home)" options={{ headerShown: false, title: 'Home' }} />
          <Stack.Screen name="[id]" options={{ title: 'Game' }} />
        </Stack>
      </GestureHandlerRootView>
    </View>
  );
}
