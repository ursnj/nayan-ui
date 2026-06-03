# Nayan UI — Expo Example

A React Native project using Expo SDK 56 + Uniwind + HeroUI Native + `@nayan-ui/native`.

Scaffolded with `npx create-expo-app@latest` (blank-typescript template), then configured with Nayan UI.

## Quick Start

```bash
npx @nayan-ui/cli new my-app -t expo
cd my-app
npm install
npx expo start
```

## Manual Setup

```bash
npx create-expo-app@latest my-app --template blank-typescript
cd my-app
npm install @nayan-ui/native uniwind heroui-native @gorhom/bottom-sheet
npm install react-native-reanimated react-native-gesture-handler react-native-svg react-native-worklets
npm install expo-router expo-linking expo-constants expo-splash-screen react-native-safe-area-context react-native-screens
```

### 1. Configure `metro.config.js`

```js
const { getDefaultConfig } = require('@expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withUniwindConfig(config, {
  cssEntryFile: './global.css'
});
```

### 2. Create `global.css`

```css
@import 'tailwindcss';
@import 'uniwind';
@import 'heroui-native/styles';

@source './node_modules/heroui-native/lib';
@source './node_modules/@nayan-ui/native/src';
@source './src';

@layer theme {
  :root {
    @variant light {
      /* light tokens */
    }
    @variant dark {
      /* dark tokens */
    }
  }
}
```

See `global.css` for the full token list.

### 3. Import CSS and wrap with NTheme

```tsx
import 'react-native-reanimated';
import { NTheme } from '@nayan-ui/native';
import { Stack } from 'expo-router';
import '../global.css';

export default function RootLayout() {
  return (
    <NTheme>
      <Stack />
    </NTheme>
  );
}
```

### 4. Use components

```tsx
import { View } from 'react-native';
import { NButton, NText, NThemeToggle, THEMES, useNTheme } from '@nayan-ui/native';

export default function Home() {
  const { isDarkMode, setTheme } = useNTheme();

  return (
    <View className="flex-1 items-center justify-center bg-background gap-4">
      <NText className="text-3xl font-bold text-foreground">Nayan UI</NText>
      <NButton onPress={() => setTheme(isDarkMode ? THEMES.light : THEMES.dark)}>Toggle Theme</NButton>
      <NThemeToggle />
    </View>
  );
}
```

## Scripts

- **`npx expo start`** — Start Expo dev server
- **`npx expo run:ios`** — Run on iOS simulator
- **`npx expo run:android`** — Run on Android emulator

## Learn More

- [Nayan UI Documentation](https://www.nayanui.com)
- [HeroUI Native](https://heroui-native.com)
- [Uniwind](https://uniwind.dev)
- [Expo](https://expo.dev)
