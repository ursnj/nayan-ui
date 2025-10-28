import 'react-native-reanimated';
import { NTheme, THEMES, useNTheme } from '@nayan-ui/react-native';
import { Stack } from 'expo-router';
import '../../global.css';
import { components, themeColors } from '../constants';

const RootLayout = () => {
  const { theme } = useNTheme();

  return (
    <NTheme theme={theme || THEMES.light} themeColors={themeColors}>
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
