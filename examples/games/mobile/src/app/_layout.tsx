import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { findExample } from '../examples';
import { COLORS } from '../theme';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: COLORS.background },
          headerStyle: { backgroundColor: COLORS.background },
          headerTintColor: COLORS.text
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false, title: 'Examples' }} />
        <Stack.Screen
          name="[id]"
          // From the route params, so the title is in place on the first frame. The header floats
          // over the game, which fills the whole screen and starts its HUD below it; [id].tsx adds
          // the game-themed background and the settings button.
          options={({ route }) => ({
            title: findExample((route.params as { id?: string } | undefined)?.id)?.title ?? 'Example',
            headerTitleAlign: 'center',
            headerTransparent: true,
            headerShadowVisible: false,
            headerBackButtonDisplayMode: 'minimal',
            headerStyle: { backgroundColor: 'transparent' },
            headerBlurEffect: 'none'
          })}
        />
      </Stack>
    </>
  );
}
