import React from 'react';
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { NTheme } from '@nayan-ui/react-native';
import { Stack } from 'expo-router';
import '../../global.css';
import { components, themeColors } from '../constants';

class ThemeBoundary extends React.Component<{ children: React.ReactNode; fallback: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('NTheme crashed in RootLayout:', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

const RootLayout = () => {
  const stack = (
    <Stack initialRouteName="index">
      <Stack.Screen name="index" options={{ title: 'React Native Nayan' }} />
      {components.map((component: any) => (
        <Stack.Screen key={component.name} name={component.name} options={{ title: component.title }} />
      ))}
    </Stack>
  );

  return (
    <ThemeBoundary fallback={stack}>
      <NTheme themeColors={themeColors}>{stack}</NTheme>
    </ThemeBoundary>
  );
};

export default RootLayout;
