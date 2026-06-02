# Nayan UI

Reusable Component Libraries for React and React Native.

[![License](https://img.shields.io/npm/l/@nayan-ui/react.svg)](https://github.com/ursnj/nayan-ui/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

---

## Packages

| Package                               | Version                                                                                                   | Description                                                     |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| [@nayan-ui/react](./packages/react)   | [![npm](https://badge.fury.io/js/@nayan-ui%2Freact.svg)](https://www.npmjs.com/package/@nayan-ui/react)   | React component library built on HeroUI + Tailwind CSS v4       |
| [@nayan-ui/native](./packages/native) | [![npm](https://badge.fury.io/js/@nayan-ui%2Fnative.svg)](https://www.npmjs.com/package/@nayan-ui/native) | React Native component library built on HeroUI Native + Uniwind |
| [@nayan-ui/cli](./packages/cli)       | [![npm](https://badge.fury.io/js/@nayan-ui%2Fcli.svg)](https://www.npmjs.com/package/@nayan-ui/cli)       | CLI for project scaffolding, sitemap & robots.txt generation    |

## Examples

| Example                              | Description                                      |
| ------------------------------------ | ------------------------------------------------ |
| [examples/vite](./examples/vite)     | React + Vite + Tailwind CSS v4 + @nayan-ui/react |
| [examples/nextjs](./examples/nextjs) | Next.js + Tailwind CSS v4 + @nayan-ui/react      |
| [examples/expo](./examples/expo)     | Expo + Uniwind + @nayan-ui/native                |
| [examples/games](./examples/games)   | Expo + react-native-games                        |

## Quick Start

### React (Vite)

```bash
npx @nayan-ui/cli new my-app -t vite
cd my-app
npm install
npm run dev
```

### React (Next.js)

```bash
npx create-next-app@latest my-app
cd my-app
npm install @nayan-ui/react
npm install -D @tailwindcss/postcss tailwindcss
npm run dev
```

See [examples/nextjs](./examples/nextjs) for full setup with `transpilePackages` and `@tailwindcss/postcss`.

### React Native (Expo)

```bash
npx @nayan-ui/cli new my-app -t expo
cd my-app
npm install
npx expo start
```

### Games (Expo)

```bash
npx @nayan-ui/cli new my-app -t games
cd my-app
npm install
npx expo start
```

## Monorepo Setup

This is a Yarn 4 monorepo.

```bash
# Enable corepack (ships with Node.js 18+)
corepack enable

# Install dependencies
yarn install

# Development
yarn react:dev       # Watch-build the React package
yarn website:dev     # Run the docs website (localhost:3001)
yarn native:build    # Build the Native package

# Production
yarn react:build     # Build the React package
yarn website:build   # Build the docs website
yarn native:build    # Build the Native package
```

## Documentation

For detailed documentation, component APIs, examples, and guides, visit **[www.nayanui.com](https://www.nayanui.com)**

## Contributing

We welcome contributions! See the [contribution guide](https://www.nayanui.com/contributions) to learn how to contribute to the repository and development workflow.

## License

MIT
