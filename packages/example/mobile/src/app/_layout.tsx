import { Stack } from 'expo-router';
import { NTheme } from 'nayan-ui/components';

export default function RootLayout() {
  return (
    <NTheme defaultTheme="system" surface={false}>
      <Stack screenOptions={{ headerShown: false }} />
    </NTheme>
  );
}
