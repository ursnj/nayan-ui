import type { EngineGuide } from "./types";

export const MediaPerformanceGuides: EngineGuide[] = [
  {
    slug: "solid-modelling",
    title: "Solid modelling, optimization and LOD",
    description:
      "Use immutable solid recipes for boolean forms and seeded displacement, then tessellate, optimize and reuse static geometry.",
    sections: [
      {
        id: "solid-constructors-and-operations",
        title: "Solid constructors and operations",
        paragraphs: [
          "Solid recipes are immutable: each operation returns a new recipe. Constructors are sphere(radius=0.5), ellipsoid(radii), box(fullSize,rounding=0), capsule(start,end,radius), cylinder(radius,height) and torus(majorRadius,tubeRadius). Static Solid.union(...solids) builds a balanced union.",
          "Instance operations include union, blend(other,width), subtract, intersect, translate(Vec3), rotate(Quat), scale(number|Vec3), paint(Color), shell(thickness), displace({amplitude,frequency?,seed?,octaves?}) and toJSON(). Displacement defaults to three octaves and permits one to six. Use a stable seed when generating deterministic cached scenery.",
        ],
        examples: [
          {
            title: "Boolean shell with a doorway",
            code: `import { Solid, createSolid } from "@nayan-ui/engine";
export function createArch() {
  const outside = Solid.box([4, 3, 1], 0.2).translate([0, 1.5, 0]);
  const opening = Solid.capsule([0, 0, 0], [0, 1.5, 0], 0.8);
  return createSolid(outside.subtract(opening).paint([0.5, 0.48, 0.42]), {
    resolution: 48, center: false, optimize: true,
  });
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "tessellation-and-registration",
        title: "Tessellation and registration",
        paragraphs: [
          "solidGeometry returns unregistered Geometry. SolidOptions controls resolution (cells across the longest dimension, 8..128, default 48) and planar UV projection xy/xz/yz (default xy). Sampling cost rises roughly cubically with resolution; build during preparation, not during onUpdate.",
          "createSolid combines tessellation, optimization and createShape registration, caching identical recipe/options in the session. It accepts SolidOptions plus ShapeOptions and defaults optimize to true. Transparent/rigged assets should remain in their original pipeline.",
        ],
        examples: [
          {
            title: "Inspect before registering",
            code: `import { Solid, solidGeometry, geometryStats, createShape } from "@nayan-ui/engine";
export function createRock() {
  const recipe = Solid.ellipsoid([1, 0.6, 0.8]).displace({ amplitude: 0.08, frequency: 3, seed: 42, octaves: 3 });
  const geometry = solidGeometry(recipe, { resolution: 32, uv: "xz" });
  console.log(geometryStats(geometry));
  return createShape(geometry, { optimize: true });
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "optimize-and-select-lod-explicitly",
        title: "Optimize and select LOD explicitly",
        paragraphs: [
          "optimizeGeometry returns new geometry, cleaning unused/duplicate vertices and degenerate triangles, simplifying within an error bound and reordering for GPU reuse. Options are ratio in (0,1] (default 1, cleanup only), error in 0..1 (default 0.001) and lockBorders (default true). The error bound can prevent reaching the requested ratio.",
          "geometryLods independently simplifies the original for strictly decreasing ratios (default [1,0.5,0.25]). It returns Geometry[], not an automatic runtime LOD system. Register/cache levels once and select an entity mesh when distance changes. Do not optimize skinned meshes or geometry whose exact vertex indices other code relies on.",
        ],
        examples: [
          {
            title: "Build selectable LOD meshes",
            code: `import { geometryLods, geometryStats, createShape, type Geometry, type World, type Entity } from "@nayan-ui/engine";
export function prepareLods(geometry: Geometry) {
  return geometryLods(geometry, [1, 0.5, 0.25], { error: 0.01, lockBorders: true }).map(level => {
    console.log(geometryStats(level));
    return createShape(level, { center: false });
  });
}
export function chooseLod(world: World, entity: Entity, levels: ReturnType<typeof prepareLods>, distance: number) {
  const mesh = levels[distance < 10 ? 0 : distance < 25 ? 1 : 2];
  if (mesh) world.set(entity, { mesh });
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
    ],
  },
  {
    slug: "scoreboard-timers",
    title: "Scoreboards and game-time timers",
    description:
      "Keep scores, lives and clocks in the shared core, dispatch UI events during update, and schedule callbacks that pause with the game.",
    sections: [
      {
        id: "scoreboard-state-and-handlers",
        title: "Scoreboard state and handlers",
        paragraphs: [
          "Access world.scoreboard rather than constructing Scoreboard yourself. Read score, best, lives, seconds, shownSeconds and running. Assign handlers onScore/onLives/onSecond/onTimeUp/onLivesOut. Operations change core state immediately; callbacks are dispatched by World.update when flags indicate changes, not on each React render.",
          "reset(lives=0) clears the run’s score, lives/clock settings and current timing state; best remains in-memory across resets of the same scoreboard. Persist personal bests in your application if they must survive world disposal or app restart. The engine does not provide a leaderboard backend.",
        ],
        examples: [
          {
            title: "Wire scoring and a countdown",
            code: `import type { World } from "@nayan-ui/engine";
export function beginRound(world: World, onScore: (score: number) => void, onEnd: () => void) {
  world.scoreboard.handlers = { onScore, onTimeUp: onEnd, onLivesOut: onEnd };
  world.scoreboard.reset(3);
  world.scoreboard.startCountdown(60);
  world.scoreboard.add(100);
  world.scoreboard.addLives(-1);
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "scoreboard-operations",
        title: "Scoreboard operations",
        paragraphs: [],
        table: {
          headers: ["API / option", "Behavior"],
          rows: [
            [
              "add(points) / set(score)",
              "Add or replace score; returns the score. Negative additions subtract points.",
            ],
            [
              "addLives(n) / setLives(n)",
              "Adjust/replace lives; addLives returns resulting lives.",
            ],
            [
              "startCountdown(seconds,pointsPerSecond=0)",
              "Count down; onTimeUp at zero; optionally earn time-based score.",
            ],
            ["startClock(pointsPerSecond=0)", "Count upward from zero, optionally earning score."],
            ["stop() / resume()", "Stop/resume the clock without pausing all World simulation."],
            [
              "addTime(seconds)",
              "Time bonus or penalty; shownSeconds is ceil for countdown, floor for elapsed time.",
            ],
            [
              "awardTimeBonus(rate,expectedSeconds=0)",
              "Reward whole seconds saved in countdown, or expected minus elapsed time.",
            ],
            [
              "reset(lives=0)",
              "Begin a new scoreboard run; application resets actors and input separately.",
            ],
          ],
        },
      },
      {
        id: "timers-follow-simulation-time",
        title: "Timers follow simulation time",
        paragraphs: [
          "world.after(seconds,callback) schedules a callback by accumulated update time and returns an ID. Due callbacks run in update, earliest first. No updates means no elapsed game time. cancelTimers drops all pending callbacks, and timerCount reports how many remain. There is no public cancel-one-timer API.",
        ],
        examples: [
          {
            title: "Schedule a delayed spawn",
            code: `import type { World } from "@nayan-ui/engine";
export function scheduleEnemy(world: World) {
  const timerId = world.after(1.5, () => world.spawn({ mesh: "sphere", position: [3, 2, 0] }));
  console.log(timerId, world.timerCount);
  return () => world.cancelTimers();
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
        note: "Clock handler dispatch and animation promises can finish during reset/dispose. Guard async continuations against a disposed game and report a run’s win/lose/cancel only once in your application lifecycle.",
      },
    ],
  },
  {
    slug: "audio-haptics",
    title: "Audio, impact feedback and haptics",
    description:
      "Load WAV banks, manage individual voices and global preferences, and respect differences between native feedback and browser capabilities.",
    sections: [
      {
        id: "load-a-named-sound-bank",
        title: "Load a named sound bank",
        paragraphs: [
          "WAV decoding accepts PCM or float data, mono or stereo. audio.load(record) returns SoundBank immediately. Await bank.ready before relying on sounds; failed files are logged/skipped, and early plays are ignored. bank.get(name) returns Sound | undefined, for example for an entity impact option. bank.play(name,options?) returns Voice | null.",
        ],
        examples: [
          {
            title: "Browser sound bank",
            code: `import { audio } from "@nayan-ui/engine";
export async function loadSounds() {
  const bank = audio.load({ jump: "/sounds/jump.wav", music: "/sounds/music.wav" });
  await bank.ready;
  return bank;
}`,
            platform: "react",
            language: "tsx",
          },
          {
            title: "Native sound bank",
            code: `import { audio } from "@nayan-ui/engine";
export async function loadSounds() {
  const bank = audio.load({ jump: require("./assets/jump.wav"), music: require("./assets/music.wav") });
  await bank.ready;
  return bank;
}`,
            platform: "native",
            language: "tsx",
          },
        ],
      },
      {
        id: "voices-and-preferences",
        title: "Voices and preferences",
        paragraphs: [
          "audio.play(sound,options?) and bank.play support volume (0..2, default 1), pan (-1 left to 1 right, default 0), pitch (default 1) and loop (default false). Keep the returned voice and call audio.stop(voice) to stop that instance; it safely accepts null/undefined. audio.volume is master gain and audio.muted is a global toggle. audio.running reports whether output is running.",
          "Web output starts after a click/touch/key gesture, streams the Rust mixer into an AudioWorklet and suspends in hidden tabs. The native mixer starts its platform output on demand. Loading bytes does not bypass browser autoplay restrictions. A game screen owns its loops and should stop them when leaving.",
        ],
        examples: [
          {
            title: "A loop with explicit cleanup",
            code: `import { audio, type SoundBank } from "@nayan-ui/engine";
export function startMusic(bank: SoundBank<"jump" | "music">, enabled: boolean) {
  audio.muted = !enabled;
  const voice = enabled ? bank.play("music", { volume: 0.35, loop: true }) : null;
  return () => audio.stop(voice);
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "native-collision-feedback-shares-the-mixer",
        title: "Native collision feedback shares the mixer",
        paragraphs: [
          "Set ImpactFeedback on an entity to let the core react to solid impacts without per-event JS sound calls. minSpeed defaults 1, maxSpeed 10, volume 1 and haptic 0. A Sound from bank.get is optional; no sound permits haptic-only impacts. Configure haptic strength as zero when haptics are disabled. world.listener selects the entity used for spatial audio.",
        ],
        examples: [
          {
            title: "Attach muted-aware impacts",
            code: `import type { World, Entity, Sound } from "@nayan-ui/engine";
export function attachImpacts(world: World, player: Entity, bump: Sound | undefined, enableSounds: boolean, enableHaptics: boolean) {
  world.listener = player;
  world.set(player, { impact: { sound: enableSounds ? bump : undefined, minSpeed: 1, maxSpeed: 8, volume: 0.6, haptic: enableHaptics ? 0.5 : 0 } });
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "haptic-patterns-and-support",
        title: "Haptic patterns and support",
        paragraphs: [
          "haptics.supported checks capability. haptics.enabled gates the TypeScript haptics API. impact(intensity=0.6,sharpness=0.5) and selection() throttle rapid impacts within about 35ms. notify accepts success/warning/error. play accepts HapticTap[] with time in seconds, intensity and sharpness 0..1.",
          "Native platforms use their haptic facilities. Browsers use vibration if available and skip it when unsupported; intensity/sharpness cannot be reproduced precisely. haptics.enabled does not rewrite existing core ImpactFeedback configurations, so update those too when applying settings.",
        ],
        examples: [
          {
            title: "Respect feedback preferences",
            code: `import { haptics } from "@nayan-ui/engine";
export function reward(enabled: boolean) {
  haptics.enabled = enabled;
  if (!haptics.supported) return;
  haptics.notify("success");
  haptics.play([{ time: 0, intensity: 0.4, sharpness: 0.3 }, { time: 0.12, intensity: 0.8, sharpness: 0.7 }]);
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
    ],
  },
  {
    slug: "cache-performance",
    title: "Procedural cache and performance",
    description:
      "Persist deterministic static meshes, batch transform updates, observe capacity limits, and keep the frame loop free of asset construction.",
    sections: [
      {
        id: "session-caches-and-persistent-geometry",
        title: "Session caches and persistent geometry",
        paragraphs: [
          "Keep a promise or model factory cache at module scope and reuse its result across runs. Mesh IDs are process/session resources shared by imported models, glyphs, aliases and procedural models. Disposing a world does not free those registrations. meshIdLimit() is one past the highest registered mesh ID, not a remaining-capacity count; there are 4096 total slots, including built-ins.",
          "ProceduralCache(revision,storage?) persists deterministic factory results containing static untextured Model objects nested in plain arrays/objects and serializable data. A hit registers saved geometry, avoiding tessellation and painting. It does not persist raw native handles, textures, imported rigs, lazy getters, typed-array factory output or arbitrary class instances. Unsupported persistence does not stop the factory result from being used in memory.",
        ],
        examples: [
          {
            title: "Cache a deterministic model factory",
            code: `import { ProceduralCache, createShape, block } from "@nayan-ui/engine";
export const sceneryCache = new ProceduralCache("scenery-v3");
export function prepareBench() {
  return sceneryCache.get("bench", () => ({
    seat: createShape(block(2, 0.2, 0.6), { shine: 0.15 }),
    leg: createShape(block(0.15, 0.7, 0.15)),
  }));
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "storage-contract-and-revisioning",
        title: "Storage contract and revisioning",
        paragraphs: [
          "ProceduralStorage.read(key) must synchronously return Uint8Array|null. write(key,bytes) may be synchronous or Promise<void>. flush awaits outstanding writes; stats exposes hits/builds/invalid/failures/pendingWrites. Repeated memory-cache gets return the same object without another storage hit.",
          "Increment the revision or key when recipes, tessellation, paint, engine geometry format assumptions or options change. Include the revision in the storage namespace too. Corrupt/mismatched/oversized records are rejected and rebuilt. Individual records have a 32 MiB limit. localStorage is only suitable for small examples; a larger browser cache needs a synchronous in-memory layer hydrated from IndexedDB before the cache is used.",
        ],
        examples: [
          {
            title: "Small browser storage adapter",
            code: `import { ProceduralCache, type ProceduralStorage } from "@nayan-ui/engine";
export function createBrowserCache() {
  const revision = "props-v3";
  const storage: ProceduralStorage = {
    read(key) {
      const raw = localStorage.getItem(revision + ":" + key);
      return raw === null ? null : Uint8Array.from(JSON.parse(raw) as number[]);
    },
    write(key, bytes) { localStorage.setItem(revision + ":" + key, JSON.stringify(Array.from(bytes))); },
  };
  return new ProceduralCache(revision, storage);
}`,
            platform: "react",
            language: "tsx",
          },
          {
            title: "Native host storage adapter",
            code: `import { ProceduralCache, type ProceduralStorage } from "@nayan-ui/engine";
// Adapt an existing synchronous binary store (e.g. your MMKV/file cache).
interface BinaryStore { read(key: string): Uint8Array | null; write(key: string, bytes: Uint8Array): void; }
export function createNativeCache(store: BinaryStore) {
  const revision = "props-v3";
  const storage: ProceduralStorage = {
    read: key => store.read(revision + ":" + key),
    write: (key, bytes) => store.write(revision + ":" + key, bytes),
  };
  return new ProceduralCache(revision, storage);
}`,
            platform: "native",
            language: "tsx",
          },
        ],
      },
      {
        id: "transform-batches",
        title: "Transform batches",
        paragraphs: [
          "world.createTransformBatch() creates a reusable batch for draw-only position/rotation/scale/color changes. position(entity,x,y,z) writes a position; set(entity,TransformOptions) queues other supported fields. flush applies queued records and returns the number applied, clearing the queue even if commit fails. clear discards queued changes.",
          "Flush before queries, animations or update so those operations see the new state. Use world.set for text updates, physics and non-transform options. Batching avoids many bridge calls; it is not a separate physics controller or permission to mutate renderer internals.",
        ],
        examples: [
          {
            title: "Batch a visual swarm",
            code: `import type { World, Entity } from "@nayan-ui/engine";
export function animateSwarm(world: World, entities: readonly Entity[]) {
  const batch = world.createTransformBatch();
  let time = 0;
  return (dt: number) => {
    time += dt;
    entities.forEach((entity, i) => batch.position(entity, Math.sin(time + i) * 3, 1, Math.cos(time + i) * 3));
    batch.flush();
    world.update(dt);
  };
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "practical-budgets",
        title: "Practical budgets",
        paragraphs: [
          "Prepare built-ins, geometry, fonts, sounds and model data before a run. Do not createShape/createSolid/loadModel/new World inside onUpdate. Reuse typed arrays for skinPoints and position queries, use instancing for repeated static models, and limit transparent overlap and shadow extent.",
          "The native bridge aliases fixed world buffers; browser code maintains stable JavaScript buffers while copying across WASM memory boundaries so memory growth cannot detach arrays held by consumers. Avoid assuming web and native have identical zero-copy behavior or identical performance. Profile actual target devices with GameStats and a production build.",
        ],
      },
    ],
  },
  {
    slug: "render-source",
    title: "Custom RenderSource integration",
    description:
      "Feed GameView from a custom simulation using the same instance-buffer layout, or use World as the supported high-level source.",
    sections: [
      {
        id: "instance-buffer-contract",
        title: "Instance buffer contract",
        paragraphs: [
          "RenderSource is an advanced interface. matrices contains column-major mat4 transforms grouped by mesh; colors stores RGBA in the same order; regions is optional [u0,v0,u1,v1] per instance. Only the packed active prefix is drawn. count is the number of valid instances and capacity sizes the reusable buffers.",
          "ranges stores [first,count] pairs per mesh ID. Opaque mesh m is at ranges[2*m]; transparent mesh m is at ranges[2*(4096+m)]. A shorter ranges table simply has no transparent half. Meshes must already be registered by built-ins, createShape or a loader. setView receives the last rendered view-projection matrix and view dimensions for your own screen queries.",
        ],
        examples: [
          {
            title: "One custom cube instance",
            code: `import { warmUpEngine, type RenderSource } from "@nayan-ui/engine";
export async function createCustomSource(): Promise<RenderSource> {
  await warmUpEngine();
  const matrices = new Float32Array(16);
  matrices.set([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1]);
  const ranges = new Uint32Array(4096 * 4);
  ranges.set([0, 1], 0); // Built-in cube mesh ID 0, first instance 0, count 1.
  return { matrices, colors: new Float32Array([0.3, 0.7, 1, 1]), ranges, count: 1, capacity: 1 };
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "use-custom-sources-deliberately",
        title: "Use custom sources deliberately",
        paragraphs: [
          "Pass a custom source to GameView and update its arrays in onUpdate. It does not acquire World’s physics, entity handles, timers, animation or pick methods automatically. Optional nativeWorld belongs to a real World and associates skeletal draw data; do not invent one for a custom simulation.",
          "Prefer the high-level World API unless you already own a simulation and can guarantee correct packing, ranges and buffer lifetimes. meshIdLimit is a scan bound used by rendering and does not replace the fixed transparent-half offset.",
        ],
      },
    ],
  },
  {
    slug: "troubleshooting",
    title: "Troubleshooting and deployment",
    description:
      "Diagnose initialization, asset, layout, input and lifecycle failures on React and React Native without changing the shared gameplay API.",
    sections: [
      {
        id: "initialization-and-rendering",
        title: "Initialization and rendering",
        paragraphs: [],
        table: {
          headers: ["API / option", "Behavior"],
          rows: [
            [
              "Engine says to await warmUpEngine",
              "Call and await it before browser World construction, loaders and synchronous procedural registration. isEngineAvailable means the bridge is present, not that WASM loading has finished.",
            ],
            [
              "Native core not linked / Expo Go",
              "Use a native development build; reinstall pods and rebuild the host after native dependency changes.",
            ],
            [
              "Blank canvas",
              "Check measured height/width, onError, camera direction, entity scale, and that onUpdate calls world.update(dt).",
            ],
            [
              "WASM returns HTML / MIME error",
              "Fix the public path or CDN fallback; serve real .wasm bytes with application/wasm.",
            ],
            [
              "No WebGPU / worklet",
              "Use HTTPS or localhost; test WebGL2 fallback and check browser capability, CSP and device policy.",
            ],
            [
              "View is paused after navigation",
              "Pass the true focus/playing state, clear held input, and keep the existing world for resume.",
            ],
            [
              "World used after dispose",
              "Create one owned scene per effect setup and cancel late async initialization; never remount a disposed scene.",
            ],
          ],
        },
      },
      {
        id: "assets-animation-and-feedback",
        title: "Assets, animation and feedback",
        paragraphs: [],
        table: {
          headers: ["API / option", "Behavior"],
          rows: [
            [
              "Bundled native asset fails in Android release",
              "Install expo-asset, configure Metro assetExts and test an actual release build.",
            ],
            [
              "Browser asset is a number",
              "Replace Metro numeric assets with URL strings in the browser host.",
            ],
            [
              "Model has no clip",
              "Inspect jointCount and animations; export skin/clip data into a self-contained GLB.",
            ],
            [
              "Model appears at wrong origin",
              "Review center:false, original model coordinates, fit and actor transforms. Grounding is application logic.",
            ],
            [
              "Picking returns null",
              "Wait for a drawn frame, use local view coordinates and a pickable mesh; physics raycast and rendered bounds picking are different APIs.",
            ],
            [
              "No sound before interaction",
              "Browser autoplay policy requires a click, touch or key press. Await bank.ready and check audio.muted/running.",
            ],
            [
              "No vibration",
              "Check haptics.enabled/supported and platform limits; unsupported browser vibration is a no-op.",
            ],
            [
              "Out of entities / meshes",
              "Budget glyph children and particles; cache mesh creation across reset/unmount rather than registering per frame.",
            ],
          ],
        },
      },
      {
        id: "production-checklist",
        title: "Production checklist",
        paragraphs: [
          "Build the browser host for production and exercise the emitted asset URLs on an HTTP server. Verify both WebGPU and WebGL2, container resizing, tap/pinch/overlay capture, pause/resume, hidden-tab behavior and the first-interaction audio path. A development-only JSX runtime must not be baked into a package consumed with production React.",
          "On native, verify both supported target platforms after core/config changes. The engine can be rebuilt separately from the host app; a new prebuilt Rust library does not prove that an installed app binary has been rebuilt. Handle canceled run reporting and cleanup in your own game integration.",
        ],
      },
    ],
  },
];
