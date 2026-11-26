# Nayan UI starter

A shared landing screen runs in Vite on the web and Expo on iOS and Android. The apps import the local `nayan-ui` workspace.

## Run on the web

From the repository root, install the engine and starter workspaces, then build the local engine and start Vite.

```sh
bun install --frozen-lockfile --filter nayan-ui --filter @nayan-ui/example --filter @nayan-ui/shared --filter @nayan-ui/web --filter @nayan-ui/mobile
bun run engine:build
bun run example web
```

Open http://127.0.0.1:5173. The engine build needs the Rust WebAssembly target, the matching `wasm-bindgen-cli`, and a WebAssembly-capable C/C++ toolchain. See the [engine build prerequisites](../nayan-ui/README.md#development-and-verification).

## Run on iOS or Android

Install the platform SDK and use an Expo development build. A local engine checkout also needs its [native libraries built](../nayan-ui/README.md#development-and-verification).

```sh
bun run engine:core:build:ios
bun run example ios

bun run engine:core:build:android
bun run example android
```

Once the development build is installed, start Metro with `bun run example mobile`. The [Expo config](mobile/app.json) registers the Nayan UI plugin and targets Android API 26 or newer.

## Customize the landing page

- The shared landing page uses Nayan UI’s built-in utilities. Nayan UI compiles them to CSS for the browser and resolves them at runtime on mobile. [Landing.tsx](shared/src/Landing.tsx)
- Both apps pass the same light and dark palettes to `NTheme`. It follows the system on first launch and saves the selected mode through `nayan-ui/storage`. The web stylesheet uses those same palette values. [theme.ts](shared/src/theme.ts)
- [web/src/main.tsx](web/src/main.tsx) uses `NTheme` and `NPlatformView` to render the landing page as browser HTML.
- [mobile/src/app/_layout.tsx](mobile/src/app/_layout.tsx) configures the Expo navigator and root theme. [mobile/src/app/index.tsx](mobile/src/app/index.tsx) is the only screen.

Run `bun run example:typecheck` to check both apps and `bun run example web:build` to create the web build in `web/dist`.
