# @nayan-ui/react-native-heroui

React Native component library generated with `create-react-native-library`, configured for `heroui-native` + `uniwind`, and migrated with all components from `packages/react-native`.

## Installation

```sh
npm install @nayan-ui/react-native-heroui heroui-native uniwind tailwindcss
```

Install required peer dependencies in your app:

```sh
npm install react-native-gesture-handler react-native-reanimated react-native-safe-area-context react-native-svg react-native-screens react-native-worklets
```

## Styling Setup

Import the bundled style entry once in your app:

```ts
import '@nayan-ui/react-native-heroui/styles';
```

## Usage

```tsx
import { HeroUINativeProvider, NButton } from '@nayan-ui/react-native-heroui';

export function App() {
  return (
    <HeroUINativeProvider>
      <NButton>Continue</NButton>
    </HeroUINativeProvider>
  );
}
```

## Build

```sh
yarn build
```
