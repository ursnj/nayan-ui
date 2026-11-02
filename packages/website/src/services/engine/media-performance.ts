import type { EngineGuide } from "./types";

export const MediaPerformanceGuides: EngineGuide[] = [
  {
    slug: "solid-modelling",
    title: "Solid modelling, optimization and LOD",
    description: "Build solids, combine shapes and prepare optimized geometry.",
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
            code: `import { Solid, solidGeometry, getGeometryStats, createShape } from "@nayan-ui/engine";
export function createRock() {
  const recipe = Solid.ellipsoid([1, 0.6, 0.8]).displace({ amplitude: 0.08, frequency: 3, seed: 42, octaves: 3 });
  const geometry = solidGeometry(recipe, { resolution: 32, uv: "xz" });
  console.log(getGeometryStats(geometry));
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
          "createGeometryLods independently simplifies the original for strictly decreasing ratios (default [1,0.5,0.25]). It returns Geometry[], not an automatic runtime LOD system. Register/cache levels once and select an entity mesh when distance changes. Do not optimize skinned meshes or geometry whose exact vertex indices other code relies on.",
        ],
        examples: [
          {
            title: "Build selectable LOD meshes",
            code: `import { createGeometryLods, getGeometryStats, createShape, type Geometry, type World, type Entity } from "@nayan-ui/engine";
export function prepareLods(geometry: Geometry) {
  return createGeometryLods(geometry, [1, 0.5, 0.25], { error: 0.01, lockBorders: true }).map(level => {
    console.log(getGeometryStats(level));
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
    description: "Track score, lives and time with clocks that pause with the game.",
    sections: [
      {
        id: "scoreboard-state-and-handlers",
        title: "Scoreboard state and handlers",
        paragraphs: [
          "Access world.scoreboard rather than constructing Scoreboard yourself. Read score, best, lives, seconds, shownSeconds and running. Assign handlers onScore/onLives/onSecond/onTimeUp/onLivesOut. Operations change core state immediately; callbacks are dispatched by World.update when flags indicate changes, not on each React render.",
          "reset(lives = 0, countdownSeconds = 0) starts a new run: score 0, the given lives and a stopped clock. With countdownSeconds, the stopped clock already shows that full countdown, which is exactly what a ready screen needs; resume() then starts it. best stays in memory across resets of the same scoreboard. Persist personal bests in your application if they must survive world disposal or an app restart. The engine has no leaderboard backend.",
        ],
        examples: [
          {
            title: "Ready screen, start and scoring",
            description:
              "Call ready when a round is prepared (the UI shows 60 seconds and 3 lives), start when the player presses Start, and score from gameplay events.",
            code: `import type { World } from "@nayan-ui/engine";
export function makeRound(world: World, onScore: (score: number) => void, onSecond: (seconds: number) => void, onEnd: () => void) {
  world.scoreboard.handlers = { onScore, onSecond, onTimeUp: onEnd, onLivesOut: onEnd };
  return {
    ready: () => world.scoreboard.reset(3, 60), // Stopped, showing 60.
    start: () => world.scoreboard.resume(), // The countdown begins.
    score: (points: number) => world.scoreboard.add(points),
    hurt: () => world.scoreboard.addLives(-1),
  };
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
              "reset(lives=0, countdownSeconds=0)",
              "Begin a new run with a stopped clock; with countdownSeconds it shows the full countdown (ready screen) until resume(). Reset actors and input separately.",
            ],
          ],
        },
      },
      {
        id: "timers-follow-simulation-time",
        title: "Timers follow simulation time",
        paragraphs: [
          "world.after(seconds, callback) runs callback after that many seconds of update time and returns a timer id. It is game time: it pauses whenever updates stop (GameView paused, app in background), so never use setTimeout for gameplay delays. Due callbacks run inside update, earliest first.",
          "cancelTimer(id) drops one timer and returns false if it already ran or was dropped. cancelTimers() drops every pending timer; call it on reset and stop so an old round cannot act in the new one. timerCount reports how many are waiting. After dispose, after does nothing and returns 0, and pending timers never run.",
        ],
        examples: [
          {
            title: "Schedule and cancel game-time delays",
            description:
              "Call schedule when an enemy should appear later. cancel drops just that spawn; resetRound drops every pending timer.",
            code: `import type { World } from "@nayan-ui/engine";
export function scheduleEnemy(world: World) {
  const id = world.after(1.5, () => world.spawn({ mesh: "sphere", position: [3, 2, 0] }));
  return {
    cancel: () => world.cancelTimer(id),
    resetRound: () => world.cancelTimers(),
  };
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
        note: "Report a run's win/lose/cancel only once in your application lifecycle: a time-up and a lost life can both arrive in the same update.",
      },
    ],
  },
  {
    slug: "audio-haptics",
    title: "Audio, impact feedback and haptics",
    description: "Load sounds, manage playback and respect feedback preferences.",
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
          "audio.play(sound,options?) and bank.play support volume (0..2, default 1), pan (-1 left to 1 right, default 0), pitch (default 1) and loop (default false). Keep the returned voice and call audio.stop(voice) to stop that instance; it safely accepts null/undefined. audio.volume is master gain. audio.enabled is the global sound switch (audio.muted is its inverse); it mirrors haptics.enabled, so apply settings with audio.enabled = settings.enableSounds and haptics.enabled = settings.enableHaptics. audio.running reports whether output is running.",
          "Web output starts after a click/touch/key gesture, streams the Rust mixer into an AudioWorklet and suspends in hidden tabs. The native mixer starts its platform output on demand. Loading bytes does not bypass browser autoplay restrictions. A game screen owns its loops and should stop them when leaving.",
        ],
        examples: [
          {
            title: "A loop with explicit cleanup",
            code: `import { audio, type SoundBank } from "@nayan-ui/engine";
export function startMusic(bank: SoundBank<"jump" | "music">, enabled: boolean) {
  audio.enabled = enabled;
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
      "Use automatic asset caching, clear saved data, move many entities with world.transforms and keep frames allocation-free.",
    sections: [
      {
        id: "session-caches-and-persistent-geometry",
        title: "Session caches and persistent geometry",
        paragraphs: [
          "Use the normal loaders and mesh factories during setup. The engine shares downloads, decoding and prepared models. Rust owns geometry preparation and persistent records. No application cache is needed.",
          "Worlds own actors; assets are shared session resources. Disposing a world or releasing temporary bytes keeps loaded handles and saved records valid.",
          "Saved records have no expiry or automatic eviction. Full or denied storage falls back to session resources; corrupt entries rebuild. Browser quotas and user clearing still apply. Use versioned URLs when assets change.",
        ],
        table: {
          headers: ["Storage", "Behavior"],
          rows: [
            [
              "Native",
              "Rust stores files in Application Support / filesDir. No Expo FileSystem dependency.",
            ],
            [
              "Web",
              "Binary IndexedDB records; Rust validates keys and checksums. No localStorage or Base64.",
            ],
            [
              "Browser warm-up",
              "Up to 64 MiB / 1,024 recent geometry records warm into Rust. Cold records may rebuild without deletion.",
            ],
            [
              "RAM",
              "Temporary source bytes are bounded. Releasing them never deletes saved files.",
            ],
            [
              "Clear",
              "clearAssetCache removes engine records after a user action; loaded handles remain usable.",
            ],
          ],
        },
        examples: [
          {
            title: "Call the normal APIs on every scene setup",
            code: `import { warmUpEngine, World, loadModel, createShape, block } from "@nayan-ui/engine";
export async function createLevel(heroUrl: string) {
  await warmUpEngine();
  const hero = await loadModel(heroUrl, { fit: 2 });
  const crate = createShape(block(1, 1, 1), { optimize: true });
  const world = new World(64);
  world.spawn({ mesh: hero, position: [0, 1, 0] });
  world.spawn({ mesh: crate, position: [2, 0.5, 0] });
  return { world, update: (dt: number) => world.update(dt), dispose: () => world.dispose() };
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "storage-contract-and-revisioning",
        title: "Permanent records and explicit clearing",
        paragraphs: [
          "Successful writes stay saved across restarts and game replays until the user explicitly clears engine storage, clears the app/site data or uninstalls the native app. The engine does not expire old recipe revisions or evict completed records to make space. When a new write cannot fit, existing records remain intact and gameplay continues with in-memory resources. A browser can only provide the persistence its storage policy allows.",
          "Call clearAssetCache() only from an explicit user action. It clears engine-owned saved geometry and original files, plus temporary download bytes. Existing worlds and loaded handles remain valid; a future app launch reloads/rebuilds assets. It does not clear unrelated application settings or custom ProceduralStorage adapters. A rejected clear is reported to the caller rather than showing a false success message.",
          "ProceduralCache(revision) remains optional for expensive deterministic multi-model factories. The games library uses it internally to skip JS factory construction while the engine owns storage and mesh preparation; host applications do not need to configure it. Its default binary storage also delegates to Rust. Revision/key changes distinguish new recipes without deleting older records. Do not persist live worlds, Entity handles, imported rigs or texture handles in this static factory cache.",
        ],
        examples: [
          {
            title: "Clear saved assets from a React settings button",
            code: `import { useState } from "react";
import { clearAssetCache } from "@nayan-ui/engine";
export function ClearWebAssets() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function clear() {
    setBusy(true);
    try { await clearAssetCache(); setMessage("Saved assets cleared. They reload next launch."); }
    catch { setMessage("Could not clear saved assets. Please try again."); }
    finally { setBusy(false); }
  }
  return <div><button disabled={busy} onClick={() => void clear()}>Clear saved game assets</button><p>{message}</p></div>;
}`,
            platform: "react",
            language: "tsx",
          },
          {
            title: "Use the same clear API in React Native settings",
            code: `import { useState } from "react";
import { Button, Text, View } from "react-native";
import { clearAssetCache } from "@nayan-ui/engine";
export function ClearNativeAssets() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function clear() {
    setBusy(true);
    try { await clearAssetCache(); setMessage("Saved assets cleared. They reload next launch."); }
    catch { setMessage("Could not clear saved assets. Please try again."); }
    finally { setBusy(false); }
  }
  return <View><Button title="Clear saved game assets" disabled={busy} onPress={() => void clear()} /><Text>{message}</Text></View>;
}`,
            platform: "native",
            language: "tsx",
          },
        ],
      },
      {
        id: "transform-batches",
        title: "Move many entities with world.transforms",
        paragraphs: [
          "world.transforms is the world's shared TransformBatch, created on first use. Its scalar methods queue draw-only changes without allocating: position(entity, x, y, z), rotation(entity, qx, qy, qz, qw), scale(entity, x, y?, z?), color(entity, r, g, b, a?) and transform(entity, x, y, z, qx, qy, qz, qw) for position and rotation together. Consecutive calls for the same entity merge into one record; size reports the queued records.",
          "The batch is not flushed automatically. The rule: call world.update(dt) first, queue your moves, then call world.transforms.flush() once at the end of the same onUpdate. flush applies everything in one native call and returns how many records applied. Also flush before you read positions, start an animation or run a query that must see the new values. clear() discards queued changes.",
          "Use world.set for text, physics, parents and other options; set(entity, TransformOptions) on the batch exists for occasional mixed updates but allocates more than the scalar methods. createTransformBatch() makes an extra, independent batch (for example a drag preview you may discard), but most games only need world.transforms.",
        ],
        examples: [
          {
            title: "Orbit a swarm with one native call per frame",
            description:
              "Create once during setup and pass the returned function to GameView's onUpdate. It steps the world, queues every move and flushes once.",
            code: `import { quat, type Entity, type MutableQuat, type World } from "@nayan-ui/engine";
export function makeSwarm(world: World, entities: readonly Entity[]) {
  const turn: MutableQuat = [0, 0, 0, 1];
  let time = 0;
  return (dt: number) => {
    world.update(dt);
    time += dt;
    const batch = world.transforms;
    for (let i = 0; i < entities.length; i++) {
      const angle = time + i;
      quat.y(-angle, turn);
      batch.transform(entities[i]!, Math.sin(angle) * 3, 1, Math.cos(angle) * 3, turn[0], turn[1], turn[2], turn[3]);
    }
    batch.flush();
  };
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "zero-allocation-frames",
        title: "Zero-allocation frames",
        paragraphs: [
          "A 60 fps loop that creates arrays and objects every frame causes garbage-collection stutter on phones. The engine's per-frame APIs let you avoid that entirely: allocate scratch values once during setup, then reuse them.",
          "Queries take an out argument: position, worldPosition and velocity fill a [x,y,z] tuple; raycast fills a RaycastHit and pick a PickHit; toScreen fills [x,y]; screenToWorld fills [x,y,z]. Every quat helper takes an out MutableQuat. world.transforms moves entities with plain numbers. The value returned is the out object itself (or null), so copy it if you need to keep it beyond the frame.",
        ],
        table: {
          headers: ["Instead of (allocates each frame)", "Use (reuses storage)"],
          rows: [
            ["world.position(e)", "world.position(e, at)"],
            ["world.raycast(o, d, max)", "world.raycast(o, d, max, mask, hit)"],
            [
              "world.set(e, { rotation: quat.y(a) })",
              "quat.y(a, q); world.transforms.rotation(e, q[0], q[1], q[2], q[3])",
            ],
            [
              "world.set(e, { position: [x, y, z] }) for many entities",
              "world.transforms.position(e, x, y, z) … then one flush()",
            ],
            ["world.toScreen(p)", "world.toScreen(p, screen)"],
          ],
        },
        examples: [
          {
            title: "A ground probe that allocates nothing",
            description:
              "Create the probe once. Call it from onUpdate after world.update(dt). DOWN, at and hit are created once and reused forever.",
            code: `import type { Entity, RaycastHit, Vec3, World } from "@nayan-ui/engine";
const DOWN: Vec3 = [0, -1, 0];
export function makeGroundProbe(world: World, player: Entity, floorLayer: number) {
  const at: [number, number, number] = [0, 0, 0];
  const hit: RaycastHit = { entity: -1 as Entity, distance: 0, normal: [0, 0, 0], point: [0, 0, 0] };
  return (): boolean => {
    if (!world.position(player, at)) return false;
    return world.raycast(at, DOWN, 1.05, floorLayer, hit) !== null;
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
          "Prepare built-ins, geometry, fonts, sounds and model data before a run. Do not createShape/createSolid/loadModel/new World inside onUpdate. Reuse typed arrays for sampleSkinnedVertices and position queries, use instancing for repeated static models, and limit transparent overlap and shadow extent. Mesh ids are app-wide and never freed (MAX_MESHES = 4096 ids including the 16 built-in shapes, so about 4,080 custom registrations per session); never build a mesh per spawn.",
          "The native bridge aliases fixed world buffers. In the browser, the renderer reads a live world's output buffers in place in WASM memory instead of copying them each frame, and the JavaScript mirrors copy only the valid instances rather than the whole capacity. Web and native still differ in performance; profile real target devices with GameViewStats and a production build.",
          "Drawing documents replay strokes efficiently: undo, redo and layer changes reuse their composite buffers and make one pass over the strokes, and only changed pixel rows upload to the GPU. A DrawingDocument texture used on a game entity costs one texture, not a mesh id.",
        ],
      },
    ],
  },
  {
    slug: "render-source",
    title: "Custom RenderSource integration",
    description: "Render a custom simulation using the shared instance-buffer contract.",
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
          "Prefer the high-level World API unless you already own a simulation and can guarantee correct packing, ranges and buffer lifetimes. getMeshIdLimit is a scan bound used by rendering and does not replace the fixed transparent-half offset.",
        ],
      },
    ],
  },
  {
    slug: "troubleshooting",
    title: "Troubleshooting and deployment",
    description: "Fix initialization, rendering, asset and feedback problems.",
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
              "Call and await it before browser World construction and synchronous procedural registration. Async asset loaders initialize the core themselves. isEngineAvailable means the bridge is present, not that WASM loading has finished.",
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
              '"World: used after dispose()" error',
              "Only spawn, update, burst and effects throw after dispose; cleanup calls and queries are no-ops. Check world.isDisposed before spawning or firing an effect after an await, create one owned scene per effect setup, cancel late async initialization and never remount a disposed scene.",
            ],
            [
              "Moves queued on world.transforms never appear",
              "The batch is not auto-flushed: call world.transforms.flush() once at the end of onUpdate, after world.update(dt).",
            ],
            [
              "toScreen or screenToWorld returns null",
              "They need a drawn frame: call them after the first onUpdate with dt > 0, and check for null (behind the camera or edge-on plane).",
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
              "Browser autoplay policy requires a click, touch or key press. Await bank.ready and check audio.enabled/running.",
            ],
            [
              "No vibration",
              "Check haptics.enabled/supported and platform limits; unsupported browser vibration is a no-op.",
            ],
            [
              "Out of entities / meshes",
              "Budget glyph children and particles; equal assets are reused automatically, but unique geometry, glyphs and particles still consume capacity. Keep asset construction in setup.",
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
