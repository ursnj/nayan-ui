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
  plugins: [react(), tailwindcss()],
  resolve: {
    dedupe: ['react', 'react-dom'],
    conditions: ['import', 'module', 'browser', 'default']
  }
});
```

### 2. Configure `src/index.css`

```css
@import '@nayan-ui/react/styles.css';
@source '../../node_modules/@nayan-ui/react/dist';

:root,
[data-theme='light'] {
  /* light tokens */
}
.dark,
[data-theme='dark'] {
  /* dark tokens */
}
```

See `src/index.css` for the full token list.

### 3. Use components in `src/App.tsx`

```tsx
import { NButton, NTheme, THEMES, useLocalStorage } from '@nayan-ui/react';

function App() {
  const [theme, setTheme] = useLocalStorage('THEME', THEMES.LIGHT);

  return (
    <NTheme theme={theme}>
      <NButton onClick={() => setTheme(theme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT)}>Toggle Theme</NButton>
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
