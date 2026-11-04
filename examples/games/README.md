# Nayan Game Engine games example

A Bun workspace with one game, **Car Racing**, that runs on iOS, Android and the web from the same code. It is built on [`@nayan-ui/engine`](https://www.nayanui.com/game-engine).

- The game lives in `shared/`. It is a React Native component.
- `mobile/` is an Expo app. It renders the game with React Native.
- `web/` is a Vite app. It renders the same game through `react-native-web`.

Car Racing is copied from the Playtura games library, so it plays exactly as it does in Playtura and on [nayanui.com/games](https://www.nayanui.com/games/car-racing). The one change is the car: it is loaded from glTF files instead of built in code.

## Quick start

```bash
npx @nayan-ui/cli new my-game -t games   # create the project
cd my-game
bun install                              # install the apps and the engine from npm
bun run web                              # play in the browser
bun run ios                              # or: bun run android (needs a development build, not Expo Go)
```

## Project layout

```text
games/
├── shared/                     # the games (used by both apps)
│   ├── index.ts                # what the apps import: CarRacing, GameProps, DEFAULT_GAME_SETTINGS
│   ├── LICENSE                 # licence for shared/src
│   └── src/
│       ├── games/car-racing/   # the Car Racing game
│       ├── games/shared/       # the game screen: scoreboard, buttons, loading screen, results
│       ├── helpers/            # the settings modal and themes
│       ├── services/           # GameProps, game ids, themes, sounds, titles
│       └── assets/             # car models, textures, sounds, font
├── mobile/src/                 # the Expo app (Expo Router)
│   ├── app/_layout.tsx         # the navigation stack
│   ├── app/index.tsx           # route /: the list of games
│   ├── app/[id].tsx            # route /car-racing: a game, full screen, under a transparent header
│   ├── examples.ts             # the list of games
│   └── theme.ts                # the app's colours
└── web/src/                    # the Vite app (React Router)
    ├── main.tsx                # the routes: / and /:id
    ├── Home.tsx                # route /: the list of games
    ├── GamePage.tsx            # route /car-racing: a game, full screen, with a floating toolbar
    └── examples.ts             # the list of games
```

## How it works

1. **The game is one component.** `CarRacing` takes `GameProps`: `settings`, `onSettingsChange` and `onPlayingChange`. It draws its own 3D scene, scoreboard, Start/Stop button, results and settings modal.
2. **Each app lists its games.** `examples.ts` holds `{ id, title, description, Screen }` for each game. The list screen shows them, and each opens at `/<id>`.
3. **Each app hosts the game full screen.**
   - Mobile (`app/[id].tsx`): a transparent header with a back arrow, the title and a settings button. `settings.offset` is the header's height, so the scoreboard starts below it. Swipe-back is off during a race.
   - Web (`GamePage.tsx`): the website's floating Back, Keyboard Controls and Settings toolbar. The scoreboard sits beside it on wide screens and below it on phones. Arrow keys or A/D steer, and Enter presses Start/Stop. Opening the keyboard guide pauses the race; dismiss it or press Escape to resume.
4. **Assets use `require(...)`.** Metro bundles them on mobile. On the web, the plugin in `web/vite.config.ts` turns each `require` into a URL.

## How Car Racing is built

All files are in `shared/src/games/car-racing/`.

| File                    | What it does                                                                                                    |
| ----------------------- | --------------------------------------------------------------------------------------------------------------- |
| `CarRacing.tsx`         | The screen. Loads the assets, starts a run, and passes the scene, scoreboard and buttons to `EngineGameScreen`. |
| `CarRacingConstants.ts` | Tuning (speed, lives, track length), colours and lights, and `loadAssets()`.                                    |
| `CarRacingGame.ts`      | The rules, no React: steering, traffic, crashes, scoring, lives, the finish line and the camera.                |
| `CarRacingScene.ts`     | What it draws: the curving road, the cars, the city and the horizon.                                            |
| `CarRacingScenery.ts`   | Small roadside meshes: benches, bins, planters, shelters and signs.                                             |
| `CarRacingFacade.ts`    | Which building windows light up at night.                                                                       |
| `CarMeshes.ts`          | Loads the car from `assets/models/car/` (body, glass and trim), and builds the roadside tree.                   |

Engine features it uses: `World` and `GameView` (through `EngineGameScreen`), `loadModel` and `loadTexture`, procedural meshes (`merge`, `lathe`, `tube`, `block`, `ellipsoid`, `createShape`), the `scoreboard` (score, lives), `effects`, `audio` and `haptics`.

## Add a game

1. Copy the game's folder from the games library (`packages/games/src/games/<id>/`) to `shared/src/games/<id>/`. Also copy any `games/shared/` helpers and `assets/` files it imports that are not here yet. Keep the paths the same so its imports still work.
2. Add the game to the per-game tables:
   - `GAME_IDS` in `services/UtilsService.ts`
   - `GAMES_METADATA` in `services/GamesMetadata.ts`
   - `getGameTitle` in `services/GamesConstants.ts`
   - its sounds in `services/SoundsService.ts` and `services/SfxSources.ts`
   - its loading scene in `games/shared/EngineLoading.ts`
   - its cache revision in `games/shared/ProceduralCacheVersion.ts`
3. Export the game from `shared/index.ts`.
4. Add it to `mobile/src/examples.ts` and `web/src/examples.ts`.
5. On the web, set its keyboard `mode` in `GamePage.tsx`: `drag` for steering games, `swipe` for grid games, `pointer` for everything else.

## Commands

| Command                           | What it does                                         |
| --------------------------------- | ---------------------------------------------------- |
| `bun run web`                     | Starts the web app at http://127.0.0.1:5173          |
| `bun run web:build`               | Builds the web app into `web/dist`                   |
| `bun run ios` / `bun run android` | Builds and runs the mobile app (a development build) |
| `bun run mobile`                  | Starts Metro for an installed development build      |
| `bun run prebuild`                | Regenerates `mobile/ios` and `mobile/android`        |
| `bun run typecheck`               | Type-checks both apps and the shared games           |

When you host the web build, serve `index.html` for every path so links like `/car-racing` open directly.

## Licence

- `shared/src` is copied from the Playtura games library (`@nayan-ui/games`) and keeps its dual licence ([shared/LICENSE](./shared/LICENSE)): free for non-commercial use, paid for commercial use.
- The car is Khronos' Car Concept glTF sample, licensed CC BY 4.0 ([attribution](./shared/src/assets/models/car/ATTRIBUTION.md)).
- The textures and sounds come from the games library. The scoreboard font is Inter.
