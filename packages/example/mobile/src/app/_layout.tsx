import { starterTheme } from '@nayan-ui/shared/theme';
import { Stack } from 'expo-router';
import { NTheme } from 'nayan-ui/components';

export default function RootLayout() {
  return (
    <NTheme {...starterTheme} surface={false}>
      <Stack screenOptions={{ headerShown: false }} />
    </NTheme>
  );
}
