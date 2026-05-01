import './global.css';

import { HeroUINativeProvider } from 'heroui-native';
import { Button } from 'heroui-native';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeroUINativeProvider>
        <View className="flex-1 justify-center items-center bg-background">
          <Button onPress={() => console.log('Pressed!')}>Get Started</Button>
        </View>
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}
