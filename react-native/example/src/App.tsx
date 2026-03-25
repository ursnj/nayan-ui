import 'react-native-gesture-handler';
import { HeroUINativeProvider, NButton } from '@nayan-ui/react-native';
import { View } from 'react-native';
import '../global.css';

export default function App() {
  return (
    <HeroUINativeProvider>
      <View className="flex-1 items-center justify-center bg-background px-6">
        <NButton>HeroUI + Uniwind Ready</NButton>
      </View>
    </HeroUINativeProvider>
  );
}
