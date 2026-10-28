# Nayan Engine game workspace

A complete Car Racing game for React browsers and React Native, adapted from Playtura's engine example. Both apps run the same road, traffic, collision, scoring, audio, camera and lifecycle code. Only the UI and asset references differ.

```text
engine/
├── package.json          # Independent Bun workspace (install here)
├── web/                  # React + Vite app shell
│   └── src/car-racing/    # Racing screen, browser assets and styles
├── mobile/               # Expo native app shell
│   └── src/car-racing/    # Racing screen and native assets
├── shared/
│   └── car-racing/       # Each example has its own folder
│       ├── src/          # Game rules, scene, assets contract and React hook
│       └── assets/       # Models, textures and sounds for this game
└── scripts/setup-engine.mjs
```

## Prepare the engine

Prerequisites: Bun, Node.js 22.12+ and a built `@nayan-ui/engine` checkout with browser support. Native builds also require Xcode/CocoaPods or Android Studio and the platform requirements of that engine checkout. Expo Go cannot run this engine.

The npm release `1.0.0-beta.1` does not include the browser entry point. Until a browser-capable version is published, package the current engine from a Playtura checkout. Follow that checkout's engine build instructions, including native libraries for each target you want to run:

```bash
# In the Playtura checkout
bun install
bun run engine:build
# If native core libraries are not already present, build the target(s):
bun run engine:core:build:ios
bun run engine:core:build:android
```

Then, from this directory:

```bash
bun run setup /absolute/path/to/playtura/packages/engine
bun install
```

Setup creates an ignored `.engine/nayan-ui-engine.tgz`. Both apps install that same package, without depending on the location of the checkout at runtime. After engine changes, rebuild it, rerun setup, and reinstall dependencies. Rebuild native apps after native engine changes. When distributing this workspace to another developer, have them run setup against their own checkout.

## Run the browser app

```bash
bun run web
bun run web:build
bun run --cwd web preview
```

Open the local Vite URL. Use arrow keys or A/D, or drag/swipe the road. Start the race with the button; it also unlocks browser audio. Pause, resume, mute and replay are available. Losing focus pauses an active race. The browser needs WebGPU or WebGL2; deploy the complete `web/dist` output over HTTPS (localhost works for development), including the emitted WASM and audio worklet.

### Tailwind CSS

The web app uses Tailwind CSS v4 through `@tailwindcss/vite`. Its entry stylesheet imports `tailwindcss`; Vite scans the web source and the shared source directory for utilities. Use utility classes directly in web components. No PostCSS or JavaScript Tailwind configuration is needed. Keep mobile styling in React Native styles.

## Run the mobile app

```bash
bun run ios
# or
bun run android

# Start Metro again for an already installed development build:
bun run mobile
```

Swipe anywhere on the road to steer. Touch controls remain outside the engine surface. An active race pauses when the app backgrounds and resumes through the Resume button. Android requires API 26 or newer; the included Expo plugin sets the minimum SDK.

## Develop a shared game

Keep each example in `shared/<example-name>/`, with its own `src` and `assets` directories. Car Racing lives in `shared/car-racing` and is imported from `@nayan-engine-example/shared/car-racing`. Add a matching subpath export in `shared/package.json` for each new example. `useRacing` demonstrates warming the engine before loading assets, creating a world for each run, driving it through `GameView.onUpdate`, publishing HUD state, and disposing it on replay/unmount. Meshes and decoded assets are cached across runs.

Store each game’s assets once in `shared/<example-name>/assets` and expose them through its own package subpath, such as `@nayan-engine-example/shared/car-racing/assets/*`. The web adapter uses Vite `?url` imports, and the mobile adapter uses Metro's static `require`. Pass either adapter to the same `loadAssets` function. Avoid browser or React Native imports in shared rules. Keep platform UI and asset adapters in matching folders: `web/src/<example-name>/` and `mobile/src/<example-name>/`. The app entry points mount the selected example; keep providers and other app setup in those entry points.

The game awards 500 points per car passed, lasts 120 seconds, and ends early after three crashes. Best scores last for the app session.

```bash
bun run typecheck
```

## Attribution

The racing implementation and bundled scenery/sounds are adapted from the sibling Playtura checkout's `packages/engine/example/games/racing` and `assets` directories. The car derives from Khronos' [Car Concept sample](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CarConcept), under CC BY 4.0. See [shared/car-racing/assets/ATTRIBUTION.md](./shared/car-racing/assets/ATTRIBUTION.md) for the model credit and modifications.
