# Nayan UI

Game engine and components for React and React Native, with playable games and developer guides.

[![License](https://img.shields.io/npm/l/nayan-ui.svg)](./packages/nayan-ui)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Website](https://img.shields.io/badge/docs-nayanui.com-black.svg)](https://www.nayanui.com)

---

## Highlights

- [Nayan Components](https://www.nayanui.com/components) and [Nayan Modules](https://www.nayanui.com/modules) provide cross-platform UI and services.
- [Nayan Game Engine](https://www.nayanui.com/game-engine) provides 3D rendering and physics. Try it in [Nayan Playground](https://www.nayanui.com/playground).
- [Nayan Games](https://www.nayanui.com/games) offers playable games from `@nayan-ui/games`.
- [Nayan Video Editor](https://www.nayanui.com/video-editor) edits and exports video in the browser.

---

## Packages

| Package | Version | Description |
| --- | --- | --- |
| [nayan-ui](./packages/nayan-ui) | [![npm](https://badge.fury.io/js/nayan-ui.svg)](https://www.npmjs.com/package/nayan-ui) | Game engine for React Native and web |
| [@nayan-ui/website](./packages/website) | Private | Nayan UI website and documentation |
| @nayan-ui/games | Local archive | Nayan Games |

The engine source and SDK documentation live in [packages/nayan-ui](./packages/nayan-ui).
The website installs `@nayan-ui/games` from a [checked-in tarball](./packages/website/scripts/nayan-ui-games.tgz) and uses the engine from this workspace.

## Engine development

Install just the engine dependencies from a clean checkout:

```sh
bun install --frozen-lockfile --filter nayan-ui
```

Run the [engine workflow](./.github/workflows/npm-publish.yml) from **Actions → Run workflow**.
Select the branch and choose an operation.

- `validate` builds iOS, Android and WebAssembly, runs the tests, and performs an npm dry run.
- `publish` builds, tests, and publishes the version in `packages/nayan-ui/package.json`
  through npm Trusted Publishing.

Both commands run the platform builds in parallel and reuse cached binaries when the Rust inputs match.
Download the tested `nayan-ui` artifact from a successful run. See the
[engine README](./packages/nayan-ui/README.md#development-and-verification) for local builds.

### First npm release

Publish the tested tarball once from an npm account with two-factor authentication.
Download and unzip the workflow's `nayan-ui` artifact, then run the following from that directory.

```sh
npm login --registry=https://registry.npmjs.org
npm publish ./nayan-ui-1.0.0-beta.1.tgz --access public --tag beta --ignore-scripts
```

In the new package's npm settings, add a GitHub Actions trusted publisher with owner `ursnj`,
repository `nayan-ui`, and workflow `npm-publish.yml`. Leave the environment blank and enable
`npm publish`. Use a new package version for the first GitHub Actions release.
[npm Trusted Publishing settings](https://docs.npmjs.com/trusted-publishers/#step-1-add-a-first-trusted-publisher-on-npmjscom)

## Website

[packages/website](./packages/website) (`@nayan-ui/website`) is the Next.js app behind [www.nayanui.com](https://www.nayanui.com). It hosts the component docs, games, developer tool guides and the video editor. It ships as the Docker image `ursnj/nayanui` (port `7100`). Site components, demos, and tooling use the workspace engine.

With the website dependencies installed and the Rust/WASM prerequisites from the engine README available, run:

```sh
bun run website:dev
```

The website dev and production commands build the browser engine when needed. Next.js compiles the website's Tailwind utilities. Run `bun run engine:build:web` after changing the engine source.

### Updating the games archive

Obtain a built `@nayan-ui/games` package archive that declares `nayan-ui` as its engine peer dependency, then run these commands from the repository root.

```sh
cp /path/to/nayan-ui-games-version.tgz packages/website/scripts/nayan-ui-games.tgz
bun update --cwd=packages/website --ignore-scripts @nayan-ui/games
```

Commit the archive and the updated `bun.lock` together. Local and CI Docker builds install that exact archive with Bun’s frozen lockfile. The games license is included in the archive.

## Examples

| Example | Description |
| --- | --- |
| [packages/example](./packages/example) | Interactive web and mobile examples for the local engine |

## Quick Start

```bash
git clone --depth 1 https://github.com/ursnj/nayan-ui.git
cd nayan-ui
bun install --frozen-lockfile --filter nayan-ui --filter @nayan-ui/example --filter '@nayan-example/*'
bun run engine:build
bun run example web
```

## Repository Structure

```
packages/
  nayan-ui/  nayan-ui  — Game engine and components
  website/   @nayan-ui/website — nayanui.com (Next.js)
  example/   @nayan-ui/example — Engine demos for Expo and web
.github/     engine CI and website image publishing
scripts/     local publish scripts (Docker)
```

## Development

This monorepo uses the Bun channel in `.bun-version` and a hoisted workspace layout for Expo and Metro. The full checks need the checked-in games archive and the generated engine package. For engine-only work, use the filtered install above.

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

Install the Git hooks from the repository root with `bunx lefthook install`.
Pre-commit checks formatting and lint on staged files. When the games archive or lockfile changes, it checks that their staged versions match.

## Publishing

- **Engine package** — manually run **Build and publish nayan-ui**. Choose **validate** for a dry run and a verified tarball, or **publish** to release to npm. Leave **Publish as beta** unchecked for `latest`, or check it for `beta`. The package version comes from `packages/nayan-ui/package.json`.
- **Website** — run the **Publish website docker images** workflow to build and push `ursnj/nayanui:latest`. Requires the `DOCKER_HUB_TOKEN` repository secret.
  Or publish it from your machine with `bun run docker:publish` (needs Docker and `docker login` as ursnj; `--dry-run` builds and checks without pushing, `--help` lists the options).

## Documentation

For detailed documentation, component APIs, examples, and guides, visit **[www.nayanui.com](https://www.nayanui.com)**

## Contributing

We welcome contributions! See the [contribution guide](https://www.nayanui.com/contributions) to learn how to contribute to the repository and development workflow.

## License

MIT

---

Developed with ❤️ by [Niranjan Reddy Devasani](https://github.com/ursnj)
