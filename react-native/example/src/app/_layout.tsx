import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { NTheme } from '@nayan-ui/react-native';
import { Stack } from 'expo-router';
import '../../global.css';
import { components, themeColors } from '../constants';

const RootLayout = () => {
  return (
    <NTheme themeColors={themeColors}>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'React Native Nayan' }} />
        {components.map((component: any) => (
          <Stack.Screen key={component.name} name={component.name} options={{ title: component.title }} />
        ))}
      </Stack>
    </NTheme>
  );
};

export default RootLayout;
