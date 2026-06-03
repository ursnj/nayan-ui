# Nayan UI — Games Example

A React Native games showcase using Expo + [react-native-games](https://www.npmjs.com/package/react-native-games).

Scaffolded with `npx create-expo-app@latest` (blank-typescript template), then configured with react-native-games.

## Quick Start

```bash
npx @nayan-ui/cli new my-app -t games
cd my-app
npm install
npx expo start
```

## Manual Setup

```bash
npx create-expo-app@latest my-games-app --template blank-typescript
cd my-games-app
npm install react-native-games @shopify/react-native-skia react-native-reanimated react-native-gesture-handler react-native-worklets expo-haptics expo-speech expo-router
```

## How It Works

- **Home screen** displays a grid of available games from `GAMES_LIST`
- **Game screen** renders the selected game via `GAMES_MAPPING[gameId]`
- Each game has a **settings modal** accessible from the header
- Games use **React Native Skia** for high-performance 2D rendering

## Project Structure

```
src/
  app/
    _layout.tsx     — Root layout with GestureHandler and navigation
    index.tsx       — Game grid listing
    [id].tsx        — Dynamic game screen
```

## Scripts

- **`npx expo start`** — Start Expo dev server
- **`npx expo run:ios`** — Run on iOS simulator
- **`npx expo run:android`** — Run on Android emulator

## Learn More

- [Nayan UI Documentation](https://www.nayanui.com)
- [react-native-games](https://www.npmjs.com/package/react-native-games)
- [React Native Skia](https://shopify.github.io/react-native-skia/)
- [Expo](https://expo.dev)
