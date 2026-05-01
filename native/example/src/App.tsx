import './global.css';

import { NButton } from '@nayan-ui/react-native';
import { Button, HeroUINativeProvider } from 'heroui-native';
import { Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeroUINativeProvider>
        <View className="flex-1 justify-center items-center gap-4 bg-red-500">
          <Text className="text-white text-2xl font-bold">Uniwind Test</Text>
          <View className="bg-accent h-12 w-40 rounded-3xl items-center justify-center">
            <Text className="text-accent-foreground font-medium">Manual Button</Text>
          </View>
          <Button onPress={() => console.log('Direct Button!')}>
            Direct HeroUI Button
          </Button>
          <NButton onPress={() => console.log('NButton!')}>
            Library NButton
          </NButton>
        </View>
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}
