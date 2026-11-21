# Nayan Engine examples

This workspace uses the local [Nayan engine](../engine). It includes 49 interactive examples shared by an Expo app and a Vite app, plus Car Racing as a complete game.

## Run the examples

From the repository root, install the engine and example workspaces. This filtered install works without the website's private games tarball.

```sh
bun install --frozen-lockfile --filter @nayan-ui/engine --filter @nayan-ui/example --filter '@nayan-example/*'
bun run engine:build
bun run --filter @nayan-ui/example web
```

The engine build needs the Rust WebAssembly target, the matching `wasm-bindgen-cli`, and a WebAssembly-capable C/C++ toolchain. See the [engine build prerequisites](../engine/README.md#development-and-verification).

For mobile, use the iOS or Android SDK and an Expo development build. The first build compiles the engine's native libraries. Open it on a supported simulator, emulator, or device from the repository root.

```sh
bun run --filter @nayan-ui/example ios
bun run --filter @nayan-ui/example android
```

Camera, microphone, location, screen capture, and haptics depend on platform permissions and hardware. Browser permission demos run on localhost or HTTPS. Permission prompts and share sheets open from their demo buttons.

## Find an example

Choose a concept from the gallery. Both apps use the same [catalog](shared/src/catalog.ts), and every [preview](shared/src/concepts/index.tsx) has a direct route such as `/concepts/physics`.

| Area | Source | Examples |
| --- | --- | --- |
| Game engine | [GameDemos.tsx](shared/src/concepts/GameDemos.tsx) | Initialization, entities, loop, physics, animation, input, model, texture and font assets, particles, scoring, procedural shapes and terrain, flat boards, renderer performance, and drawing |
| Components | [ComponentDemos.tsx](shared/src/concepts/ComponentDemos.tsx) | Theming, system bars, forms, keyboard handling, selection, feedback, presentation, lists, carousel, patterns, drawer, safe area, interop, images, icons, blur, Markdown, and view and shared-element animation |
| Local data | [ServiceDemos.tsx](shared/src/concepts/ServiceDemos.tsx) | Bundled assets, files, persistent storage, SQLite, and UUIDs |
| Device and media | [ServiceDemos.tsx](shared/src/concepts/ServiceDemos.tsx) | Network, permissions, location, device, audio, microphone, speech, haptics, video, camera, picking, screen capture, clipboard, sharing, wake lock, and store review |
| Styles | [styles.ts](shared/src/concepts/styles.ts) | Compile utility classes and inspect CSS and unsupported classes with `bun run --filter @nayan-ui/example styles` |

Run `bun run --filter @nayan-ui/example typecheck` for both app type checks and the styles example. Run `bun run --filter @nayan-ui/example web:build` for the static web build.

## Car Racing

The Expo and Vite hosts share the Car Racing scene, controls, models, and loading flow in `shared/`. The original car asset attribution is in [ATTRIBUTION.md](shared/src/assets/models/car/ATTRIBUTION.md). The animation example uses the engine's glTF triangle fixture, and the video example uses a bundled four-second test clip.

### Project layout

```text
example/
├── shared/                     # the demo catalog and Car Racing (used by both apps)
│   ├── index.ts                # what the apps import: CarRacing, GameProps, DEFAULT_GAME_SETTINGS
│   ├── LICENSE                 # licence for shared/src
│   └── src/
│       ├── catalog.ts          # routes and concept descriptions
│       ├── concepts/          # shared interactive previews
│       ├── games/car-racing/   # the Car Racing game
│       ├── games/shared/       # the game screen: scoreboard, buttons, loading screen, results
│       ├── helpers/            # the settings modal and themes
│       ├── services/           # GameProps, game ids, themes, sounds, titles
│       └── assets/             # car models, textures, sounds, font
├── mobile/src/                 # the Expo app (Expo Router)
│   ├── app/_layout.tsx         # the navigation stack
│   ├── app/index.tsx           # route /: the list of games
│   ├── app/[id].tsx            # route /car-racing: a game, full screen, under a transparent header
│   ├── app/concepts/[id].tsx    # the shared concept preview
│   └── theme.ts                # the app's colours
└── web/src/                    # the Vite app (React Router)
    ├── main.tsx                # the routes: / and /:id
    ├── Home.tsx                # route /: the list of games
    ├── GamePage.tsx            # route /car-racing: a game, full screen, with a floating toolbar
    └── ConceptPage.tsx          # the shared concept preview
```

## How it works

1. **The game is one component.** `CarRacing` takes `GameProps`: `settings`, `onSettingsChange` and `onPlayingChange`. It draws its own 3D scene, scoreboard, Start/Stop button, results and settings modal.
2. **Both apps share the catalog.** The Car Racing entry in `shared/src/catalog.ts` opens at `/car-racing`.
3. **Each app hosts the game full screen.**
   - Mobile (`app/[id].tsx`): a transparent header with a back arrow, the title and a settings button. `settings.offset` is the header's height, so the scoreboard starts below it. Swipe-back is off during a race.
   - Web (`GamePage.tsx`): the website's floating Back, Keyboard Controls and Settings toolbar. The scoreboard sits beside it on wide screens and below it on phones. Arrow keys or A/D steer, and Enter presses Start/Stop. Opening the keyboard guide pauses the race; dismiss it or press Escape to resume.
4. **Assets use `require(...)`.** Metro bundles them on mobile. On the web, the plugin in `web/vite.config.ts` turns each `require` into a URL.
5. **A loader prepares the game before it mounts.** `shared/index.ts` wraps `CarRacing` in `withGameLoading` (`games/shared/EngineGameLoader.tsx`), as the games library does. Behind the loading screen, `services/GameAssetLoader.ts` runs the game's `warmAssets()` jobs (`services/GameAssets.ts`), a few per frame within a 10 ms budget, right after each frame is drawn. No single long job freezes the loading animation, which matters most on Android's Hermes. Later visits in the same session skip it.
6. **Quality adapts to the game in play.** `EngineGameScreen` passes `qualityKey` (the game's id) and `adaptQuality={playing && !isOver}` to `GameView`. The engine's auto quality judges only real play, not the ready screen or results card, and later visits start at the level it settled on. In development, each second's stats are logged as `[engine] … fps, update … ms, publish … ms, render … ms, <quality>, <backend>, playing|idle, <game id>`.

## How Car Racing is built

All files are in `shared/src/games/car-racing/`.

| File                    | What it does                                                                                                    |
| ----------------------- | --------------------------------------------------------------------------------------------------------------- |
| `CarRacing.tsx`         | The screen. Loads the assets, starts a run, and passes the scene, scoreboard and buttons to `EngineGameScreen`. |
| `CarRacingConstants.ts` | Tuning (speed, lives, track length), colours and lights, `loadAssets()` and the loader's `warmAssets()` jobs.   |
| `CarRacingGame.ts`      | The rules, no React: steering, traffic, crashes, scoring, lives, the finish line and the camera.                |
| `CarRacingScene.ts`     | What it draws: the curving road, the cars, the city and the horizon.                                            |
| `CarRacingScenery.ts`   | Small roadside meshes: benches, bins, planters, shelters and signs.                                             |
| `CarRacingFacade.ts`    | Which building windows light up at night.                                                                       |
| `CarMeshes.ts`          | Loads the car from `assets/models/car/` (body, glass and trim), and builds the roadside tree.                   |

Engine features it uses: `World` and `GameView` (through `EngineGameScreen`), `loadModel` and `loadTexture`, procedural meshes (`merge`, `lathe`, `tube`, `block`, `ellipsoid`, `createShape`), the `scoreboard` (score, lives), `effects`, `audio` and `haptics`.

## Add a concept

1. Implement the preview in `shared/src/concepts/` with the engine's public feature imports.
2. Add an entry to the appropriate group in `shared/src/catalog.ts` and register the preview under the same ID in `shared/src/concepts/index.tsx`.
3. Run the type checks and open `/concepts/<id>` on both hosts. Dispose of any scene, media, or permission subscription the preview owns when it unmounts.

## Commands

Run these from `packages/example`.

| Command                           | What it does                                         |
| --------------------------------- | ---------------------------------------------------- |
| `bun run web`                     | Starts the web app at http://127.0.0.1:5173          |
| `bun run web:build`               | Builds the web app into `web/dist`                   |
| `bun run ios` / `bun run android` | Builds and runs the mobile app (a development build) |
| `bun run mobile`                  | Starts Metro for an installed development build      |
| `bun run prebuild`                | Regenerates `mobile/ios` and `mobile/android`        |
| `bun run typecheck`               | Type-checks both apps and the shared games           |

When you host the web build, serve `index.html` for every path so links like `/car-racing` and `/concepts/physics` open directly.

## Licence

- The copied Car Racing code and game assets come from the Playtura games library (`@nayan-ui/games`) and keeps its dual licence ([shared/LICENSE](./shared/LICENSE)): free for non-commercial use, paid for commercial use.
- The car is Khronos' Car Concept glTF sample, licensed CC BY 4.0 ([attribution](./shared/src/assets/models/car/ATTRIBUTION.md)).
- The textures and sounds come from the games library. The scoreboard font is Inter.
