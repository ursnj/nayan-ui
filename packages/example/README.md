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

After installing the development build, you can start Metro with `bun run example mobile` and open the installed app on your simulator or device. The [Expo config](mobile/app.json) registers the Nayan UI plugin and targets Android API 26 or newer.

## Customize the landing page

- The shared landing page uses Nayan UI’s built-in utilities. Nayan UI compiles them to CSS for the browser and resolves them at runtime on mobile. [Landing.tsx](shared/src/Landing.tsx)
- Edit the light and dark palettes to theme surfaces, controls, fields, links, focus states, and status colors on all platforms. Both apps pass these palettes to `NTheme`, and the web build generates CSS variables from them for utilities like `bg-surface` and `text-accent-foreground`. The theme follows the system on first launch and saves the selected mode through `nayan-ui/storage`. [theme.ts](shared/src/theme.ts)
- [web/src/main.tsx](web/src/main.tsx) uses `NTheme` and `NPlatformView` to render the landing page as browser HTML.
- The mobile entry registers the landing page directly with Expo. `NTheme` provides the root theme and safe-area handling. [mobile/src/main.tsx](mobile/src/main.tsx)

Run `bun run example:typecheck` to check both apps and `bun run example web:build` to create the web build in `web/dist`.
