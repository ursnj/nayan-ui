import React, { useEffect, useMemo } from 'react';
import { View } from 'uniwind/components';
import { Uniwind } from 'uniwind';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { ThemeProvider } from '@react-navigation/native';
import { HeroUINativeProvider } from 'heroui-native';
import { StatusBar } from 'expo-status-bar';
import { useNTheme } from '../hooks/useNTheme';
import { setAndroidNavigationBar } from '../lib/android-navigation-bar';
import { defaultThemeColors, THEMES } from '../lib/utils';
import { NToast } from './NToast';

interface RNTheme extends ReactNavigation.Theme {
  colors: {
    primary: string;
    background: string;
    card: string;
    text: string;
    muted: string;
    border: string;
    notification: string;
  };
}

export interface ThemeConfig {
  light: RNTheme;
  dark: RNTheme;
}

export interface NThemeProps {
  children: React.ReactNode;
  theme?: string;
  themeColors: ThemeConfig;
}

const isCSSVariableRef = (value: string) => /^var\(--.+\)$/.test(value.trim());

const normalizeNavigationColors = (mode: 'light' | 'dark', colors: RNTheme['colors']): RNTheme['colors'] => {
  const fallback = defaultThemeColors[mode].colors;

  return {
    primary: isCSSVariableRef(colors.primary) ? fallback.primary : colors.primary,
    background: isCSSVariableRef(colors.background) ? fallback.background : colors.background,
    card: isCSSVariableRef(colors.card) ? fallback.card : colors.card,
    text: isCSSVariableRef(colors.text) ? fallback.text : colors.text,
    muted: isCSSVariableRef(colors.muted) ? fallback.muted : colors.muted,
    border: isCSSVariableRef(colors.border) ? fallback.border : colors.border,
    notification: isCSSVariableRef(colors.notification) ? fallback.notification : colors.notification
  };
};

const toRuntimeThemeConfig = (theme: ThemeConfig): ThemeConfig => ({
  light: {
    ...theme.light,
    colors: normalizeNavigationColors('light', theme.light.colors)
  },
  dark: {
    ...theme.dark,
    colors: normalizeNavigationColors('dark', theme.dark.colors)
  }
});

export const NTheme = React.memo<NThemeProps>(({ children, theme: rawTheme, themeColors }) => {
  const { theme, setTheme, setThemeColors, isDarkMode } = useNTheme();
  const runtimeThemeColors = useMemo(() => toRuntimeThemeConfig(themeColors), [themeColors]);

  useEffect(() => {
    const finalTheme = rawTheme ?? theme ?? THEMES.light;
    setTheme(finalTheme as any);
    setThemeColors(themeColors);
    setAndroidNavigationBar(finalTheme);
  }, [rawTheme, theme, themeColors]);

  useEffect(() => {
    if (theme) {
      setAndroidNavigationBar(theme);
    }
  }, [theme, themeColors]);

  useEffect(() => {
    const toCSSVariables = (colors: RNTheme['colors']) => ({
      '--background': colors.background,
      '--surface': colors.card,
      '--surface-foreground': colors.text,
      '--overlay': colors.card,
      '--overlay-foreground': colors.text,
      '--foreground': colors.text,
      '--muted': colors.muted,
      '--border': colors.border,
      '--separator': colors.border,
      '--accent': colors.primary,
      '--accent-foreground': colors.text,
      '--default': colors.card,
      '--default-foreground': colors.text,
      '--field-background': colors.card,
      '--field-foreground': colors.text,
      '--field-placeholder': colors.muted,
      '--field-border': colors.border,
      '--segment': colors.card,
      '--segment-foreground': colors.text,
      '--focus': colors.primary,
      '--link': colors.primary,
      '--success': colors.primary,
      '--success-foreground': colors.text,
      '--warning': colors.primary,
      '--warning-foreground': colors.text,
      '--danger': colors.primary,
      '--danger-foreground': colors.text,
      '--color-primary': colors.primary,
      '--color-background': colors.background,
      '--color-card': colors.card,
      '--color-text': colors.text,
      '--color-muted': colors.muted,
      '--color-border': colors.border,
      '--color-notification': colors.notification
    });

    Uniwind.updateCSSVariables('light' as any, toCSSVariables(runtimeThemeColors.light.colors));
    Uniwind.updateCSSVariables('dark' as any, toCSSVariables(runtimeThemeColors.dark.colors));
  }, [runtimeThemeColors]);

  const currentThemeColors = useMemo(
    () => (isDarkMode ? runtimeThemeColors.dark : runtimeThemeColors.light),
    [isDarkMode, runtimeThemeColors]
  );

  return (
    <ThemeProvider value={currentThemeColors}>
      <View className="flex-1">
        <StatusBar style={isDarkMode ? THEMES.light : THEMES.dark} />
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaProvider>
            <HeroUINativeProvider>
              <BottomSheetModalProvider>{children}</BottomSheetModalProvider>
              <NToast />
            </HeroUINativeProvider>
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </View>
    </ThemeProvider>
  );
});

NTheme.displayName = 'NTheme';
