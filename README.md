# Nayan UI

Reusable component libraries for React and React Native, a game engine with free games, developer CLIs, and 70+ free online tools — all in one monorepo.

[![License](https://img.shields.io/npm/l/@nayan-ui/react.svg)](https://github.com/ursnj/nayan-ui/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Website](https://img.shields.io/badge/docs-nayanui.com-black.svg)](https://www.nayanui.com)

---

## Highlights

- **React components** — accessible, themeable components built on HeroUI + Tailwind CSS v4
- **React Native components** — matching API built on HeroUI Native + Uniwind
- **Game engine & games** — `@nayan-ui/engine` for Expo and web, plus private `@nayan-ui/games` playable on [nayanui.com/games](https://www.nayanui.com/games)
- **CLI** — scaffold Vite / Expo / games projects, generate sitemaps and robots.txt
- **AI code reviewer** — PR reviews, vulnerability scans and auto-fixes with Codex or Claude Code
- **Online tools** — PDF, image, JSON, XML, text, SEO and developer tools plus a browser video editor at [nayanui.com](https://www.nayanui.com)

---

## Packages

| Package                                                          | Version                                                                                                   | Description                                                     |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| [@nayan-ui/react](./packages/react)                              | [![npm](https://badge.fury.io/js/@nayan-ui%2Freact.svg)](https://www.npmjs.com/package/@nayan-ui/react)   | React component library built on HeroUI + Tailwind CSS v4       |
| [@nayan-ui/native](./packages/native)                            | [![npm](https://badge.fury.io/js/@nayan-ui%2Fnative.svg)](https://www.npmjs.com/package/@nayan-ui/native) | React Native component library built on HeroUI Native + Uniwind |
| [@nayan-ui/engine](https://www.npmjs.com/package/@nayan-ui/engine) | [![npm](https://badge.fury.io/js/@nayan-ui%2Fengine.svg)](https://www.npmjs.com/package/@nayan-ui/engine) | Game engine for React Native and web                          |
| @nayan-ui/games                                                  | Private                                                                                                   | Games built on the Nayan engine (private, not published to npm) |
| [@nayan-ui/cli](./packages/cli)                                  | [![npm](https://badge.fury.io/js/@nayan-ui%2Fcli.svg)](https://www.npmjs.com/package/@nayan-ui/cli)       | CLI for project scaffolding, sitemap & robots.txt generation    |
| [@nayan-ui/ai](./packages/ai)                                    | [![npm](https://badge.fury.io/js/@nayan-ui%2Fai.svg)](https://www.npmjs.com/package/@nayan-ui/ai)         | AI-powered code reviewer using Codex & Claude Code agents       |

> `@nayan-ui/engine` and `@nayan-ui/games` are developed in a separate repository. `@nayan-ui/games` is a **private package**: it is not published to npm and is bundled into the website as a tarball (`packages/website/scripts/nayan-ui-games.tgz`) by the Docker publish workflow.

## Website

[packages/website](./packages/website) (`@nayan-ui/website`) is the Next.js app behind [www.nayanui.com](https://www.nayanui.com). It hosts the component docs, games, devtools docs, the online tools and the video editor. It ships as the Docker image `ursnj/nayanui` (port `7100`).

## Examples

| Example                              | Description                               |
| ------------------------------------ | ----------------------------------------- |
| [examples/vite](./examples/vite)     | React + Vite + Tailwind CSS v4 + Nayan UI |
| [examples/nextjs](./examples/nextjs) | Next.js + Tailwind CSS v4 + Nayan UI      |
| [examples/expo](./examples/expo)     | Expo + Uniwind + Nayan UI native          |
| [examples/games](./examples/games)   | Nayan Game Engine games for Expo and Vite |

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

### Game engine (Expo + Vite)

```bash
npx @nayan-ui/cli new my-game -t games
cd my-game
bun install
bun run web
```

### AI code reviewer

```bash
npm install -g @nayan-ui/ai
nayan-ai review   # review a pull request
nayan-ai scan     # scan dependencies for vulnerabilities
```

## Repository Structure

```
packages/
  react/     @nayan-ui/react   — React component library
  native/    @nayan-ui/native  — React Native component library (+ example app)
  cli/       @nayan-ui/cli     — scaffolding & SEO CLI
  ai/        @nayan-ui/ai      — AI code reviewer CLI
  website/   @nayan-ui/website — nayanui.com (Next.js)
examples/    vite, nextjs, expo, games starter projects
.github/     publish workflows (npm + Docker)
```

## Development

This is a [Bun](https://bun.sh) workspace monorepo.

```bash
bun install
```

| Command                     | Description                              |
| --------------------------- | ---------------------------------------- |
| `bun run react:dev`         | Watch-build the React package            |
| `bun run react:build`       | Build the React package                  |
| `bun run native:build`      | Build the Native package                 |
| `bun run native:typecheck`  | Type-check the Native package            |
| `bun run native:example`    | Run the Native example app               |
| `bun run cli:build`         | Build the CLI                            |
| `bun run ai:build`          | Build the AI reviewer                    |
| `bun run website:dev`       | Run the website in development           |
| `bun run website:build`     | Production build of the website          |
| `bun run website:start`     | Serve the production build on port 7100  |
| `bun run format`            | Format the codebase with oxfmt           |
| `bun run clean`             | Remove `node_modules` and build outputs  |

## Publishing

- **npm packages** — run the **Publish npm packages** workflow and select the packages to release (supports dry run). Uses npm trusted publishing, no token required.
- **Website** — run the **Publish website docker images** workflow to build and push `ursnj/nayanui:latest`. Requires the `PLAYTURA_TOKEN` and `DOCKER_HUB_TOKEN` repository secrets.

## Documentation

For detailed documentation, component APIs, examples, and guides, visit **[www.nayanui.com](https://www.nayanui.com)**

## Contributing

We welcome contributions! See the [contribution guide](https://www.nayanui.com/contributions) to learn how to contribute to the repository and development workflow.

## License

MIT

---

Developed with ❤️ by [Niranjan Reddy Devasani](https://github.com/ursnj)
