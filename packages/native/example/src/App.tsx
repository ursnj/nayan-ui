import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NButton } from '@nayan-ui/react-native';
import { HeroUINativeProvider } from 'heroui-native';
import './global.css';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeroUINativeProvider>
        <View className="flex-1 justify-center items-center gap-4 bg-background">
          <NButton onPress={() => console.log('Primary!')}>Primary</NButton>
          <NButton variant="secondary">Secondary</NButton>
          <NButton variant="outline" size="lg">
            Outline Large
          </NButton>
          <NButton variant="danger" size="sm">
            Danger Small
          </NButton>
          <NButton variant="ghost">Ghost</NButton>
        </View>
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}
