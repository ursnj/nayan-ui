# Nayan Engine examples

Games built on `@nayan-ui/engine` for iOS, Android and the browser, copied from the Playtura games library so they play exactly as they do in Playtura and on nayanui.com/games. Each game is a React Native component taking `GameProps`, used unchanged by both apps: the Expo app renders it directly, the Vite app through `react-native-web`. Each app lists the games at `/` and opens one full screen at `/<id>` (`/car-racing`): the mobile app with Expo Router and a transparent native header (back, title, settings), like Playtura's game screen; the web app with React Router and a floating toolbar (back, settings) plus keyboard play, like nayanui.com/games.

```text
games/
├── shared/                      # the games, nothing else
│   ├── index.ts                 # CarRacing, GameProps, DEFAULT_GAME_SETTINGS, resolveGameTheme
│   ├── LICENSE                  # the games library's licence, which covers src/
│   └── src/                     # the games library's layout, keeping only what Car Racing uses
│       ├── games/car-racing/    # the game (its car loaded from glTF, see below)
│       ├── games/shared/        # engine game screen, HUD, loading, meshes, handling helpers
│       ├── helpers/             # settings modal and theme
│       ├── services/            # GameProps, themes, sounds and metadata (Car Racing's only)
│       └── assets/              # its sounds, textures, HUD font and car models
├── mobile/src/                  # Expo Router (React Native)
│   ├── app/
│   │   ├── _layout.tsx          # stack; the game route's header floats over the game
│   │   ├── index.tsx            # the list
│   │   └── [id].tsx             # a game full screen: settings, theme, offset below the header
│   ├── examples.ts              # the cards
│   └── theme.ts
└── web/src/                     # React Router (React DOM + Tailwind)
    ├── main.tsx                 # routes: / and /:id
    ├── Home.tsx                 # the list
    ├── ExamplePage.tsx          # a game full screen: toolbar, settings, keyboard input
    └── examples.ts              # the cards; each game downloads when first opened
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

## Add a game

1. Copy the game's folder from the games library (`packages/games/src/games/<id>/`) to `shared/src/games/<id>/`, with the `games/shared/` helpers and `assets/` files it imports that aren't here yet. Add its id to `GAME_IDS` and its entries to the per-game tables in `services/` (`GAMES_METADATA`, `getGameTitle`, `GAME_SOUNDS`, `SFX_SOURCES`) and `EngineLoading.ts` (its loading scene), and its cache revision to `ProceduralCacheVersion.ts`. Keep the paths, so its imports stay as they are.
2. Export its component from `shared/index.ts`.
3. Add a card to `mobile/src/examples.ts` and `web/src/examples.ts` (lazy on the web). Its route, `/<id>`, needs nothing else; the web app's keyboard mode is `drag` in `ExamplePage.tsx`, so pick the game's mode there (`drag`, `swipe` or `pointer`).

A game takes `GameProps`: the app passes `settings` (theme, sounds, haptics, the settings modal's visibility and `offset`, where the scoreboard starts below the header), `onSettingsChange` and `onPlayingChange`. Assets use Metro `require(...)`; on the web, `web/vite.config.ts` turns them into URLs, as the games library's own browser build does.

## Run

```bash
bun run web          # browser (WebGPU or WebGL2, HTTPS or localhost)
bun run web:build    # a static site: serve index.html for every path so /<id> deep links load
bun run ios          # or: bun run android (API 26+)
bun run mobile       # Metro for an installed development build
```

```bash
bun run typecheck
```

## Car Racing

Playtura's Car Racing: a procedural city with day and night, traffic to weave through, rear-end crashes and side swipes, lives, a 2 km track and the shared HUD, results and settings. Swipe to steer; in the browser, the arrow keys or A/D steer and Enter starts, stops or plays again. The theme follows the system and the settings modal's Dark Mode switch (night is the dark theme).

One change from Playtura: the car is loaded from glTF instead of built in code. `CarMeshes.ts` loads `assets/models/car/` (body, glass and trim, so each car still paints its own body), with the collision footprint measured from that body and the night lamps placed over its lights. The rest of the game is as in the games library. The shared code around it keeps only what Car Racing uses: the library's other games, their loading scenes, sounds, metadata and theme colours, and helpers no game here calls (the `useEngineGame` lifecycle hook, asset warm-up, theme overrides) are left out.

## Licence

`shared/src` is copied from the Playtura games library (`@nayan-ui/games`) and keeps its dual licence ([shared/LICENSE](./shared/LICENSE)): free for non-commercial use, with a paid licence for commercial use. Its textures and synthesised sound effects come from the same library; the HUD font is Inter. The car is Khronos' Car Concept glTF sample (CC BY 4.0, from a public-domain model by Unity Fan); see [its attribution](./shared/src/assets/models/car/ATTRIBUTION.md).
