import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useNTheme } from '@nayan-ui/react-native';
import { Stack } from 'expo-router';
import { HeroUINativeProvider } from 'heroui-native';
import '../src/global.css';

function AppStack() {
  const { headerConfig } = useNTheme();

  return <Stack screenOptions={headerConfig} />;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeroUINativeProvider>
        <AppStack />
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}
