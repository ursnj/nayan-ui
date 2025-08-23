# Nayan UI for React Native

React Native Component Library for smooth and faster mobile application development.

[![npm version](https://badge.fury.io/js/@nayan-ui%2Freact-native.svg)](https://badge.fury.io/js/@nayan-ui%2Freact-native)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/npm/l/@nayan-ui/react-native.svg)](https://github.com/ursnj/nayan-ui/blob/main/LICENSE)

---

## ✨ Features

- 🌈 **Enterprise-class UI** designed for mobile applications
- 📦 **High-quality React Native components** out of the box
- 🛡 **Written in TypeScript** with predictable static types
- ⚙️ **Complete package** of design resources and development tools
- 🎨 **Powerful theme customization** based on Tailwind CSS and NativeWind
- 🌙 **Built-in dark mode** support with seamless switching
- 📱 **Cross-platform** compatibility for iOS and Android

## 🔨 Installation

```bash
npm install @nayan-ui/react-native
```

**Install peer dependencies:**

```bash
npm install @react-native-community/datetimepicker @react-navigation/native expo-navigation-bar react-native-reanimated react-native-gesture-handler react-native-safe-area-context react-native-svg
```

**Setup NativeWind:**

This library depends on **NativeWind** for styling. Follow the [NativeWind installation guide](https://www.nativewind.dev/getting-started/installation) to set it up in your project.

## ⚙️ Configuration

**1. Configure your `tailwind.config.js`:**

```javascript
const { hairlineWidth } = require('nativewind/theme');
const colors = require('tailwindcss/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx,ts,tsx}', './node_modules/@nayan-ui/react-native/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    colors: {
      ...colors,
      primary: 'var(--color-primary)',
      card: 'var(--color-card)',
      text: 'var(--color-text)',
      muted: 'var(--color-muted)',
      border: 'var(--color-border)',
      background: 'var(--color-background)'
    },
    extend: {
      borderWidth: {
        hairline: hairlineWidth()
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out'
      }
    }
  },
  plugins: []
};
```

**2. Create theme colors configuration:**

```typescript
import { DarkTheme, DefaultTheme } from '@react-navigation/native';

export const themeColors = {
  light: {
    ...DefaultTheme,
    colors: {
      primary: 'hsl(215 100% 45%)',
      background: 'hsl(216 20% 95%)',
      card: 'hsl(0 0% 100%)',
      text: 'hsl(0 0% 2%)',
      muted: 'hsl(0 0% 50%)',
      border: 'hsl(0 0% 88%)',
      notification: 'hsl(0 0% 100%)'
    }
  },
  dark: {
    ...DarkTheme,
    colors: {
      primary: 'hsl(209 100% 58%)',
      background: 'hsl(0 0% 12%)',
      card: 'hsl(0 0% 21%)',
      text: 'hsl(0 0% 96%)',
      muted: 'hsl(0 0% 69%)',
      border: 'hsl(0 0% 31%)',
      notification: 'hsl(0 0% 21%)'
    }
  }
};
```

## 🚀 Usage

**Wrap your app with the NTheme provider:**

```tsx
import { View } from 'react-native';
import 'react-native-reanimated';
import { NButton, NTheme, THEMES, useNTheme } from '@nayan-ui/react-native';
import '../global.css';
import { themeColors } from './constants';

export default function App() {
  const { theme, isDarkMode, setTheme } = useNTheme();

  const toggleTheme = () => {
    setTheme(isDarkMode ? THEMES.light : THEMES.dark);
  };

  return (
    <NTheme theme={theme || THEMES.light} themeColors={themeColors}>
      <View className="flex-1 justify-center items-center bg-background">
        <NButton onPress={toggleTheme}>{isDarkMode ? 'Switch to Light' : 'Switch to Dark'}</NButton>
      </View>
    </NTheme>
  );
}
```

## 📚 Documentation

For detailed documentation, component APIs, examples, and guides, visit **[www.nayanui.com](https://www.nayanui.com)**

## 🤝 Contributing

We welcome contributions! See the [contribution guide](https://www.nayanui.com/contributions) to learn how to contribute to the repository and development workflow.
