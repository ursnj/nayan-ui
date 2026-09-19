export const installCode = `npm install @nayan-ui/react`;
export const rnInstallCode = `npm install @nayan-ui/native`;
export const rnPeerDepsCode = `npm install react-native-reanimated react-native-gesture-handler react-native-safe-area-context react-native-screens react-native-svg react-native-worklets`;

export const tailwindCode = `// No tailwind.config.js needed with Tailwind v4!
// HeroUI styles handle theming automatically.
// Use @tailwindcss/vite plugin in vite.config.ts:

import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss(), react()],
});`;

export const cssCode = `@import '@nayan-ui/react/styles.css';

body {
  color: var(--foreground);
  background: var(--background);
}`;

export const rnCssCode = `@import 'tailwindcss';
@import 'uniwind';
@import 'heroui-native/styles';`;

export const appCode = `import { useState } from 'react';
import { NTheme, THEMES, useLocalStorage } from '@nayan-ui/react';

const App = () => {
  const [theme, setTheme] = useLocalStorage('THEME', THEMES.LIGHT);

  const toggleTheme = () => {
    setTheme(theme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT);
  };

  return (
    <NTheme theme={theme}>
      <div className="p-3" onClick={toggleTheme}>TOGGLE THEME</div>
    </NTheme>
  );
};

export default App;`;

export const rnAppCode = `import { View } from 'react-native';
import { NButton, NTheme, NThemeToggle, useNTheme } from '@nayan-ui/native';
import './global.css';

export default function App() {
  const { isDarkMode } = useNTheme();

  return (
    <NTheme>
      <View className="flex-1 justify-center items-center bg-background">
        <NThemeToggle />
        <NButton onPress={() => console.log('Pressed!')}>
          {isDarkMode ? 'Dark Mode' : 'Light Mode'}
        </NButton>
      </View>
    </NTheme>
  );
}`;
