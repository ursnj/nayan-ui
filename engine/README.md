# Nayan Engine example: Car Racing

A small, complete racing game for React browsers and React Native, built on `@nayan-ui/engine`. Both apps run the same shared game; only the screen and asset references differ. It is the core of Playtura's Car Racing: a road, traffic, steering, crashes, lives, score and a finish line.

```text
engine/
├── web/src/car-racing/        # React + Vite screen and asset URLs
├── mobile/src/car-racing/     # Expo screen and Metro asset requires
├── shared/car-racing/
│   ├── src/
│   │   ├── CarRacingConstants.ts  # tuning, look and loadAssets()
│   │   ├── CarRacingMeshes.ts     # procedural car and tree, built once
│   │   ├── CarRacingRules.ts      # pure helpers (collision, distance)
│   │   ├── CarRacingGame.ts       # the game: scene, rules, per-frame tick
│   │   └── useCarRacing.ts        # React hook shared by both screens
│   ├── assets/                # textures and sounds
│   └── tests/
└── scripts/setup-engine.mjs
```

## What it shows

| Engine feature                                       | Where                                                       |
| ---------------------------------------------------- | ----------------------------------------------------------- |
| `useWorld` owns the world; setup returns its cleanup | `useCarRacing.ts`                                           |
| `GameView` steps the world after `onUpdate`          | `tick` only moves things; it never calls `world.update`     |
| `world.transforms` for per-frame moves               | player, traffic and recycled road tiles                     |
| `camera.follow` and `camera.shake`                   | chase camera, crash shake                                   |
| `scoreboard` handlers for rules, `listen` for the UI | lives running out ends the race; the HUD listens            |
| `effects.sparks`, `effects.confetti`                 | crashes, the win                                            |
| `audio.load`, looping voices, `haptics`              | engine sound, hits, points, results                         |
| Procedural meshes built once (`block`, `merge`, …)   | `CarRacingMeshes.ts`                                        |
| Assets per host                                      | URLs (`?url`) in the browser, `require(...)` on React Native |
| CSS colors in options                                | cars, sky, lane markings                                    |

## Prepare the engine

Package the engine from a Playtura checkout (built with `bun run engine:build`, plus `bun run engine:core:build:ios` / `:android` for native), then install here:

```bash
bun run setup /absolute/path/to/playtura/packages/engine
bun install
```

Setup writes an ignored `.engine/nayan-ui-engine.tgz` that both apps install. After engine changes, rerun setup and `bun install --force`; rebuild the native app after native engine changes. Expo Go cannot run the engine.

## Run

```bash
bun run web          # browser (WebGPU or WebGL2, HTTPS or localhost)
bun run web:build
bun run ios          # or: bun run android (API 26+)
bun run mobile       # Metro for an installed development build
```

Steer with the arrow keys or A/D in the browser, or drag the road anywhere. Overtaking a car scores 10, touching one costs a life (with a short moment of invulnerability), and reaching the finish 1,500 m away wins, with 100 points per life left.

```bash
bun run typecheck
bun test shared/car-racing/tests
```

## Attribution

Adapted from Playtura's games-library Car Racing. Cars and trees are built in code; textures and sound effects come from Playtura's shared assets. See [shared/car-racing/assets/ATTRIBUTION.md](./shared/car-racing/assets/ATTRIBUTION.md).
