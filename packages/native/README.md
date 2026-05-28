# Nayan UI for React Native

Component library for React Native, powered by [HeroUI Native](https://heroui.com/native) and [Uniwind](https://uniwind.dev).

[![npm version](https://badge.fury.io/js/@nayan-ui%2Freact-native.svg)](https://badge.fury.io/js/@nayan-ui%2Freact-native)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/npm/l/@nayan-ui/native.svg)](https://github.com/ursnj/nayan-ui/blob/main/LICENSE)

---

## ✨ Features

- 🌈 **Enterprise-class UI** designed for React Native applications
- 📦 **40+ high-quality components** out of the box
- 🛡 **Written in TypeScript** with predictable static types
- ⚙️ **Built on HeroUI Native & Uniwind** for powerful styling
- 🎨 **Powerful theme customization** based on Tailwind CSS
- 🌙 **Built-in dark mode** support with seamless switching
- 📱 **Works with Expo and bare React Native** projects
- 🖥 **Cross-platform** compatibility for iOS and Android

## Prerequisites

This library requires [Uniwind](https://uniwind.dev) to be set up in your project. Follow the [Uniwind installation guide](https://uniwind.dev/docs/installation) to configure it before proceeding.

## Installation

```bash
npm install @nayan-ui/native
```

### Peer Dependencies

Install the required peer dependencies (most Expo projects already include these except `react-native-worklets`):

```bash
npm install react-native-reanimated react-native-gesture-handler react-native-safe-area-context react-native-screens react-native-svg react-native-worklets
```

## Configuration

### 1. Setup global CSS

Create a `global.css` file in your project:

```css
@import 'tailwindcss';
@import 'uniwind';
@import 'heroui-native/styles';
```

### 2. Import global CSS in your app entry

```tsx
import './global.css';
```

## Usage

Wrap your app with the `NTheme` provider:

```tsx
import { View } from 'react-native';
import { NButton, NTheme, useNTheme } from '@nayan-ui/native';
import './global.css';

export default function App() {
  const { isDarkMode } = useNTheme();

  return (
    <NTheme>
      <View className="flex-1 justify-center items-center bg-background">
        <NButton onPress={() => console.log('Pressed!')}>Hello Nayan UI</NButton>
      </View>
    </NTheme>
  );
}
```

## Components

NAccordion, NActionItem, NAlert, NAvatar, NButton, NButtonGroup, NCard, NCheck, NChip, NConfirm, NDialog, NDivider, NInput, NInputGroup, NInputOtp, NLinkButton, NLoading, NMenu, NMenuItem, NPopover, NPress, NProgress, NRadio, NRequired, NSelect, NSheet, NSkeleton, NSkeletonGroup, NSlider, NSubMenu, NSwitch, NTabs, NTagGroup, NText, NTextarea, NTextField, NTheme, NThemeToggle, NToast, NTooltip

## Hooks

- `useNTheme` — Access and toggle theme
- `useNKeyboard` — Track keyboard visibility

## Documentation

For detailed documentation, component APIs, examples, and guides, visit **[www.nayanui.com](https://www.nayanui.com)**

## Contributing

We welcome contributions! See the [contribution guide](https://www.nayanui.com/contributions) to learn how to contribute to the repository and development workflow.

## License

MIT
