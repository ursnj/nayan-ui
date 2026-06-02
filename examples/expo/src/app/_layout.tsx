import 'react-native-reanimated';
import { NTheme } from '@nayan-ui/native';
import { Stack } from 'expo-router';
import '../../global.css';

export default function RootLayout() {
  return (
    <NTheme>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Nayan UI' }} />
      </Stack>
    </NTheme>
  );
}
