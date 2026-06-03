# Nayan UI — Next.js Example

A Next.js project using `@nayan-ui/react` with Tailwind CSS v4 and HeroUI.

Scaffolded with `npx create-next-app@latest` (app router + tailwind), then configured with Nayan UI.

## Quick Start

```bash
npx create-next-app@latest my-app --tailwind
cd my-app
npm install @nayan-ui/react
```

## Setup Guide

### 1. Configure `next.config.ts`

Add `transpilePackages` so Next.js compiles `@nayan-ui/react`:

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@nayan-ui/react']
};

export default nextConfig;
```

### 2. PostCSS (already configured by create-next-app)

`postcss.config.mjs` uses `@tailwindcss/postcss` — no changes needed.

### 3. Configure `src/app/globals.css`

```css
@import '@nayan-ui/react/styles.css';

@source '../node_modules/@nayan-ui/react/dist';

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
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

### 4. Use components in pages

```tsx
// src/app/page.tsx
'use client';

import { NButton, NTheme, THEMES, useLocalStorage } from '@nayan-ui/react';

export default function Home() {
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

## Key Integration Points

- **`transpilePackages`** — Required because `@nayan-ui/react` ships ESM source
- **`@tailwindcss/postcss`** — Next.js uses PostCSS (not Vite plugins) for CSS
- **`'use client'`** — NTheme and hooks like `useLocalStorage` must be in client components
- **`suppressHydrationWarning`** — Prevents theme-mismatch hydration warnings on `<html>`

## Scripts

- **`npm run dev`** — Start dev server
- **`npm run build`** — Build for production
- **`npm run start`** — Start production server

## Learn More

- [Nayan UI Documentation](https://www.nayanui.com)
- [HeroUI](https://heroui.com)
- [Tailwind CSS v4](https://tailwindcss.com)
- [Next.js](https://nextjs.org)
