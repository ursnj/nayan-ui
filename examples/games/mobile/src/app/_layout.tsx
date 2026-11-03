import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { findExample } from '../examples';
import { COLORS } from '../theme';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ contentStyle: { backgroundColor: COLORS.background } }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen
          name="[id]"
          options={({ route }) => ({
            title: findExample((route.params as { id?: string }).id)?.title ?? 'Game',
            headerTransparent: true,
            headerTitleAlign: 'center',
            headerBackButtonDisplayMode: 'minimal',
            headerShadowVisible: false
          })}
        />
      </Stack>
    </>
  );
}
