# Nayan UI for React

React Component Library for smooth and faster web application development.

[![npm version](https://badge.fury.io/js/@nayan-ui%2Freact.svg)](https://badge.fury.io/js/@nayan-ui%2Freact)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/npm/l/@nayan-ui/react.svg)](https://github.com/ursnj/nayan/blob/main/LICENSE)

---

## ✨ Features

- 🌈 **Enterprise-class UI** designed for web applications
- 📦 **High-quality React components** out of the box
- 🛡 **Written in TypeScript** with predictable static types
- ⚙️ **Complete package** of design resources and development tools
- 🎨 **Powerful theme customization** based on Tailwind CSS
- 🌙 **Built-in dark mode** support with seamless switching
- 🌍 **Server-side rendering** support
- 🖥 **Cross-platform** compatibility for modern browsers, Electron, and Tauri

## 🔨 Installation

```bash
npm install @nayan-ui/react
```

## ⚙️ Configuration

**1. Configure your `tailwind.config.js`:**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}', './index.html', './node_modules/@nayan-ui/react/dist/index.es.js'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--COLOR_PRIMARY)',
        'primary-light': 'var(--COLOR_PRIMARY_LIGHT)',
        'primary-dark': 'var(--COLOR_PRIMARY_DARK)',
        background: 'var(--COLOR_BACKGROUND)',
        text: 'var(--COLOR_TEXT)',
        muted: 'var(--COLOR_MUTED)',
        border: 'var(--COLOR_BORDER)',
        card: 'var(--COLOR_CARD)',
        shadow: 'var(--COLOR_SHADOW)',
        overlay: 'var(--COLOR_OVERLAY)'
      }
    }
  },
  plugins: [require('tailwindcss-animate')]
};
```

**2. Add library styles to your `index.css`:**

```css
@import '@nayan-ui/react/styles.css';

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --COLOR_PRIMARY: #005ee6;
    --COLOR_PRIMARY_DARK: #0043a3;
    --COLOR_PRIMARY_LIGHT: #0069ff;
    --COLOR_BACKGROUND: #f0f2f5;
    --COLOR_CARD: #ffffff;
    --COLOR_TEXT: #050505;
    --COLOR_MUTED: #808080;
    --COLOR_BORDER: #e0e0e0;
    --COLOR_SHADOW: #d3d3d3;
    --COLOR_OVERLAY: rgba(255, 255, 255, 0.7);
  }

  [data-theme='dark'] {
    --COLOR_PRIMARY: #2997ff;
    --COLOR_PRIMARY_DARK: #0a84ff;
    --COLOR_PRIMARY_LIGHT: #7dc1ff;
    --COLOR_BACKGROUND: #1f1f1f;
    --COLOR_CARD: #353535;
    --COLOR_TEXT: #f5f5f5;
    --COLOR_MUTED: #afafaf;
    --COLOR_BORDER: #4f4f4f;
    --COLOR_SHADOW: #cbcbcb;
    --COLOR_OVERLAY: rgba(0, 0, 0, 0.7);
  }

  body {
    color: var(--COLOR_TEXT) !important;
    background-color: var(--COLOR_BACKGROUND) !important;
  }
}
```

## 🚀 Usage

**Wrap your app with the NTheme provider:**

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
        <img src="https://www.nayanui.com/logo.webp" alt="Nayan UI" className="w-32 h-auto mb-8" />
        <h1 className="mb-5 text-3xl">Nayan UI</h1>
        <p className="mb-8">Best Component Library for React & React Native.</p>
        <NButton onClick={toggleTheme}>{theme === THEMES.DARK ? 'Switch to Light' : 'Switch to Dark'}</NButton>
      </div>
    </NTheme>
  );
}
```

## 📚 Documentation

For detailed documentation, component APIs, examples, and guides, visit **[www.nayanui.com](https://www.nayanui.com)**

## 🤝 Contributing

We welcome contributions! See the [contribution guide](https://www.nayanui.com/contributions) to learn how to contribute to the repository and development workflow.
