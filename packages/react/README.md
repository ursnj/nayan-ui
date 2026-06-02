# Nayan UI for React

React Component Library built on [HeroUI](https://heroui.com) and [Tailwind CSS v4](https://tailwindcss.com) for smooth and faster web application development.

[![npm version](https://badge.fury.io/js/@nayan-ui%2Freact.svg)](https://www.npmjs.com/package/@nayan-ui/react)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/npm/l/@nayan-ui/react.svg)](https://github.com/ursnj/nayan-ui/blob/main/LICENSE)

---

## Features

- **50+ high-quality React components** out of the box
- **Built on HeroUI** with Tailwind CSS v4 design tokens
- **Written in TypeScript** with predictable static types
- **Built-in dark mode** with seamless switching
- **Server-side rendering** support (Next.js, Remix, etc.)
- **Cross-platform** compatibility for modern browsers, Electron, and Tauri

## Installation

```bash
npm install @nayan-ui/react
```

### Peer Dependencies

```bash
npm install react react-dom tailwindcss
```

## Configuration

**1. Add library styles to your CSS entry file (e.g. `index.css` or `globals.css`):**

`@nayan-ui/react/styles.css` already includes Tailwind CSS and HeroUI styles — no extra imports needed.

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
}

body {
  color: var(--foreground);
  background: var(--background);
}
```

**2. For Vite projects, add `@tailwindcss/vite` plugin to `vite.config.ts`:**

```ts
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()]
});
```

**3. For Next.js projects, add `@tailwindcss/postcss` to `postcss.config.mjs`:**

```js
export default {
  plugins: {
    '@tailwindcss/postcss': {}
  }
};
```

## Usage

Wrap your app with the `NTheme` provider:

```tsx
import { NButton, NTheme, THEMES, useLocalStorage } from '@nayan-ui/react';

export default function App() {
  const [theme, setTheme] = useLocalStorage('THEME', THEMES.LIGHT);

  const toggleTheme = () => {
    setTheme(theme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT);
  };

  return (
    <NTheme theme={theme}>
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <h1 className="mb-5 text-3xl text-foreground">Nayan UI</h1>
        <p className="mb-8 text-muted">Best Component Library for React & React Native.</p>
        <NButton onClick={toggleTheme}>{theme === THEMES.DARK ? 'Switch to Light' : 'Switch to Dark'}</NButton>
      </div>
    </NTheme>
  );
}
```

## Components

NAccordion, NAlert, NAutocomplete, NAvatar, NBadge, NBreadcrumbs, NButton, NButtonGroup, NCard, NCheck, NChip, NCode, NConfirmAlert, NDatePicker, NDialog, NDivider, NInfiniteScroll, NInput, NInputOtp, NKbd, NLink, NLinkify, NLoading, NMenu, NMenuNested, NMenuItem, NMeter, NNumberField, NPagination, NPopover, NProgress, NRadioGroup, NSearchField, NSelect, NSheet, NSkeleton, NSlider, NSwitch, NTable, NTabs, NTabsContent, NTagGroup, NTextarea, NTheme, NToast, NToggleButton, NTooltip

## Documentation

For detailed documentation, component APIs, examples, and guides, visit **[www.nayanui.com](https://www.nayanui.com)**

## Contributing

We welcome contributions! See the [contribution guide](https://www.nayanui.com/contributions) to learn how to contribute to the repository and development workflow.

## License

MIT
