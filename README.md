# Nayan UI

Game engine and components for React and React Native, with playable games and free online tools.

[![License](https://img.shields.io/npm/l/@nayan-ui/engine.svg)](./packages/engine)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Website](https://img.shields.io/badge/docs-nayanui.com-black.svg)](https://www.nayanui.com)

---

## Highlights

- **Game engine and components** — `@nayan-ui/engine` for Expo and web, with 3D rendering, physics, and cross-platform UI
- **Playable games** — the private `@nayan-ui/games` library powers [nayanui.com/games](https://www.nayanui.com/games)
- **Online tools** — PDF, image, JSON, XML, text, SEO and developer tools plus a browser video editor at [nayanui.com](https://www.nayanui.com)

---

## Packages

| Package | Version | Description |
| --- | --- | --- |
| [@nayan-ui/engine](./packages/engine) | [![npm](https://badge.fury.io/js/@nayan-ui%2Fengine.svg)](https://www.npmjs.com/package/@nayan-ui/engine) | Game engine for React Native and web |
| [@nayan-ui/website](./packages/website) | Private | Nayan UI website and documentation |
| @nayan-ui/games | Private | Games built on the Nayan engine |

The engine source and SDK documentation live in [packages/engine](./packages/engine).
The private `@nayan-ui/games` package comes from Playtura. The Docker publish workflow builds
its tarball for the website, which builds and uses the engine from this workspace.

## Engine development

Install just the engine dependencies from a clean checkout:

```sh
bun install --frozen-lockfile --filter @nayan-ui/engine --linker hoisted
```

The [engine workflow](./.github/workflows/npm-publish.yml) runs on engine changes pushed to
`refactor-nayan-ui` or `main`. It builds iOS, Android and WebAssembly libraries, runs the
Rust and TypeScript tests, and attaches the checked npm tarball as a workflow artifact.
See the [engine README](./packages/engine/README.md#development-and-verification) for
local build prerequisites and commands.

## Website

[packages/website](./packages/website) (`@nayan-ui/website`) is the Next.js app behind [www.nayanui.com](https://www.nayanui.com). It hosts the component docs, games, devtools docs, the online tools and the video editor. It ships as the Docker image `ursnj/nayanui` (port `7100`). The shared site UI and live homepage preview use the workspace engine. Published component demos and browser tools retain their existing controls.

With the website dependencies installed and the Rust/WASM prerequisites from the engine README available, run:

```sh
bun run website:dev
```

The website dev and production commands build the browser engine when needed and compile the preview stylesheet. Run `bun run engine:build:web` after changing the engine source.

## Examples

| Example | Description |
| --- | --- |
| [packages/example](./packages/example) | Interactive web and mobile examples for the local engine |
| [examples/games](./examples/games) | Nayan Game Engine games for Expo and Vite |
| [examples/vite](./examples/vite) | Vite example using the published React library |
| [examples/nextjs](./examples/nextjs) | Next.js example using the published React library |
| [examples/expo](./examples/expo) | Expo example using the published React Native library |

## Quick Start

```bash
git clone --depth 1 https://github.com/ursnj/nayan-ui.git
cd nayan-ui/examples/games
bun install
bun run web
```

## Repository Structure

```
packages/
  engine/    @nayan-ui/engine  — Game engine and components
  website/   @nayan-ui/website — nayanui.com (Next.js)
examples/    vite, nextjs, expo, games starter projects
.github/     engine CI and website image publishing
scripts/     local publish scripts (Docker)
```

## Development

This is a [Bun](https://bun.sh) workspace monorepo. A full install needs the website's Playtura games tarball. For engine-only work, use the filtered installation above.

```bash
bun install
```

| Command                     | Description                              |
| --------------------------- | ---------------------------------------- |
| `bun run engine:build`      | Build the engine package                 |
| `bun run engine:typecheck`  | Type-check the engine                     |
| `bun run engine:test`       | Run the engine unit tests                 |
| `bun run website:dev`       | Run the website in development           |
| `bun run website:build`     | Production build of the website          |
| `bun run website:start`     | Serve the production build on port 7100  |
| `bun run format`            | Format the codebase with oxfmt           |
| `bun run clean`             | Remove `node_modules` and build outputs  |

## Publishing

- **Engine package** — download the verified npm tarball from a successful **Build engine** workflow run.
- **Website** — run the **Publish website docker images** workflow to build and push `ursnj/nayanui:latest`. Requires the `PLAYTURA_TOKEN` and `DOCKER_HUB_TOKEN` repository secrets.
  Or publish it from your machine with `bun run docker:publish` (needs Docker, a playtura checkout at `../playtura` or `--playtura <dir>`, and `docker login` as ursnj; `--dry-run` builds and checks without pushing, `--help` lists the options).

## Documentation

For detailed documentation, component APIs, examples, and guides, visit **[www.nayanui.com](https://www.nayanui.com)**

## Contributing

We welcome contributions! See the [contribution guide](https://www.nayanui.com/contributions) to learn how to contribute to the repository and development workflow.

## License

MIT

---

Developed with ❤️ by [Niranjan Reddy Devasani](https://github.com/ursnj)
