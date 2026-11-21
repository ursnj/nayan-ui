# Nayan UI

Game engine and components for React and React Native, with playable games and developer guides.

[![License](https://img.shields.io/npm/l/@nayan-ui/engine.svg)](./packages/engine)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Website](https://img.shields.io/badge/docs-nayanui.com-black.svg)](https://www.nayanui.com)

---

## Highlights

- **Game engine and components** — `@nayan-ui/engine` for Expo and web, with 3D rendering, physics, and cross-platform UI
- **Playable games** — the private `@nayan-ui/games` library powers [nayanui.com/games](https://www.nayanui.com/games)
- **Developer guides** — PDF, image, JSON, XML, text and SEO documentation plus a browser video editor at [nayanui.com](https://www.nayanui.com)

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
bun install --frozen-lockfile --filter @nayan-ui/engine
```

The [engine workflow](./.github/workflows/npm-publish.yml) runs on engine changes pushed to
`refactor-nayan-ui` or `main`. It builds iOS, Android and WebAssembly libraries, runs the
Rust and TypeScript tests, and attaches the checked npm tarball as a workflow artifact.
See the [engine README](./packages/engine/README.md#development-and-verification) for
local build prerequisites and commands.

## Website

[packages/website](./packages/website) (`@nayan-ui/website`) is the Next.js app behind [www.nayanui.com](https://www.nayanui.com). It hosts the component docs, games, developer tool guides and the video editor. It ships as the Docker image `ursnj/nayanui` (port `7100`). Site components, demos, and tooling use the workspace engine.

With the website dependencies installed and the Rust/WASM prerequisites from the engine README available, run:

```sh
bun run website:dev
```

The website dev and production commands build the browser engine when needed and compile the browser and preview stylesheets. Run `bun run engine:build:web` after changing the engine source.

## Examples

| Example | Description |
| --- | --- |
| [packages/example](./packages/example) | Interactive web and mobile examples for the local engine |

## Quick Start

```bash
git clone --depth 1 https://github.com/ursnj/nayan-ui.git
cd nayan-ui
bun install --frozen-lockfile --filter @nayan-ui/engine --filter @nayan-ui/example --filter '@nayan-example/*'
bun run engine:build
bun run example web
```

## Repository Structure

```
packages/
  engine/    @nayan-ui/engine  — Game engine and components
  website/   @nayan-ui/website — nayanui.com (Next.js)
  example/   @nayan-ui/example — Engine demos for Expo and web
.github/     engine CI and website image publishing
scripts/     local publish scripts (Docker)
```

## Development

This monorepo uses the Bun channel in `.bun-version` and a hoisted workspace layout for Expo and Metro. The full checks need the website's Playtura games tarball and the generated engine package. For engine-only work, use the filtered install above.

```bash
bun install --frozen-lockfile
bun run engine:build
```

| Command                     | Description                              |
| --------------------------- | ---------------------------------------- |
| `bun run engine:build`      | Build the engine package                 |
| `bun run engine:typecheck`  | Type-check the engine                     |
| `bun run engine:test`       | Run the engine unit tests                 |
| `bun run website:dev`       | Run the website in development           |
| `bun run website:build`     | Production build of the website          |
| `bun run website:start`     | Serve the production build on port 7100  |
| `bun run format`            | Format the codebase with Bun            |
| `bun run format:check`      | Check formatting without writing files   |
| `bun run lint`              | Run Bun lint across the monorepo          |
| `bun run typecheck`         | Check the engine, examples, and website   |
| `bun run test`              | Run the engine and website Bun tests     |
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
