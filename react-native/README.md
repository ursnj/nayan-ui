# @nayan-ui/react-native

React Native component library generated with `create-react-native-library`, configured for `heroui-native` + `uniwind`, and migrated with all components from `packages/react-native`.

## Installation

```sh
npm install @nayan-ui/react-native
```

Install required peer dependencies in your app:

```sh
npm install react react-native heroui-native uniwind tailwindcss @react-navigation/native react-native-gesture-handler react-native-reanimated react-native-safe-area-context react-native-svg react-native-screens react-native-worklets
```

Also install any additional peers required by the specific components you use (for example: `@gorhom/bottom-sheet`, `heroui-native`, `expo-status-bar`, `expo-navigation-bar`, `lucide-react-native`, `react-native-modal-datetime-picker`, `react-native-wheel-color-picker`).

## Styling Setup

Import the bundled style entry once in your app:

```ts
import '@nayan-ui/react-native/styles';
```

## Usage

```tsx
import { HeroUINativeProvider, NButton } from '@nayan-ui/react-native';

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
