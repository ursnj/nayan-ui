'use client';

import { NButton, THEMES, useLocalStorage } from '@nayan-ui/react';

export default function Home() {
  const [theme, setTheme] = useLocalStorage('THEME', THEMES.LIGHT);

  const toggleTheme = () => {
    setTheme(theme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
      <img src="https://www.nayanui.com/logo.webp" fetchPriority="high" alt="Nayan UI" className="w-32 h-auto" />
      <h1 className="text-3xl font-bold text-foreground">Nayan UI + Next.js</h1>
      <p className="text-muted">React Component Library built on HeroUI & Tailwind CSS v4</p>
      <div className="flex gap-3">
        <NButton onClick={toggleTheme}>{theme === THEMES.DARK ? 'Switch to Light' : 'Switch to Dark'}</NButton>
        <NButton variant="outline" onClick={() => window.open('https://www.nayanui.com', '_blank')}>
          Documentation
        </NButton>
      </div>
    </div>
  );
}
