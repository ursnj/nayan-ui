# Nayan Engine game workspace

A complete Car Racing game for React browsers and React Native, adapted from Playtura's games-library Car Racing. Both apps run the same road, traffic, collision, scoring, audio, camera and lifecycle code. Only the UI and asset references differ.

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

The engine package must include `src` in its `package.json` `files` list. React Native Codegen reads `src/native/spec/NativeNayanEngine.ts` during pod installation, so compiled JavaScript alone is insufficient. Setup checks the archive for the required source and build files before replacing the existing tarball. If pod installation reports a missing `src/native` directory, update the engine checkout, rerun setup, and run `bun install --force` here to refresh the installed tarball.

## Run the browser app

```bash
bun run web
bun run web:build
bun run --cwd web preview
```

Open the local Vite URL. Use arrow keys or A/D, or drag/swipe the road. Start the race with the button; it also unlocks browser audio. The road fills the browser viewport, with the HUD and controls overlaid. Use the sun/moon control to switch light and dark mode; the browser remembers the choice, initially following the system preference. Switching modes preserves the active race, car positions and scenery layout while updating sky, lighting, moon/stars, street lamps and vehicle lights. Pause, resume, mute and replay are available. The example holds a 20 m/s cruising speed with a fixed camera field of view; web rendering uses medium quality to preserve resolution and anti-aliasing without automatic changes. Losing focus pauses an active race. The browser needs WebGPU or WebGL2; deploy the complete `web/dist` output over HTTPS (localhost works for development), including the emitted WASM and audio worklet.

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

The race fills the mobile screen with the status bar hidden. Score, lives and distance overlay the road at the top, with theme, sound and pause controls placed inside the safe area. Swipe anywhere on the road to steer; the HUD leaves touches free outside its buttons. The Light mode/Dark mode control switches the scene and UI during a race, initially following the device appearance. An active race pauses when the app backgrounds and resumes through the Resume button. Android requires API 26 or newer; the included Expo plugin sets the minimum SDK.

## Develop a shared game

Keep each example in `shared/<example-name>/`, with its own `src` and `assets` directories. Car Racing lives in `shared/car-racing` and is imported from `@nayan-engine-example/shared/car-racing`. Add a matching subpath export in `shared/package.json` for each new example. `useRacing` demonstrates warming the engine before loading assets, creating a world for each run, driving it through `GameView.onUpdate`, publishing HUD state, and disposing it on replay/unmount. Meshes and decoded assets are cached across runs.

Store each game’s assets once in `shared/<example-name>/assets` and expose them through its own package subpath, such as `@nayan-engine-example/shared/car-racing/assets/*`. The web adapter uses Vite `?url` imports, and the mobile adapter uses Metro's static `require`. Pass either adapter to the same `loadAssets` function. Avoid browser or React Native imports in shared rules. Keep platform UI and asset adapters in matching folders: `web/src/<example-name>/` and `mobile/src/<example-name>/`. The app entry points mount the selected example; keep providers and other app setup in those entry points.

The game is a 2,000-metre sprint: crossing the finish gate wins, losing three lives ends the race, and each car passed earns 500 points. Scenery and procedural models follow Playtura’s games-app Car Racing: textured city buildings, suburban houses, roadside trees, country forests, rails and street lights. Additional cached meshes add glazed shopfronts, facade trim, detailed roofs, warm night windows, tiled sidewalks, planters, flowers, benches, bins, bus shelters, drain grates, rail reflectors, route signs, house porches/chimneys, verge grasses and distant clouds. Existing tower silhouettes, trees and red/white kerbs are preserved. All decoration meshes and sign glyphs are prepared during loading and reused across road recycling and replays. Driving follows that game’s progressive lateral steering (9 m/s limit, approximately 0.47 seconds to the next lane) with filtered input, a critically damped lane path that settles without overshoot, and independently smoothed car yaw/lean with a limited 13-degree visual steering angle, car yaw/lean, footprint-based front hits and sideswipes, crash tumbles, bursts and burning wrecks. Solid side hits also send the struck car into a native rolling wreck with a blast and fire; light grazes shove it aside and spark, without costing the player a life. The example keeps its calmer 20 m/s cruising speed and fixed camera field of view.

Vehicles controlled by the shared rules receive their integrated pose directly, so the engine’s separate 60 Hz simulation cannot double-apply movement on high-refresh displays. The engine still simulates crashed cars, particles, score, audio and haptics. The chase camera follows the displayed player position exactly while smoothing its relative offsets. Best scores last for the app session.

```bash
bun run typecheck
bun test shared/car-racing/tests
```

## Attribution

The racing implementation is adapted from the sibling Playtura checkout's `packages/games/src/games/car-racing` and its racing helpers in `packages/games/src/games/shared`. Cars, trees and race markers are built procedurally in TypeScript. Textures, sound effects and the finish banner font come from `packages/games/src/assets`. See [shared/car-racing/assets/ATTRIBUTION.md](./shared/car-racing/assets/ATTRIBUTION.md).
