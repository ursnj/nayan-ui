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
@source '../../../../node_modules/@nayan-ui/react/dist';

:root,
[data-theme='light'] {
  /* light tokens */
}
.dark,
[data-theme='dark'] {
  /* dark tokens */
}
```

See `src/app/globals.css` for the full token list.

### 4. Create a client-side ThemeWrapper

Since `NTheme` and `useLocalStorage` use browser APIs, wrap them in a `'use client'` component:

```tsx
// src/app/ThemeWrapper.tsx
'use client';

import { NTheme, THEMES, useLocalStorage } from '@nayan-ui/react';

// src/app/ThemeWrapper.tsx

export default function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const [theme] = useLocalStorage('THEME', THEMES.LIGHT);
  return <NTheme theme={theme}>{children}</NTheme>;
}
```

### 5. Use in `layout.tsx`

```tsx
import ThemeWrapper from './ThemeWrapper';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeWrapper>{children}</ThemeWrapper>
      </body>
    </html>
  );
}
```

### 6. Use components in pages

```tsx
'use client';

import { NButton, THEMES, useLocalStorage } from '@nayan-ui/react';

export default function Home() {
  const [theme, setTheme] = useLocalStorage('THEME', THEMES.LIGHT);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background gap-4">
      <NButton onClick={() => setTheme(theme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT)}>Toggle Theme</NButton>
    </div>
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
