import 'react-native-reanimated';
import { NTheme, useNTheme } from '@nayan-ui/native';
import { Stack } from 'expo-router';
import '../../global.css';

function RootNav() {
  const { headerConfig } = useNTheme();

  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Nayan UI', ...headerConfig }} />
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
