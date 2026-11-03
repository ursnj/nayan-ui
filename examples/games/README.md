# Nayan Engine examples

Games and demos built on `@nayan-ui/engine` for iOS, Android and the browser. Each example is a React Native component in `shared/`, used unchanged by both apps: the Expo app renders it directly, the Vite app through `react-native-web`. Each app has its own gallery that lists the examples and opens one full screen. The mobile gallery is written in React Native; the web gallery is React DOM with Tailwind, and gives every example its own URL (`#/car-racing`).

```text
games/
├── shared/                      # the examples, nothing else
│   ├── index.ts                 # exports each example's component
│   └── car-racing/              # one folder per example: src/, assets/, tests/
├── mobile/
│   ├── index.ts                 # registerRootComponent(Gallery)
│   └── src/
│       ├── Gallery.tsx          # React Native list, open example, back button (and Android back)
│       └── examples.ts          # the cards
└── web/
    └── src/
        ├── main.tsx             # createRoot(...).render(<Gallery />)
        ├── Gallery.tsx          # React DOM grid, open example, hash routes
        └── examples.ts          # the cards; each example loads when first opened
```

| Example                   | What it is                                                                          |
| ------------------------- | ----------------------------------------------------------------------------------- |
| [Car Racing](#car-racing) | Overtake traffic down a three-lane road to the finish, with three lives (glTF cars) |

## Create a project

```bash
npx @nayan-ui/cli new my-game -t games
cd my-game
bun install
```

It's a [Bun](https://bun.sh) workspace (`web`, `mobile`, `shared`); the apps install `@nayan-ui/engine` from npm. The mobile app needs a development build (iOS, or Android API 26+); Expo Go cannot run the engine.

## Add an example

1. Create `shared/<example-id>/` with `src/<Name>.tsx` exporting the screen component, plus `assets/` and `tests/` as needed, and export the component from `shared/index.ts`.
2. Reference assets with Metro `require(...)` in `src/<Name>Assets.ts` and with Vite `?url` imports in `src/<Name>Assets.web.ts`; each platform picks its own file.
3. Add a card to `mobile/src/examples.ts` and `web/src/examples.ts`: id, title, description, icon, color, tags and the screen (lazy on the web).

An example fills its parent and keeps its top-right corner free for the gallery's back button.

## Run

```bash
bun run web          # browser (WebGPU or WebGL2, HTTPS or localhost)
bun run web:build
bun run ios          # or: bun run android (API 26+)
bun run mobile       # Metro for an installed development build
```

```bash
bun run typecheck
bun test shared
```

## Car Racing

The core of Playtura's Car Racing: a road, traffic, steering, crashes, lives, score and a finish line. Steer with the arrow keys or A/D in the browser, or drag the road anywhere. Overtaking a car scores 10, touching one costs a life (with a short moment of invulnerability), and reaching the finish 1,500 m away wins, with 100 points per life left.

```text
shared/car-racing/
├── src/
│   ├── CarRacing.tsx          # the screen: GameView, HUD, overlay, keyboard on the web
│   ├── useCarRacing.ts        # assets, world (useWorld), HUD state and input
│   ├── CarRacingGame.ts       # the game: scene, rules, per-frame tick
│   ├── CarRacingConstants.ts  # tuning, look and loadAssets()
│   ├── CarRacingAssets.ts     # Metro require(...) sources (.web.ts: Vite URLs)
│   ├── CarRacingMeshes.ts     # procedural tree, built once
│   └── CarRacingRules.ts      # pure helpers (collision, distance)
├── assets/                    # car models, textures and sounds
└── tests/
```

### What it shows

| Engine feature                                       | Where                                                         |
| ---------------------------------------------------- | ------------------------------------------------------------- |
| `useWorld` owns the world; setup returns its cleanup | `useCarRacing.ts`                                             |
| `GameView` steps the world after `onUpdate`          | `tick` only moves things; it never calls `world.update`       |
| `world.transforms` for per-frame moves               | player, traffic and recycled road tiles                       |
| `camera.follow` and `camera.shake`                   | chase camera, crash shake                                     |
| `scoreboard` handlers for rules, `listen` for the UI | lives running out ends the race; the HUD listens              |
| `effects.sparks`, `effects.confetti`                 | crashes, the win                                              |
| `audio.load`, looping voices, `haptics`              | engine sound, hits, points, results                           |
| `loadModel` for glTF cars, tinted per entity         | white paint, glass and trim parented to one root              |
| Procedural meshes built once (`merge`, `ellipsoid`)  | the roadside tree in `CarRacingMeshes.ts`                     |
| One component on both platforms                      | `react-native-web` and `.web.ts` files (`web/vite.config.ts`) |
| Assets per platform                                  | `require(...)` on React Native, URLs (`?url`) in the browser  |
| CSS colors in options                                | cars, sky, lane markings                                      |

## Attribution

Each example lists its sources in its `assets/ATTRIBUTION.md`. Car Racing is adapted from Playtura's games-library Car Racing; its car is Khronos' Car Concept glTF sample (CC BY 4.0), as converted for the Playtura engine example ([details](./shared/car-racing/assets/ATTRIBUTION.md)).
