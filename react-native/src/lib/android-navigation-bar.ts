import { Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { THEMES } from './utils';

export async function setAndroidNavigationBar(theme: string) {
  if (Platform.OS === 'android') {
    await NavigationBar.setButtonStyleAsync(theme === THEMES.dark ? THEMES.light : THEMES.dark);
  }
}
