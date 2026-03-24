import 'react-native-reanimated';
import { NTheme, THEMES } from '@nayan-ui/react-native';
import { Stack } from 'expo-router';
import '../../global.css';
import { components } from '../constants';

const RootLayout = () => {
  return (
    <NTheme theme={THEMES.light}>
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
