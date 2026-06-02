import { NButton, NTheme, THEMES, useLocalStorage } from '@nayan-ui/react';

function App() {
  const [theme, setTheme] = useLocalStorage('THEME', THEMES.LIGHT);

  const toggleTheme = () => {
    setTheme(theme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT);
  };

  return (
    <NTheme theme={theme}>
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <img src="https://www.nayanui.com/logo.webp" fetchPriority="high" alt="Nayan UI" className="w-32 h-auto" />
        <h1 className="text-3xl font-bold text-foreground">Nayan UI</h1>
        <p className="text-muted">Best Component Library for React & React Native.</p>
        <NButton onClick={toggleTheme}>{theme === THEMES.DARK ? 'Switch to Light' : 'Switch to Dark'}</NButton>
      </div>
    </NTheme>
  );
}

export default App;
