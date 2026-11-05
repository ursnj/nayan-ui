import type { EngineGuide } from "./types";

export const PracticalGuides: EngineGuide[] = [
  {
    slug: "first-game",
    title: "Build your first game",
    description:
      "Start from the games example in the Nayan UI repo and see how its Car Racing is built.",
    sections: [
      {
        id: "start-from-the-example",
        title: "Start from the example",
        paragraphs: [
          "The Nayan UI repo has a ready-made games project: examples/games. It holds one complete game, Car Racing, that runs on iOS, Android and the web from the same code. The CLI copies it for you.",
          "It is the same Car Racing as in Playtura and on nayanui.com/games. The only change is the car, which is loaded from glTF files instead of built in code.",
        ],
        examples: [
          {
            title: "Create and run it",
            platform: "shell",
            language: "bash",
            code: `npx @nayan-ui/cli new my-game -t games   # copy examples/games into ./my-game
cd my-game                               # go into the project
bun install                              # install the apps and @nayan-ui/engine from npm
bun run web                              # play in the browser at http://127.0.0.1:5173
bun run ios                              # or: bun run android (a development build, not Expo Go)`,
          },
        ],
        note: "Source: github.com/ursnj/nayan-ui/tree/main/examples/games. Its README has the same walkthrough.",
      },
      {
        id: "project-layout",
        title: "What is in the project",
        paragraphs: [
          "Three parts. shared/ holds the game, written once in React Native. mobile/ is an Expo app that renders it. web/ is a Vite app that renders the same component through react-native-web.",
        ],
        examples: [
          {
            title: "Project layout",
            platform: "shared",
            language: "text",
            code: `my-game/
├── shared/                     # the game, used by both apps
│   ├── index.ts                # exports CarRacing, GameProps, DEFAULT_GAME_SETTINGS
│   └── src/
│       ├── games/car-racing/   # the Car Racing game
│       ├── games/shared/       # the game screen: scoreboard, buttons, loading, results
│       ├── helpers/            # the settings modal and themes
│       ├── services/           # GameProps, game ids, themes, sounds
│       └── assets/             # car models, textures, sounds, font
├── mobile/src/                 # Expo app (Expo Router)
│   ├── app/index.tsx           # route /: the list of games
│   ├── app/[id].tsx            # route /car-racing: the game, full screen
│   └── examples.ts             # the list of games
└── web/src/                    # Vite app (React Router)
    ├── Home.tsx                # route /: the list of games
    ├── GamePage.tsx            # route /car-racing: the game, full screen
    └── examples.ts             # the list of games`,
          },
        ],
      },
      {
        id: "how-car-racing-is-built",
        title: "How Car Racing is built",
        paragraphs: [
          "Car Racing is seven files in shared/src/games/car-racing. The rules have no React, the scene only draws, and the screen connects them to the shared game screen.",
        ],
        table: {
          headers: ["File", "What it does"],
          rows: [
            [
              "CarRacing.tsx",
              "The screen: loads the assets, starts a run and passes the scene, scoreboard and buttons to EngineGameScreen.",
            ],
            [
              "CarRacingConstants.ts",
              "Tuning (speed, lives, track length), colours, lights and loadAssets().",
            ],
            [
              "CarRacingGame.ts",
              "The rules: steering, traffic, crashes, scoring, lives, the finish line and the camera.",
            ],
            [
              "CarRacingScene.ts",
              "What it draws: the curving road, the cars, the city and the horizon.",
            ],
            [
              "CarRacingScenery.ts",
              "Small roadside meshes: benches, bins, planters, shelters and signs.",
            ],
            ["CarRacingFacade.ts", "Which building windows light up at night."],
            ["CarMeshes.ts", "Loads the car's glTF models and builds the roadside tree."],
          ],
        },
        examples: [
          {
            title: "shared/index.ts",
            description: "What both apps import from the shared package.",
            platform: "shared",
            language: "typescript",
            code: `// The game: a component that takes GameProps.
export { CarRacing } from "./src/games/car-racing/CarRacing";
// Its props and default settings.
export { DEFAULT_GAME_SETTINGS, type GameProps, type GameSettings } from "./src/services/UtilsService";
// Theme colours, so an app can paint its header to match.
export { resolveGameTheme } from "./src/services/ThemeService";`,
          },
        ],
        note: "Engine features used: World and GameView, loadModel, loadTexture, procedural meshes (merge, lathe, tube, block, ellipsoid), the scoreboard, effects, audio and haptics.",
      },
      {
        id: "load-the-car",
        title: "1. Load the car",
        paragraphs: [
          "The car is three glTF models: a white body that each car paints its own colour, the glass, and the trim. They load once per app, on native background threads, and every car reuses them.",
        ],
        examples: [
          {
            title: "shared/src/games/car-racing/CarMeshes.ts",
            platform: "shared",
            language: "typescript",
            code: `let car: Promise<CarMeshes> | undefined; // Loaded once, then shared by every run.

export function loadCarMeshes(): Promise<CarMeshes> {
  car ??= Promise.all([ // Start loading only on the first call.
    // White paint: each car tints it.
    loadModel(require("../../assets/models/car/car_body.glb"), { center: false, shine: 0.85 }),
    // Windows, glossier.
    loadModel(require("../../assets/models/car/car_glass.glb"), { center: false, shine: 0.95 }),
    // Tyres, lights, mirrors in their own colours.
    loadModel(require("../../assets/models/car/car_trim.glb"), { center: false, shine: 0.25 }),
  ]).then(([body, glass, trim]) => ({ body, glass, trim })); // One object with the three models.
  car.catch(() => (car = undefined)); // If loading fails, try again next time.
  return car; // Every caller gets the same promise.
}`,
          },
        ],
      },
      {
        id: "spawn-a-car",
        title: "2. Put cars on the road",
        paragraphs: [
          "Each car is an invisible root entity with the three models attached. The game moves only the root; the body takes the car's colour.",
        ],
        examples: [
          {
            title: "shared/src/games/car-racing/CarRacingScene.ts",
            platform: "shared",
            language: "typescript",
            code: `export function spawnCar(world: World, a: Assets, paint: Color, position: Vec3, night: boolean) {
  const model = a.car; // The loaded body, glass and trim.
  const root = world.spawn({ mesh: "none", position }); // An invisible root: the game moves this.
  // The models sit with their wheels on the ground.
  const offset: Vec3 = [0, -model.size[1] / 2, 0];
  // The paint, in this car's colour.
  const body = world.spawn({ mesh: model.body, parent: root, position: offset, color: paint });
  const glass = world.spawn({ mesh: model.glass, parent: root, position: offset }); // The windows.
  // Tyres, lights and the rest.
  const trim = world.spawn({ mesh: model.trim, parent: root, position: offset });
  // Everything the game needs to move or restyle it.
  const car = { root, body, glass, trim, lights: [] as Entity[] };
  // At night, glowing headlights and a tail-light bar.
  setCarNight(world, car, night, model.size[1]);
  return car;
}`,
          },
        ],
      },
      {
        id: "the-screen",
        title: "3. The screen",
        paragraphs: [
          "CarRacing.tsx hands the run to EngineGameScreen, the shared game screen. It renders the GameView, the scoreboard, the Start/Stop button, the results card and the settings modal, so the game itself only supplies the scene and its numbers.",
        ],
        examples: [
          {
            title: "shared/src/games/car-racing/CarRacing.tsx (part)",
            platform: "shared",
            language: "typescript",
            code: `<EngineGameScreen
  gameId={GAME_IDS.CAR_RACING} // Picks the game's title, loading scene and sounds.
  settings={settings} // Sounds, haptics, theme and where the scoreboard starts (from the app).
  onSettingsChange={onSettingsChange} // The settings modal saves its changes here.
  source={game.world} // The engine world this run draws.
  camera={game.camera} // The chase camera behind the player's car.
  light={night ? NIGHT_LIGHT : DAY_LIGHT} // Day or night lighting.
  background={night ? NIGHT_SKY : SKY} // The sky colour.
  onUpdate={onUpdate} // Runs the rules every frame (tick).
  onDrag={onDrag} // Dragging steers the car.
  // The scoreboard.
  columns={[scoreColumn(score), livesColumn(lives, LIVES), textColumn("TRACK", \`\${left} m\`)]}
  playing={phase === "playing"} // Shows Start or Stop.
  onStart={handleStartGame} // Start pressed.
  onStop={handleStopGame} // Stop pressed: report a cancel and start a fresh run.
  // The results card.
  gameOver={
    showResults // After the crash or the finish has been seen:
      ? { title: won ? "FINISHED!" : "CRASHED!", score, buttonText: "Race Again!", onPlayAgain: handleResetGame }
      : null // No results card during the race.
  }
/>`,
          },
        ],
      },
      {
        id: "host-on-mobile",
        title: "4. Show it on mobile",
        paragraphs: [
          "The Expo app opens each game at /<id> with Expo Router. The header floats over the game, and settings.offset tells the game to start its scoreboard below it.",
        ],
        examples: [
          {
            title: "mobile/src/app/[id].tsx (part)",
            platform: "native",
            language: "typescript",
            code: `const { id } = useLocalSearchParams<{ id: string }>(); // The route's id: "car-racing".
const example = findExample(id); // The game for that id, from examples.ts.
const headerHeight = useHeaderHeight(); // The header's height, status bar included.
// What the game reads.
const [settings, setSettings] = useState<GameSettings>({ ...DEFAULT_GAME_SETTINGS, theme: deviceTheme });

return (
  <example.Screen
    settings={{ ...settings, offset: headerHeight }} // The scoreboard starts below the header.
    onSettingsChange={setSettings} // The settings modal saves its changes here.
    // No swipe-back mid-race.
    onPlayingChange={(playing) => navigation.setOptions({ gestureEnabled: !playing })}
  />
);`,
          },
        ],
      },
      {
        id: "host-on-the-web",
        title: "5. Show it on the web",
        paragraphs: [
          "The Vite app opens each game at /<id> with React Router. react-native-web renders the game's React Native code, and createKeyboardInput turns keys into the same gestures as touch.",
        ],
        examples: [
          {
            title: "web/src/GamePage.tsx (part)",
            platform: "react",
            language: "typescript",
            code: `const example = findExample(useParams().id); // The game for this route's id.
// Scoreboard below the toolbar.
const [settings, setSettings] = useState<GameSettings>({ ...DEFAULT_GAME_SETTINGS, offset: 70 });

useEffect(() => {
  // Arrow keys and A/D drag, so they steer.
  const keyboard = createKeyboardInput(surface.current!, { mode: "drag" });
  return () => keyboard.dispose(); // Stop listening when the page closes.
}, []);

return (
  <div ref={surface} tabIndex={0}> {/* The game draws here; tabIndex lets it take the keys. */}
    <Suspense fallback={<p>Loading…</p>}> {/* Shown while the game's code downloads. */}
      {/* The same component as on mobile. */}
      <example.Screen settings={settings} onSettingsChange={setSettings} />
    </Suspense>
  </div>
);`,
          },
          {
            title: "web/vite.config.ts (part)",
            description: "The browser build's two changes to the shared React Native code.",
            platform: "react",
            language: "typescript",
            code: `resolve: {
  // React Native components render as HTML.
  alias: [{ find: /^react-native$/, replacement: "react-native-web" }],
  // A file's .web.ts version wins in the browser.
  extensions: [".web.tsx", ".web.ts", ".tsx", ".ts", ".js"],
},
// Plus a small plugin: require("./engine.wav") becomes a URL that Vite copies into the build.`,
          },
        ],
      },
      {
        id: "add-your-game",
        title: "Add your own game",
        paragraphs: [
          "Put the game in shared/ and list it in both apps. Each app then gives it a route at /<id> with no other changes.",
        ],
        examples: [
          {
            title: "Steps",
            platform: "shared",
            language: "text",
            code: `1. Write the game in shared/src/games/<id>/ (copy car-racing as a starting point).
2. Add its id to GAME_IDS in shared/src/services/UtilsService.ts.
3. Add its title and instructions to GAMES_METADATA in shared/src/services/GamesMetadata.ts.
4. Export its component from shared/index.ts.
5. Add { id, title, description, Screen } to mobile/src/examples.ts and web/src/examples.ts.
6. Run bun run typecheck, then bun run web and bun run ios.`,
          },
        ],
      },
      {
        id: "try-it",
        title: "Try it",
        paragraphs: ["Each line is one expected result."],
        examples: [
          {
            title: "Checklist",
            platform: "shared",
            language: "text",
            code: `[ ] The list shows Car Racing; opening it shows the loading scene, then the race
[ ] Start: the car drives; drag (or arrow keys / A D) to steer
[ ] Pass a car: the score goes up
[ ] Hit a car from behind: one heart is lost; side swipes only slow you down
[ ] Settings: Dark Mode switches to the night city with lit windows and headlights
[ ] Finish the 2000 m track, or lose all lives: the results card shows; Race Again starts over
[ ] Back (header arrow, toolbar button or browser back): returns to the list`,
          },
        ],
      },
    ],
  },
  {
    slug: "recipes",
    title: "Common game recipes",
    description: "Short, copyable solutions for everyday game tasks.",
    sections: [
      {
        id: "move-without-react-state",
        title: "Move without React state",
        paragraphs: [
          "Queue per-frame moves on world.transforms from onUpdate; they apply in one native call when GameView steps the world. Each recipe returning a function is meant to be called from onUpdate.",
        ],
        examples: [
          {
            title: "Slide a box",
            code: `import type { World } from "@nayan-ui/engine";

export function addSlider(world: World) {
  const box = world.spawn({ mesh: "cube", position: [-4, 1, 0], color: "#33B3FF" });
  let x = -4;
  return (dt: number) => {
    x = x > 4 ? -4 : x + 2 * dt; // 2 units per second
    world.transforms.position(box, x, 1, 0);
  };
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "fall-and-bounce",
        title: "Fall and bounce",
        paragraphs: ["A fixed floor and a dynamic ball: physics handles gravity and the bounce."],
        examples: [
          {
            title: "Bouncing ball",
            code: `import { GameView, useWorld } from "@nayan-ui/engine";

export function Bounce() {
  const world = useWorld(16, (w) => {
    w.spawn({ mesh: "plane", scale: [20, 1, 20], color: "#4C9A4C", physics: "fixed" });
    w.spawn({ mesh: "sphere", position: [0, 5, 0], color: "#FF801A", physics: { type: "dynamic", bounce: 0.7 } });
  });
  return world && <GameView source={world} camera={{ eye: [0, 4, 8], target: [0, 0, 0], fov: 1 }} style={{ flex: 1 }} />;
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "joystick-steering",
        title: "Steer with a joystick",
        paragraphs: [
          "useJoystick returns a mutable state: read it in onUpdate, never mirror it into React state. groundVelocity sets X/Z speed and keeps gravity.",
        ],
        examples: [
          {
            title: "Joystick player",
            code: `import { GameView, Joystick, useJoystick, type Entity, type World } from "@nayan-ui/engine";

export function Steer({ world, player }: { world: World; player: Entity }) {
  const stick = useJoystick();
  return (
    <>
      <GameView source={world} style={{ flex: 1 }}
        onUpdate={() => world.set(player, { groundVelocity: [stick.x * 5, -stick.y * 5] })} />
      <Joystick state={stick} />
    </>
  );
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "grounded-jump",
        title: "Jump only when grounded",
        paragraphs: [
          "Cast a short ray down against the floor's layer and skip the jump while already rising.",
        ],
        examples: [
          {
            title: "Grounded jump",
            code: `import type { Entity, World } from "@nayan-ui/engine";

const at: [number, number, number] = [0, 0, 0];
const vel: [number, number, number] = [0, 0, 0];

// Player: a 1.8-unit capsule; floor on layer 1.
export function jump(world: World, player: Entity) {
  if (!world.position(player, at) || !world.velocity(player, vel) || vel[1] > 0.1) return false;
  if (!world.raycast(at, [0, -1, 0], 1.05, 1)) return false;
  world.impulse(player, [0, 5, 0]);
  return true;
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "sensor-pickup",
        title: "Pick up on contact",
        paragraphs: [
          "A sensor reports contact without pushing. forEachCollision in onUpdate reads the last step's contacts, each once.",
        ],
        examples: [
          {
            title: "Coin pickup",
            code: `import type { Entity, World } from "@nayan-ui/engine";

export function addCoin(world: World, player: Entity) {
  const coin = world.spawn({ mesh: "cylinder", position: [3, 1, 0], scale: [0.6, 0.1, 0.6],
    color: "#FFCC1A", spin: [0, 2, 0], physics: { type: "fixed", sensor: true } });
  return () =>
    world.forEachCollision((a, b, { started }) => {
      if (started && ((a === coin && b === player) || (a === player && b === coin))) {
        world.despawn(coin);
        world.scoreboard.add(100);
      }
    });
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "tap-to-recolor",
        title: "Tap to recolor",
        paragraphs: ["world.pick finds the entity under a tap; no physics body needed."],
        examples: [
          {
            title: "Tap to paint",
            code: `import { GameView, type World } from "@nayan-ui/engine";

export function TapToPaint({ world }: { world: World }) {
  return (
    <GameView source={world} style={{ flex: 1 }}
      onTap={(x, y) => {
        const hit = world.pick(x, y);
        if (hit) world.set(hit.entity, { color: "#FF4D66" });
      }} />
  );
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "chase",
        title: "Chase the player",
        paragraphs: [
          "Set follow once and the engine steers the chaser along the ground; follow: null stops it.",
        ],
        examples: [
          {
            title: "Chaser",
            code: `import type { Entity, World } from "@nayan-ui/engine";

export function addChaser(world: World, player: Entity) {
  const enemy = world.spawn({ mesh: "sphere", position: [5, 1, 5], color: "red", follow: { target: player, speed: 2 } });
  return () => world.set(enemy, { follow: null }); // stop chasing
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "pop-and-remove",
        title: "Pop and remove",
        paragraphs: [
          "effects.pop swells, flashes and shrinks a piece away; despawn when it resolves. No disposal guard is needed: despawn is a no-op on a disposed world.",
        ],
        examples: [
          {
            title: "Clear a piece",
            code: `import { effects, type Entity, type World } from "@nayan-ui/engine";

export async function clearPiece(world: World, piece: Entity) {
  await effects.pop(world, piece, { scale: 1, color: "#FF4D4D" });
  world.despawn(piece);
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "score-in-react-ui",
        title: "Show the score in React",
        paragraphs: [
          "scoreboard.listen adds a UI observer beside the game's handlers and returns its unlisten, so it fits a useEffect. It fires only when the value changes.",
        ],
        examples: [
          {
            title: "useScore",
            code: `import { useEffect, useState } from "react";
import type { World } from "@nayan-ui/engine";

export function useScore(world: World) {
  const [score, setScore] = useState(world.scoreboard.score);
  useEffect(() => world.scoreboard.listen({ onScore: setScore }), [world]);
  return score;
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "game-time-delay",
        title: "Delay in game time",
        paragraphs: [
          "world.after counts game time, so it pauses with the game. Call cancelTimers on reset so an old round can't act in the new one.",
        ],
        examples: [
          {
            title: "Delayed bonus",
            code: `import type { World } from "@nayan-ui/engine";

export function scheduleBonus(world: World) {
  const id = world.after(3, () => world.spawn({ mesh: "torus", position: [0, 2, 0], color: "#FFCC1A" }));
  return () => world.cancelTimer(id);
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "build-model-once",
        title: "Build a model once, spawn it many times",
        paragraphs: [
          "Mesh ids are never freed: build each model once per app (after warm-up, e.g. in useWorld's setup) and reuse it.",
        ],
        examples: [
          {
            title: "Reusable star",
            code: `import { createShape, extrude, Path, type Model, type World } from "@nayan-ui/engine";

let star: Model | undefined;
const starMesh = () => (star ??= createShape(extrude(new Path().addStar(0, 0, 0.5, 0.22, 5), { depth: 0.15 }), { shine: 0.4 }));

export function addStars(world: World) {
  for (let i = 0; i < 5; i++) world.spawn({ mesh: starMesh(), position: [i - 2, 1, 0], color: "#FFCC33" });
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "sound-on-action",
        title: "Sound and haptics on an action",
        paragraphs: [
          "Load the bank once, outside the frame loop (a URL on the web, require(...) on native). Mirror the player's settings onto audio.enabled and haptics.enabled, then play freely.",
        ],
        examples: [
          {
            title: "Pickup feedback",
            code: `import { audio, haptics } from "@nayan-ui/engine";

const sfx = audio.load({ pickup: "/sounds/pickup.wav" }); // native: require("./pickup.wav")

export function applySettings(sounds: boolean, vibration: boolean) {
  audio.enabled = sounds;
  haptics.enabled = vibration;
}
export function onPickup() {
  sfx.play("pickup", { volume: 0.7 });
  haptics.selection();
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "confetti-win",
        title: "Confetti on a win",
        paragraphs: [
          "One call that cleans itself up. Leave room in the world's capacity for the particles (about count).",
        ],
        examples: [
          {
            title: "Confetti",
            code: `import { effects, type World } from "@nayan-ui/engine";

export function celebrate(world: World) {
  effects.confetti(world, { position: [0, 3, 0], colors: ["#FF4D4D", "#FFD933", "#4DB3FF"],
    size: 0.12, speed: 6, count: 40, lifetime: 1.4, gravity: -6 });
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "face-movement",
        title: "Face the movement direction",
        paragraphs: [
          "quat.y builds the heading and quat.slerp eases toward it, both into reused arrays. For a dynamic body, rotate a visual child (parent: player) so physics keeps the body.",
        ],
        examples: [
          {
            title: "Turn toward the stick",
            code: `import { quat, type Entity, type JoystickState, type MutableQuat, type World } from "@nayan-ui/engine";

export function makeFacing(world: World, model: Entity, stick: JoystickState) {
  const facing: MutableQuat = [0, 0, 0, 1];
  const goal: MutableQuat = [0, 0, 0, 1];
  return (dt: number) => {
    if (stick.x || stick.y) quat.y(Math.atan2(stick.x, -stick.y), goal); // front faces +z
    quat.slerp(facing, goal, Math.min(1, dt * 12), facing);
    world.transforms.rotation(model, facing[0], facing[1], facing[2], facing[3]);
  };
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
    ],
  },
  {
    slug: "agent-guide",
    title: "Engine guide for AI agents",
    description: "Rules, file layout, API choices and a template for coding agents.",
    sections: [
      {
        id: "read-first",
        title: "Read first",
        paragraphs: [
          "Start from /engine.json and the first game; check every name in the API reference. Never guess names from another engine.",
        ],
        table: {
          headers: ["Need", "Page"],
          rows: [
            ["Machine summary", "/engine.json"],
            ["Working baseline", "/game-engine/first-game"],
            ["One feature", "/game-engine/recipes"],
            ["Lifecycle and entities", "/game-engine/world-entities"],
            ["Exact signatures", "/game-engine/api-reference"],
            ["Blank screen, build errors", "/game-engine/troubleshooting"],
          ],
        },
        examples: [
          {
            title: "Fetch the summary",
            code: `curl -s https://www.nayanui.com/engine.json`,
            platform: "shell",
            language: "bash",
          },
        ],
      },
      {
        id: "file-structure",
        title: "File structure",
        paragraphs: [
          "Rules live in plain TypeScript with no UI imports, so one file serves web and native. The hook owns the world; the screen owns layout and GameView.",
        ],
        table: {
          headers: ["File", "Contains", "Never"],
          rows: [
            [
              "gameConstants.ts",
              "Tuning, colors, asset sources, loadAssets()",
              "Worlds or entities",
            ],
            [
              "game.ts",
              "createGame(world, …): rules and round actions",
              "React, DOM, react-native",
            ],
            ["useGame.ts", "useWorld + createGame", "Rules or per-frame state"],
            ["GameScreen.tsx / GamePage.tsx", "HUD, buttons, GameView", "Its own frame loop"],
          ],
        },
        examples: [
          {
            title: "Layout",
            code: `src/game/
  gameConstants.ts
  game.ts
  useGame.ts
  GameScreen.tsx   # React Native (GamePage.tsx on the web)`,
            platform: "shared",
            language: "text",
          },
        ],
      },
      {
        id: "one-api-per-task",
        title: "One API per task",
        paragraphs: ["Each task has one way. Use it."],
        table: {
          headers: ["Task", "Use"],
          rows: [
            ["Own a world", "useWorld(capacity, setup)"],
            ["Game loop", "GameView onUpdate(dt); the world is stepped right after"],
            ["Spawn / change / remove", "world.spawn → Entity; world.set; world.despawn"],
            ["Per-frame moves", "world.transforms.position / rotation / scale / color / transform"],
            ["Rotations", "quat.y / x / z / fromEuler / multiply / slerp, with out"],
            ["Per-frame queries", "world.position(e, out), raycast(…, out), toScreen(p, out)"],
            ["Physics", "physics option, groundVelocity, world.impulse"],
            ["Collisions", "world.forEachCollision in onUpdate"],
            ["Tap / drag", "onTap + world.pick; onDrag + world.screenToWorld"],
            ["Tweens", "await world.animate(e, target, options)"],
            [
              "Effects",
              "effects.confetti / sparkle / shatter / splash / sparks / explosion / dust / flash",
            ],
            ["Clear a piece", "await effects.pop(world, e, { scale }); world.despawn(e)"],
            [
              "Score, lives, clock",
              "scoreboard.reset(lives, seconds), resume(), add(); handlers = rules, listen = UI",
            ],
            ["Delays", "world.after(s, fn); cancelTimer(id); cancelTimers() on reset"],
            ["Colors", "'#33B3FF' or 0..1 tuples; toColor for numbers"],
            ["Flat boards", "light={frontLight(direction, ambient)}"],
            ["Long setup", "afterNextFrame(fn) slices; ProceduralCache.peek(key)"],
            ["Characters", "loadModel(src).animations; world.playClip / stopClip"],
            ["Settings", "audio.enabled, haptics.enabled"],
            ["Painting", "DrawingDocument + DrawingCanvas"],
            ["No native module", "isEngineAvailable"],
          ],
        },
        examples: [
          {
            title: "The whole loop",
            code: `import { useRef } from "react";
import { GameView, useWorld, type Entity } from "@nayan-ui/engine";

export function Slider() {
  const box = useRef<Entity | null>(null);
  const time = useRef(0);
  const world = useWorld(16, (w) => {
    box.current = w.spawn({ mesh: "roundedBox", position: [0, 1, 0], color: "#33B3FF" });
  });
  if (!world) return null;
  return (
    <GameView source={world} camera={{ eye: [0, 3, 6], target: [0, 1, 0], fov: 1 }} style={{ flex: 1 }}
      onUpdate={(dt) => {
        time.current += dt;
        if (box.current) world.transforms.position(box.current, Math.sin(time.current) * 2, 1, 0);
      }}
      onTap={(x, y) => { if (world.pick(x, y)) world.scoreboard.add(1); }} />
  );
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "never-do",
        title: "Never do",
        paragraphs: ["Each row is a real bug. Check finished code against all of them."],
        table: {
          headers: ["Never", "Instead"],
          rows: [
            ["new World in render, useMemo or module scope", "useWorld(capacity, setup)"],
            ["onUpdate={(dt) => world.update(dt)}", "Nothing: GameView steps the world"],
            ["requestAnimationFrame / setInterval loops", "GameView onUpdate"],
            ["setTimeout for gameplay delays", "world.after"],
            ["Per-frame positions in React state", "world.transforms; push only HUD values"],
            ["Read a position right after queuing a move", "world.transforms.flush() first"],
            ["Allocate arrays per frame", "out arguments, quat(…, out)"],
            ["Hand-written quaternions", "quat"],
            ["Hand-built particle layers", "effects.*"],
            ["Replace scoreboard.handlers for UI", "scoreboard.listen"],
            ["A custom disposed flag", "world.isDisposed"],
            ["spawn / effects after dispose", "Check world.isDisposed after an await"],
            ["Meshes per spawn or per frame", "Build once, reuse (ids are never freed)"],
            ["Culling scenery in JS", "Nothing: Rust culls every frame"],
            ["Drawing still scenery live every frame", "still: true or world.backdropLayer"],
            [
              "Moving the camera every frame over a still backdrop",
              "Hold it still until play needs it to move",
            ],
            ["A long job in one frame", "Slice it with afterNextFrame"],
            ["Reporting a result twice", "Guard finish() with the status"],
            ["Unsupported color names ('pink')", "Hex or rgba strings"],
            ["Testing native in Expo Go", "A development build"],
          ],
        },
        examples: [
          {
            title: "Wrong and right frame",
            code: `import { quat, type Entity, type MutableQuat, type World } from "@nayan-ui/engine";

// Wrong: allocates and steps the world a second time.
export function wrong(world: World, piece: Entity, angle: number, dt: number) {
  world.set(piece, { rotation: quat.y(angle) });
  world.update(dt);
}

// Right: reused scratch, one queued move; GameView steps once after.
const turn: MutableQuat = [0, 0, 0, 1];
export function right(world: World, piece: Entity, angle: number) {
  quat.y(angle, turn);
  world.transforms.rotation(piece, turn[0], turn[1], turn[2], turn[3]);
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "game-template",
        title: "Game template",
        paragraphs: [
          "Copy and replace the rules. It covers a ready screen, start, per-frame moves, taps, lives, pop, confetti, one result per run, replay and cancel on unmount.",
        ],
        examples: [
          {
            title: "game.ts",
            code: `import { effects, quat, type Camera, type Entity, type MutableQuat, type World } from "@nayan-ui/engine";

export type Status = "ready" | "playing" | "win" | "lose" | "cancel";
export interface Hud { status: Status; score: number; seconds: number; lives: number }
export interface Result { status: "win" | "lose" | "cancel"; score: number }

const SECONDS = 30;
const LIVES = 3;
const BLUE = "#4DB3FF";
export const camera: Camera = { eye: [0, 8, 10], target: [0, 0, 0], fov: 0.9 };

export function createGame(world: World, onHud: (hud: Hud) => void, onEnd: (result: Result) => void) {
  const board = world.scoreboard;
  const pieces = new Set<Entity>();
  const turn: MutableQuat = [0, 0, 0, 1]; // Per-frame scratch.
  let status: Status = "ready";
  let time = 0;
  const hud = () => onHud({ status, score: board.score, seconds: board.shownSeconds, lives: board.lives });

  function finish(result: Result["status"]) {
    if (status !== "playing") return; // One result per run.
    status = result;
    board.stop();
    world.cancelTimers();
    if (result === "win") effects.confetti(world, { position: [0, 3, 0], colors: ["#FF4D4D", "#FFD933"],
      size: 0.12, speed: 6, count: 40, lifetime: 1.2, gravity: -6 });
    hud();
    onEnd({ status: result, score: board.score });
  }
  function reset() {
    world.cancelTimers();
    for (const piece of pieces) world.despawn(piece);
    pieces.clear();
    for (let i = 0; i < 5; i++)
      pieces.add(world.spawn({ mesh: "roundedBox", position: [i * 1.5 - 3, 0.5, 0], color: BLUE }));
    board.reset(LIVES, SECONDS); // Ready screen: full, stopped countdown.
    status = "ready";
    hud();
  }

  world.spawn({ mesh: "plane", scale: [20, 1, 20], color: "#404D59", pickable: false });
  board.handlers = { onTimeUp: () => finish("lose"), onLivesOut: () => finish("lose") };
  board.listen({ onScore: hud, onSecond: hud, onLives: hud });
  reset();

  return {
    reset,
    stop: () => finish("cancel"),
    dispose: () => finish("cancel"), // Unmounting mid-run reports a cancel.
    start() {
      if (status === "playing") return;
      if (status !== "ready") reset();
      status = "playing";
      board.resume();
      hud();
    },
    update(dt: number) { // GameView's onUpdate: queue moves only; the world steps after.
      time += dt;
      let i = 0;
      for (const piece of pieces) {
        quat.y(time + i++, turn);
        world.transforms.rotation(piece, turn[0], turn[1], turn[2], turn[3]);
      }
    },
    tap(x: number, y: number) {
      if (status !== "playing") return;
      const hit = world.pick(x, y);
      if (!hit || !pieces.delete(hit.entity)) {
        board.addLives(-1); // A miss costs a life.
        return;
      }
      const piece = hit.entity;
      board.add(100);
      void effects.pop(world, piece, { scale: 1, color: BLUE }).then(() => world.despawn(piece));
      if (pieces.size === 0) finish("win");
    },
  };
}
export type Game = ReturnType<typeof createGame>;`,
            platform: "shared",
            language: "tsx",
          },
          {
            title: "useGame.ts",
            code: `import { useRef, useState } from "react";
import { useWorld } from "@nayan-ui/engine";
import { createGame, type Game, type Hud, type Result } from "./game";

export function useGame(onEnd: (result: Result) => void) {
  const [game, setGame] = useState<Game | null>(null);
  const [hud, setHud] = useState<Hud | null>(null);
  const [error, setError] = useState<string | null>(null);
  const end = useRef(onEnd);
  end.current = onEnd;
  const world = useWorld(256, (w) => { // Capacity: entities + text letters + particles.
    const g = createGame(w, setHud, (result) => end.current(result));
    setGame(g);
    return g.dispose; // Runs before the world is disposed.
  }, [], (e) => setError(e.message));
  return { world, game, hud, error };
}`,
            platform: "shared",
            language: "tsx",
          },
          {
            title: "GameScreen.tsx",
            description: "React Native; on the web swap Text/View/Button for p/div/button.",
            code: `import { Button, Text, View } from "react-native";
import { GameView } from "@nayan-ui/engine";
import { camera, type Result } from "./game";
import { useGame } from "./useGame";

export default function GameScreen({ onEnd }: { onEnd: (result: Result) => void }) {
  const { world, game, hud, error } = useGame(onEnd);
  if (error) return <Text>{error}</Text>;
  if (!world || !game || !hud) return <Text>Loading…</Text>;
  const playing = hud.status === "playing";
  return (
    <View style={{ flex: 1 }}>
      <Text>{hud.status} · {hud.score} · {hud.seconds}s · {hud.lives} lives</Text>
      <Button title={playing ? "Stop" : "Start"} onPress={playing ? game.stop : game.start} />
      <GameView source={world} camera={camera} onUpdate={game.update} onTap={game.tap} style={{ flex: 1 }} />
    </View>
  );
}`,
            platform: "native",
            language: "tsx",
          },
        ],
      },
      {
        id: "agent-prompt",
        title: "Agent prompt",
        paragraphs: ["Paste into a task and fill in the brackets."],
        examples: [
          {
            title: "Prompt",
            code: `Build [game] with @nayan-ui/engine for [React | React Native | both].
Read first: https://www.nayanui.com/engine.json, https://www.nayanui.com/game-engine/agent-guide,
https://www.nayanui.com/game-engine/first-game. Check every API name in /game-engine/api-reference.

Follow the agent-guide template: gameConstants.ts, game.ts (no UI imports), useGame.ts (useWorld), one screen per host.
- GameView steps the world after onUpdate; no other loops, no world.update unless stepping differently.
- Per-frame: world.transforms, out arguments, quat with out; no allocations, no React state.
- scoreboard: reset(lives, seconds) for ready, resume() to start; handlers = rules, listen = UI.
- world.after for delays; effects.* for particles; effects.pop then despawn for cleared pieces.
- CSS hex colors; frontLight for flat boards; audio.enabled / haptics.enabled from settings.
- Build meshes once; slice long setup with afterNextFrame.
- start / stop / reset in game.ts; one result per run; stop and unmount report cancel.

Done when: typecheck passes; start, score, win, lose, stop, pause, replay and unmount behave;
the game view has a real size; errors are visible. Claim native behavior only after a development build ran.`,
            platform: "shared",
            language: "text",
          },
        ],
      },
      {
        id: "verify",
        title: "Verify",
        paragraphs: [
          "Types prove little about picking, cameras or timing: run the game. Web needs localhost or HTTPS; native needs a development build.",
        ],
        examples: [
          {
            title: "Commands",
            code: `bunx tsc --noEmit -p .   # each host app
bun run dev               # web: open the game over localhost
bunx expo run:ios         # native development build
bunx expo run:android`,
            platform: "shell",
            language: "bash",
          },
        ],
      },
    ],
  },
];
