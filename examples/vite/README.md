# Nayan UI — Vite Example

A React + Vite + Tailwind CSS v4 project using `@nayan-ui/react`.

Scaffolded with `npm create vite@latest` (react-ts template), then configured with Nayan UI.

## Quick Start

```bash
npx @nayan-ui/cli new my-app -t vite
cd my-app
npm install
npm run dev
```

## Manual Setup

```bash
npm create vite@latest my-app -- --template react-ts
cd my-app
npm install @nayan-ui/react
npm install -D @tailwindcss/vite tailwindcss
```

### 1. Add Tailwind plugin to `vite.config.ts`

```ts
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()]
});
```

### 2. Configure `src/index.css`

```css
@import '@nayan-ui/react/styles.css';

@source '../../node_modules/@nayan-ui/react/dist';

:root,
[data-theme='light'] {
  color-scheme: light;

  --background: hsl(214 45% 95%);
  --foreground: hsl(222 47% 11%);
  --surface: hsl(0 0% 100%);
  --surface-foreground: hsl(222 47% 11%);
  --surface-secondary: hsl(214 40% 96%);
  --surface-secondary-foreground: hsl(222 47% 11%);
  --surface-tertiary: hsl(214 35% 93%);
  --surface-tertiary-foreground: hsl(222 47% 11%);
  --overlay: hsl(0 0% 100%);
  --overlay-foreground: hsl(222 47% 11%);
  --muted: hsl(215 16% 47%);
  --default: hsl(214 35% 90%);
  --default-foreground: hsl(222 47% 11%);
  --accent: hsl(217 91% 50%);
  --accent-foreground: hsl(0 0% 100%);
  --field-background: hsl(0 0% 100%);
  --field-foreground: hsl(222 47% 11%);
  --field-placeholder: hsl(215 16% 47%);
  --success: hsl(142 71% 45%);
  --success-foreground: hsl(222 47% 11%);
  --warning: hsl(38 92% 50%);
  --warning-foreground: hsl(222 47% 11%);
  --danger: hsl(0 84% 60%);
  --danger-foreground: hsl(0 0% 100%);
  --border: hsl(214 35% 86%);
  --separator: hsl(214 25% 76%);
  --focus: hsl(217 91% 50%);
  --link: hsl(222 47% 11%);
  --segment: hsl(0 0% 100%);
  --segment-foreground: hsl(222 47% 11%);
}

.dark,
[data-theme='dark'] {
  color-scheme: dark;

  --background: hsl(222 47% 11%);
  --foreground: hsl(210 40% 98%);
  --surface: hsl(217 33% 22%);
  --surface-foreground: hsl(210 40% 98%);
  --surface-secondary: hsl(217 30% 26%);
  --surface-secondary-foreground: hsl(210 40% 98%);
  --surface-tertiary: hsl(217 28% 30%);
  --surface-tertiary-foreground: hsl(210 40% 98%);
  --overlay: hsl(217 33% 22%);
  --overlay-foreground: hsl(210 40% 98%);
  --muted: hsl(215 20% 65%);
  --default: hsl(217 33% 26%);
  --default-foreground: hsl(210 40% 98%);
  --accent: hsl(217 91% 60%);
  --accent-foreground: hsl(210 40% 98%);
  --field-background: hsl(217 33% 22%);
  --field-foreground: hsl(210 40% 98%);
  --field-placeholder: hsl(215 20% 65%);
  --success: hsl(142 71% 45%);
  --success-foreground: hsl(222 47% 11%);
  --warning: hsl(38 92% 55%);
  --warning-foreground: hsl(222 47% 11%);
  --danger: hsl(0 72% 51%);
  --danger-foreground: hsl(210 40% 98%);
  --border: hsl(217 33% 28%);
  --separator: hsl(217 25% 38%);
  --focus: hsl(217 91% 60%);
  --link: hsl(210 40% 98%);
  --segment: hsl(217 28% 34%);
  --segment-foreground: hsl(210 40% 98%);
}

body {
  color: var(--foreground);
  background: var(--background);
  font-family:
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

### 3. Use components in `src/App.tsx`

```tsx
import { NButton, NTheme, THEMES, useLocalStorage } from '@nayan-ui/react';

function App() {
  const [theme, setTheme] = useLocalStorage('THEME', THEMES.LIGHT);

  return (
    <NTheme theme={theme}>
      <div className="min-h-screen flex items-center justify-center bg-background gap-4">
        <NButton onClick={() => setTheme(theme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT)}>Toggle Theme</NButton>
      </div>
    </NTheme>
  );
}
```

## Scripts

- **`npm run dev`** — Start dev server
- **`npm run build`** — Type-check and build for production
- **`npm run preview`** — Preview production build

## Learn More

- [Nayan UI Documentation](https://www.nayanui.com)
- [HeroUI](https://heroui.com)
- [Tailwind CSS v4](https://tailwindcss.com)
- [Vite](https://vite.dev)
