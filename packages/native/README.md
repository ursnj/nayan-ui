# Nayan UI for React Native

Component library for React Native, powered by [HeroUI Native](https://heroui-native.com) and [Uniwind](https://uniwind.dev).

[![npm version](https://badge.fury.io/js/@nayan-ui%2Fnative.svg)](https://www.npmjs.com/package/@nayan-ui/native)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/npm/l/@nayan-ui/native.svg)](https://github.com/ursnj/nayan-ui/blob/main/LICENSE)

---

## Features

- **40+ high-quality components** out of the box
- **Built on HeroUI Native & Uniwind** for powerful styling
- **Written in TypeScript** with predictable static types
- **Built-in dark mode** with seamless switching
- **Works with Expo and bare React Native** projects
- **Cross-platform** compatibility for iOS and Android

## Prerequisites

This library requires [Uniwind](https://uniwind.dev) to be set up in your project. Follow the [Uniwind installation guide](https://uniwind.dev/docs/installation) to configure it before proceeding.

## Installation

```bash
npm install @nayan-ui/native uniwind heroui-native
```

### Peer Dependencies

Install the required peer dependencies (most Expo projects already include these except `react-native-worklets`):

```bash
npm install react-native-reanimated react-native-gesture-handler react-native-safe-area-context react-native-screens react-native-svg react-native-worklets @gorhom/bottom-sheet
```

## Configuration

### 1. Setup global CSS

Create a `global.css` file in your project:

```css
@import 'tailwindcss';
@import 'uniwind';
@import 'heroui-native/styles';

@source '../node_modules/heroui-native/lib';
@source '../node_modules/@nayan-ui/native/src';
```

### 2. Add theme tokens

Add light/dark theme tokens to the same `global.css`:

```css
@layer theme {
  :root {
    @variant light {
      --background: hsl(214 45% 92%);
      --foreground: hsl(222 47% 11%);
      --surface: hsl(0 0% 100%);
      --surface-foreground: hsl(222 47% 11%);
      --muted: hsl(215 16% 47%);
      --default: hsl(214 35% 90%);
      --default-foreground: hsl(222 47% 11%);
      --accent: hsl(217 91% 50%);
      --accent-foreground: hsl(0 0% 100%);
      --success: hsl(142 71% 45%);
      --warning: hsl(38 92% 50%);
      --danger: hsl(0 84% 60%);
      --danger-foreground: hsl(0 0% 100%);
      --border: hsl(214 35% 86%);
      --focus: hsl(217 91% 50%);
    }

    @variant dark {
      --background: hsl(222 47% 11%);
      --foreground: hsl(210 40% 98%);
      --surface: hsl(217 33% 22%);
      --surface-foreground: hsl(210 40% 98%);
      --muted: hsl(215 20% 65%);
      --default: hsl(217 33% 26%);
      --default-foreground: hsl(210 40% 98%);
      --accent: hsl(217 91% 60%);
      --accent-foreground: hsl(210 40% 98%);
      --success: hsl(142 71% 45%);
      --warning: hsl(38 92% 55%);
      --danger: hsl(0 72% 51%);
      --danger-foreground: hsl(210 40% 98%);
      --border: hsl(217 33% 28%);
      --focus: hsl(217 91% 60%);
    }
  }
}
```

### 3. Setup Metro config

```js
const { getDefaultConfig } = require('@expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withUniwindConfig(config, {
  cssEntryFile: './global.css'
});
```

### 4. Import global CSS in your app entry

```tsx
import './global.css';
```

## Usage

Wrap your app with the `NTheme` provider:

```tsx
import { View } from 'react-native';
import { NButton, NText, NTheme, NThemeToggle, THEMES, useNTheme } from '@nayan-ui/native';
import './global.css';

export default function App() {
  const { isDarkMode, setTheme } = useNTheme();

  return (
    <NTheme>
      <View className="flex-1 justify-center items-center bg-background gap-4">
        <NText className="text-3xl font-bold text-foreground">Nayan UI</NText>
        <NText className="text-muted">React Native Component Library</NText>
        <NButton onPress={() => setTheme(isDarkMode ? THEMES.light : THEMES.dark)}>Toggle Theme</NButton>
        <NThemeToggle />
      </View>
    </NTheme>
  );
}
```

## Components

NAccordion, NActionItem, NAlert, NAvatar, NButton, NButtonGroup, NCard, NCheck, NChip, NConfirm, NDatePicker, NDialog, NDivider, NInput, NInputGroup, NInputOtp, NLinkify, NLoading, NMenu, NMenuItem, NPopover, NPress, NProgress, NRadio, NRequired, NSelect, NSheet, NSkeleton, NSkeletonGroup, NSlider, NSwitch, NTabs, NTagGroup, NText, NTheme, NThemeToggle, NToast, NTooltip

## Hooks

- **`useNTheme`** — Access and toggle theme (`isDarkMode`, `theme`, `setTheme`)
- **`useNKeyboard`** — Track keyboard visibility

## Documentation

For detailed documentation, component APIs, examples, and guides, visit **[www.nayanui.com](https://www.nayanui.com)**

## Contributing

We welcome contributions! See the [contribution guide](https://www.nayanui.com/contributions) to learn how to contribute to the repository and development workflow.

## License

MIT
