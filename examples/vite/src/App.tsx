import { NButton, NTheme, THEMES, useLocalStorage } from '@nayan-ui/react';

export default function App() {
  const [theme, setTheme] = useLocalStorage('THEME', THEMES.LIGHT);

  const toggleTheme = () => {
    setTheme(theme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT);
  };

  return (
    <NTheme theme={theme}>
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <img src="https://www.nayanui.com/logo.webp" fetchPriority="high" alt="Nayan UI" className="w-32 h-auto mb-8" />
        <h1 className="mb-5 text-3xl">Nayan UI</h1>
        <p className="mb-8">Best Component Library for React & React Native.</p>
        <NButton onClick={toggleTheme}>{theme === THEMES.DARK ? 'Switch to Light' : 'Switch to Dark'}</NButton>
      </div>
    </NTheme>
  );
}
