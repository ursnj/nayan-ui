import './global.css';

import { NButton } from '@nayan-ui/react-native';
import { Button, HeroUINativeProvider } from 'heroui-native';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeroUINativeProvider>
        <View className="flex-1 justify-center items-center gap-4 bg-slate-300">
          <Button onPress={() => console.log('Direct Button!')}>
            Direct HeroUI Button
          </Button>
          <NButton onPress={() => console.log('NButton!')}>
            Library NButton
          </NButton>
          <NButton variant="secondary">Secondary</NButton>
          <NButton variant="danger" size="sm">Danger Small</NButton>
        </View>
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}
