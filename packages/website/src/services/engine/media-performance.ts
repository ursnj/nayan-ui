import type { EngineGuide } from "./types";

export const MediaPerformanceGuides: EngineGuide[] = [
  {
    slug: "solid-modelling",
    title: "Solid modelling, optimization and LOD",
    description: "Model solids in code, then optimize them and prepare LOD levels.",
    sections: [
      {
        id: "build-a-solid",
        title: "Build a solid",
        paragraphs: [
          "A Solid is an immutable recipe: every operation returns a new Solid. Primitives are centred at the origin, and cylinders and tori stand on the Y axis.",
          "createSolid(solid, options) tessellates, optimizes and registers the recipe once, then returns the same model for the same recipe. Call it after warmUpEngine, during setup; paint takes 0..1 tuples, and white parts can be tinted per entity.",
        ],
        table: {
          headers: ["Solid API", "What it does"],
          rows: [
            ["Solid.sphere(radius = 0.5) / ellipsoid(radii)", "Round primitives."],
            ["Solid.box(size, radius = 0)", "Full width, height and depth; rounding stays inside."],
            ["Solid.capsule(start, end, radius) / cylinder(radius, height)", "Rods and posts."],
            ["Solid.torus(radius, tube)", "Major radius to the tube centre, then the tube radius."],
            [
              "Solid.union(...solids) / a.union(b)",
              "Join parts; the static form balances many parts.",
            ],
            ["a.blend(b, width)", "Smooth weld over width world units."],
            ["a.subtract(b) / a.intersect(b)", "Drill holes, or keep only the overlap."],
            ["translate(v) / rotate(q) / scale(s | v)", "Move, turn or resize the recipe."],
            ["paint(color)", "Vertex color; paint after subtract to color the cut walls."],
            ["shell(thickness)", "Hollow wall of that full thickness."],
            [
              "displace({ amplitude, frequency?, seed?, octaves? })",
              "Seeded noise detail, 1..6 octaves (default 3).",
            ],
            ["toJSON()", "Serializable recipe for caching or inspection."],
          ],
        },
        examples: [
          {
            title: "An arch with a doorway",
            code: `import { Solid, createSolid } from "@nayan-ui/engine";

// After warmUpEngine, once per app.
export const arch = createSolid(
  Solid.box([4, 3, 1], 0.2)
    .translate([0, 1.5, 0])
    .subtract(Solid.capsule([0, 0, 0], [0, 1.5, 0], 0.8))
    .paint([0.5, 0.48, 0.42]),
  { resolution: 48, center: false },
);`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "tessellate-and-inspect",
        title: "Tessellate, inspect and deform",
        paragraphs: [
          "solidGeometry(solid, { resolution, uv }) returns editable, unregistered Geometry: resolution is 8..128 cells across the longest side (default 48) and uv picks the planar projection 'xy' (default), 'xz' or 'yz'. Cost grows roughly cubically with resolution, so build during setup, never in onUpdate.",
          "getGeometryStats reports vertices, triangles, bytes and bounds without registering anything. deformGeometry(geometry, (position, uv) => newPosition) sculpts a copy of one smooth surface and recomputes its normals.",
        ],
        examples: [
          {
            title: "A seeded rock",
            code: `import { Solid, createShape, deformGeometry, getGeometryStats, solidGeometry } from "@nayan-ui/engine";

export function createRock(seed: number) {
  const recipe = Solid.ellipsoid([1, 0.6, 0.8]).displace({ amplitude: 0.08, frequency: 3, seed });
  const raw = solidGeometry(recipe, { resolution: 32, uv: "xz" });
  const flat = deformGeometry(raw, ([x, y, z]) => [x, Math.max(y, -0.3), z]); // flatten the base
  console.log(getGeometryStats(flat)); // { vertices, triangles, bytes, bounds }
  return createShape(flat, { optimize: true });
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "optimize-and-lod",
        title: "Optimize and build LOD levels",
        paragraphs: [
          "optimizeGeometry(geometry, { ratio, error, lockBorders }) returns a cleaned copy: ratio 1 (default) only welds and reorders, lower ratios simplify within error (default 0.001), and lockBorders (default true) keeps open edges fixed. Use it on static opaque meshes only, never on skinned meshes or geometry whose vertex indices other code reads.",
          "On iOS and Android you rarely need levels of your own: every static mesh of at least 1,500 triangles gets coarser index buffers from a background thread, and each instance draws the coarsest whose error stays under half a pixel on screen (in the shadow pass, at the shadow map's resolution). Skinned meshes, and meshes built mostly of two-sided surfaces (leaf and card clouds, which simplification folds away at no measured error), are never simplified. The web draws full meshes.",
          "createGeometryLods(geometry, ratios = [1, 0.5, 0.25], options) simplifies the original independently per level, for a mesh you want to swap yourself: a far tree that becomes a billboard, or a web scene that must stay light. Register the levels once and swap an entity's mesh when its distance changes.",
        ],
        examples: [
          {
            title: "Three LOD meshes chosen by distance",
            code: `import { createGeometryLods, createShape, type Entity, type Geometry, type Model, type World } from "@nayan-ui/engine";

export function prepareLods(geometry: Geometry): Model[] {
  return createGeometryLods(geometry, [1, 0.5, 0.25], { error: 0.01 }).map((level) => createShape(level));
}

export function chooseLod(world: World, entity: Entity, levels: Model[], distance: number) {
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
    description: "Track score, lives and time, and schedule delays that pause with the game.",
    sections: [
      {
        id: "rules-and-listeners",
        title: "Rules and listeners",
        paragraphs: [
          "world.scoreboard keeps score, lives and the clock in Rust; read score, best, lives, seconds, shownSeconds and running. Assign handlers for the game's rules and call listen for UI that follows along: it adds handlers without replacing others and returns an unlisten function.",
          "Callbacks run from the world's step only when a value changed, handlers first and then listeners in order. best lasts for the scoreboard's life, so persist personal bests yourself.",
        ],
        examples: [
          {
            title: "A HUD hook",
            code: `import { useEffect, useState } from "react";
import type { World } from "@nayan-ui/engine";

export function useHud(world: World, onEnd: (result: "win" | "lose") => void) {
  const [score, setScore] = useState(0);
  const [seconds, setSeconds] = useState(60);
  useEffect(() => {
    world.scoreboard.handlers = { onTimeUp: () => onEnd("win"), onLivesOut: () => onEnd("lose") }; // rules
    return world.scoreboard.listen({ onScore: setScore, onSecond: setSeconds }); // UI; unlistens on unmount
  }, [world, onEnd]);
  return { score, seconds };
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "ready-start-score",
        title: "Ready, start and score",
        paragraphs: [
          "reset(lives, countdownSeconds) begins a run: score 0, those lives and a stopped clock that already shows the full countdown, which is your ready screen. resume() starts it when the player presses Start; reset actors and input yourself.",
        ],
        examples: [
          {
            title: "A round's controls",
            code: `import type { World } from "@nayan-ui/engine";

export function round(world: World) {
  const board = world.scoreboard;
  return {
    ready: () => board.reset(3, 60), // 3 lives, stopped at 60
    start: () => board.resume(),
    coin: () => board.add(10),
    hurt: () => board.addLives(-1), // onLivesOut fires at 0
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
        paragraphs: [
          "Operations change state immediately; their callbacks follow on the next step. stop() and resume() affect only the clock, not the rest of the simulation.",
        ],
        table: {
          headers: ["Operation", "Behavior"],
          rows: [
            [
              "add(points) / set(score)",
              "Add (negative subtracts) or replace the score; returns it.",
            ],
            ["addLives(n) / setLives(n)", "Adjust or replace lives; addLives returns the result."],
            [
              "startCountdown(seconds, pointsPerSecond = 0)",
              "Count down to 0, then onTimeUp; optionally earn points.",
            ],
            [
              "startClock(pointsPerSecond = 0)",
              "Count up from 0, for survival or distance scores.",
            ],
            ["stop() / resume()", "Pause or continue the clock only."],
            ["addTime(seconds)", "Time bonus, or a penalty with negative seconds."],
            [
              "awardTimeBonus(pointsPerSecond, expectedSeconds = 0)",
              "Points per whole second saved; returns the score.",
            ],
            [
              "reset(lives = 0, countdownSeconds = 0)",
              "New run with a stopped clock showing the countdown.",
            ],
            ["shownSeconds", "Whole seconds: rounded up counting down, down counting up."],
          ],
        },
        examples: [
          {
            title: "Finish with a time bonus",
            code: `import type { World } from "@nayan-ui/engine";

export function finishLevel(world: World) {
  world.scoreboard.stop(); // freeze the clock before the results screen
  const score = world.scoreboard.awardTimeBonus(10); // 10 points per second left
  return { score, secondsLeft: world.scoreboard.shownSeconds };
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "game-time-timers",
        title: "Game-time timers",
        paragraphs: [
          "world.after(seconds, fn) runs fn after that much update time and returns an id; it pauses whenever the world stops stepping, so never use setTimeout for gameplay delays. cancelTimer(id) drops one (false if it already ran), cancelTimers() drops all of them on reset, and timerCount reports how many wait.",
          "After dispose, after does nothing and returns 0, and pending timers never run.",
        ],
        examples: [
          {
            title: "Spawn a wave later, cancel on reset",
            code: `import type { World } from "@nayan-ui/engine";

export function scheduleWave(world: World) {
  const id = world.after(1.5, () => world.spawn({ mesh: "sphere", position: [3, 2, 0], color: "red" }));
  return {
    cancel: () => world.cancelTimer(id),
    resetRound: () => world.cancelTimers(), // an old round can't act in the new one
  };
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
        note: "A time-up and a lost last life can arrive in the same step: report each run's result only once.",
      },
    ],
  },
  {
    slug: "audio-haptics",
    title: "Audio, impact feedback and haptics",
    description:
      "Play sounds through the engine's mixer and add haptics that respect player settings.",
    sections: [
      {
        id: "sound-banks",
        title: "Load a sound bank",
        paragraphs: [
          "audio.load({ name: source }) returns a SoundBank at once; await bank.ready before relying on it, since plays before then are ignored and failed files are logged and skipped. Sounds are WAV (PCM or float, mono or stereo): URLs on the web, require(...) in React Native.",
        ],
        examples: [
          {
            title: "Web sound bank",
            code: `import { audio } from "@nayan-ui/engine";

export const sfx = audio.load({ coin: "/sounds/coin.wav", music: "/sounds/music.wav" });
await sfx.ready;
sfx.play("coin");`,
            platform: "react",
            language: "tsx",
          },
          {
            title: "React Native sound bank",
            code: `import { audio } from "@nayan-ui/engine";

export const sfx = audio.load({ coin: require("./coin.wav"), music: require("./music.wav") });
await sfx.ready;
sfx.play("coin");`,
            platform: "native",
            language: "tsx",
          },
        ],
      },
      {
        id: "voices",
        title: "Play, loop and stop voices",
        paragraphs: [
          "Playing returns a Voice (or null); keep it and pass it to audio.stop when leaving. A screen owns its loops and stops them on unmount.",
        ],
        table: {
          headers: ["Audio API", "Behavior"],
          rows: [
            ["audio.load(sources)", "SoundBank; each asset decodes once per session."],
            [
              "bank.ready / bank.get(name)",
              "Load promise; the Sound (for impact.sound) or undefined.",
            ],
            [
              "bank.play(name, options) / audio.play(sound, options)",
              "Mixed in Rust; returns a Voice or null.",
            ],
            ["{ volume, pan, pitch, loop }", "0..2, -1..1, speed; defaults 1, 0, 1, false."],
            ["audio.stop(voice)", "Stops one voice; null and undefined are fine."],
            ["audio.enabled / audio.muted", "Global sound switch; muted is its inverse."],
            ["audio.volume", "Master gain, 0..2."],
            ["audio.running", "True once the device's audio output is running."],
          ],
        },
        examples: [
          {
            title: "Background music with cleanup",
            code: `import { useEffect } from "react";
import { audio, type SoundBank } from "@nayan-ui/engine";

export function useMusic(bank: SoundBank<"music">) {
  useEffect(() => {
    const voice = bank.play("music", { volume: 0.35, loop: true });
    return () => audio.stop(voice);
  }, [bank]);
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "settings-and-autoplay",
        title: "Player settings and autoplay",
        paragraphs: [
          "Mirror the player's settings onto audio.enabled and haptics.enabled; both are global switches. On the web, output starts on the first click, touch or key press and suspends in hidden tabs.",
        ],
        examples: [
          {
            title: "Apply feedback settings",
            code: `import { audio, haptics } from "@nayan-ui/engine";

export function applySettings(settings: { enableSounds: boolean; enableHaptics: boolean }) {
  audio.enabled = settings.enableSounds;
  haptics.enabled = settings.enableHaptics;
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "microphone",
        title: "Record from the microphone",
        paragraphs: [
          "microphone keeps the last few seconds of input in the Rust core (maxSeconds, default 10) and reports how loud it is now. microphone.level runs 0 (-60 dBFS or quieter) to 1 (full scale), rises at once and falls back over ~0.15 s, and is cheap enough to read every frame to notice speech starting and stopping. microphone.take(seconds, { skipEnd }) turns the stretch that ended skipEnd seconds ago into an ordinary Sound, with its duration and loudness over time, and forgets what was heard. Play it through the mixer at any pitch (a character repeating you in a squeaky voice), then free it with audio.release. Nothing leaves the device.",
          "Ask first: requestPermission() shows the system prompt once and resolves to whether recording is allowed. iOS needs NSMicrophoneUsageDescription and switches the audio session to play-and-record (to the speaker) while listening, back to ambient after stop(). Android needs android.permission.RECORD_AUDIO in the app's manifest and asks through the current activity. The web asks through getUserMedia with echo cancellation, over HTTPS or localhost, on a page whose Permissions-Policy allows the microphone. state is 'failed' when there's no microphone or no permission; stop() releases it and turns the system's recording indicator off.",
          "A microphone hears the game's own sounds too. Ignore input while the game talks and for a moment after, and take the recording only after the pause that follows speech.",
        ],
        table: {
          headers: ["API", "What it does"],
          rows: [
            ["microphone.supported", "Whether this build can record (false on older app builds)."],
            ["microphone.permission", "'granted', 'undetermined' or 'denied'."],
            [
              "microphone.requestPermission()",
              "The system prompt the first time; resolves to true when allowed.",
            ],
            ["microphone.start({ maxSeconds })", "Starts listening (asynchronously: see state)."],
            ["microphone.state", "'off', 'starting', 'listening' or 'failed'."],
            ["microphone.level / microphone.held", "Loudness now (0..1); seconds of input held."],
            [
              "microphone.take(seconds, { skipEnd, levelsPerSecond })",
              "A Recording: { sound, duration, levels, levelsPerSecond }, or null.",
            ],
            [
              "audio.release(sound) / audio.duration(sound) / audio.levels(sound, perSecond)",
              "Free a runtime sound; its length; its loudness over time (any sound).",
            ],
          ],
        },
        examples: [
          {
            title: "A character that repeats you",
            description:
              "Call listen() when the player turns talking on and step(dt) every frame. When someone speaks and pauses, the character repeats them faster and higher, and doesn't listen to itself meanwhile.",
            code: `import { audio, microphone, type Recording } from "@nayan-ui/engine";

const SPEAKING = 0.45;
let heard = 0,
  quiet = 0,
  deafFor = 0;
let speaking: Recording | null = null;

export async function listen(): Promise<boolean> {
  if (!(await microphone.requestPermission())) return false;
  return microphone.start({ maxSeconds: 8 });
}

export function step(dt: number) {
  if (deafFor > 0) {
    deafFor -= dt;
    if (deafFor <= 0 && speaking) {
      audio.release(speaking.sound);
      speaking = null;
      microphone.take(); // drop what was heard while talking
    }
    return;
  }
  const level = microphone.level;
  if (heard === 0 && level < SPEAKING) return;
  heard += dt;
  quiet = level < SPEAKING ? quiet + dt : 0;
  if (quiet < 0.7) return;
  // Speech then a pause: repeat it without the pause, then stay deaf while talking
  const take = microphone.take(heard + 0.25 - (quiet - 0.1), { skipEnd: quiet - 0.1 });
  heard = quiet = 0;
  if (!take) return;
  audio.play(take.sound, { pitch: 1.7, volume: 1.3 });
  speaking = take;
  deafFor = take.duration / 1.7 + 0.45;
}

export function stopListening() {
  microphone.stop();
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "impact-feedback",
        title: "Collision sounds and haptics",
        paragraphs: [
          "Give an entity impact feedback and the core plays sound and haptics for solid hits with no JS per collision: minSpeed 1, maxSpeed 10, volume 1 and haptic 0 by default. world.listener pans and fades impact sounds relative to that entity.",
          "haptics.enabled doesn't rewrite existing impact options, so update them (or pass impact: null) when settings change.",
        ],
        examples: [
          {
            title: "Settings-aware impacts",
            code: `import type { Entity, Sound, World } from "@nayan-ui/engine";

export function attachImpacts(world: World, ball: Entity, bump: Sound | undefined, sounds: boolean, vibrate: boolean) {
  world.listener = ball;
  world.set(ball, {
    impact: { sound: sounds ? bump : undefined, minSpeed: 1, maxSpeed: 8, volume: 0.6, haptic: vibrate ? 0.5 : 0 },
  });
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "haptics",
        title: "Haptic taps and patterns",
        paragraphs: [
          "iOS and Android use their native haptics; browsers vibrate where supported and skip it otherwise, without intensity or sharpness control.",
        ],
        table: {
          headers: ["Haptics API", "Behavior"],
          rows: [
            ["haptics.enabled", "Global switch for the haptics API."],
            ["haptics.supported", "True when the device has an actuator (false on simulators)."],
            [
              "impact(intensity = 0.6, sharpness = 0.5)",
              "One tap; repeats under 35 ms apart are dropped.",
            ],
            ["selection()", "A light, crisp tick for UI selection."],
            ["notify('success' | 'warning' | 'error')", "The platform's notification pattern."],
            ["play(taps)", "HapticTap[]: time in seconds, intensity and sharpness 0..1."],
          ],
        },
        examples: [
          {
            title: "A reward pattern",
            code: `import { haptics } from "@nayan-ui/engine";

export function reward() {
  if (!haptics.supported) return;
  haptics.notify("success");
  haptics.play([
    { time: 0, intensity: 0.4, sharpness: 0.3 },
    { time: 0.12, intensity: 0.8, sharpness: 0.7 },
  ]);
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
      "Let the engine cache assets, keep frames allocation-free and spread heavy work over frames.",
    sections: [
      {
        id: "automatic-caching",
        title: "Automatic asset caching",
        paragraphs: [
          "You don't need an app cache: each file downloads and decodes once per session, equal geometry shares one registration, and prepared meshes are saved for later launches. Records never expire and aren't evicted; full or denied storage falls back to memory, and corrupt records rebuild.",
          "Disposing a world keeps loaded handles valid. Change the URL (for example ?v=2) when a file's contents change.",
        ],
        table: {
          headers: ["Storage", "Behavior"],
          rows: [
            [
              "React Native",
              "App-private files (Application Support / filesDir), written by Rust.",
            ],
            ["Web", "Binary IndexedDB records; Rust validates keys and checksums."],
            ["Web warm-up", "Up to 64 MiB / 1,024 recent geometry records restored into Rust."],
            ["Lifetime", "Until clearAssetCache, clearing app or site data, or uninstall."],
          ],
        },
        examples: [
          {
            title: "Just call the normal APIs",
            code: `import { block, createShape, loadModel, type World } from "@nayan-ui/engine";

export async function setupLevel(world: World, heroUrl: string) {
  const hero = await loadModel(heroUrl, { fit: 2 }); // decoded once, saved for next launch
  const crate = createShape(block(1, 1, 1)); // equal geometry reuses one mesh id
  world.spawn({ mesh: hero, position: [0, 0, 0] });
  world.spawn({ mesh: crate, position: [2, 0.5, 0], color: "#C8763A" });
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "clear-asset-cache",
        title: "Clear saved assets",
        paragraphs: [
          "clearAssetCache() removes saved geometry, original files and temporary download bytes; call it only from a user action. It rejects when storage can't be cleared, live worlds and handles keep working, and custom ProceduralStorage adapters are left alone.",
        ],
        examples: [
          {
            title: "ClearAssetsButton.tsx",
            code: `import { useState } from "react";
import { clearAssetCache } from "@nayan-ui/engine";

export function ClearAssetsButton() {
  const [message, setMessage] = useState("");
  const clear = () =>
    clearAssetCache().then(
      () => setMessage("Saved assets cleared."),
      () => setMessage("Couldn't clear saved assets."),
    );
  return (
    <div>
      <button onClick={clear}>Clear saved game assets</button>
      <p>{message}</p>
    </div>
  );
}`,
            platform: "react",
            language: "tsx",
          },
          {
            title: "ClearAssetsButton.tsx",
            code: `import { useState } from "react";
import { Button, Text, View } from "react-native";
import { clearAssetCache } from "@nayan-ui/engine";

export function ClearAssetsButton() {
  const [message, setMessage] = useState("");
  const clear = () =>
    clearAssetCache().then(
      () => setMessage("Saved assets cleared."),
      () => setMessage("Couldn't clear saved assets."),
    );
  return (
    <View>
      <Button title="Clear saved game assets" onPress={clear} />
      <Text>{message}</Text>
    </View>
  );
}`,
            platform: "native",
            language: "tsx",
          },
        ],
      },
      {
        id: "procedural-cache",
        title: "Cache expensive factories",
        paragraphs: [
          "new ProceduralCache(revision) saves what a deterministic factory returns (models, arrays and JSON values): get(key, build) restores or builds and saves, and peek(key) restores without building (undefined when missing). Use one revision per game and prefix keys with its folder, so an update rebuilds only that game's records.",
          "The engine's store checksums records in Rust (ProceduralStorage.verified), so restores skip the JS checksum; a custom storage without verified keeps it. stats counts hits and builds, flush() awaits pending writes, and worlds, entities, textures and imported rigs never belong in it.",
        ],
        examples: [
          {
            title: "Five cached tree models",
            code: `import { ProceduralCache, Solid, createSolid } from "@nayan-ui/engine";

const cache = new ProceduralCache("forest:3"); // bump when this game's recipes change

// After warmUpEngine. Later launches restore the saved vertices without tessellating.
export const trees = () =>
  cache.get("forest/trees:5", () =>
    [0, 1, 2, 3, 4].map((i) => {
      const trunk = Solid.cylinder(0.15, 2 + i * 0.3).translate([0, 1 + i * 0.15, 0]).paint([0.4, 0.26, 0.13]);
      const crown = Solid.sphere(0.8 + i * 0.1).translate([0, 2.4 + i * 0.3, 0]).paint([0.3, 0.55, 0.25]);
      return createSolid(trunk.blend(crown, 0.1), { resolution: 32, center: false });
    }),
  );`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "transform-batches",
        title: "Move many entities with world.transforms",
        paragraphs: [
          "Queue per-frame moves in onUpdate with the allocation-free position, rotation, scale, color and transform methods; the world's step applies them all in one native call. Call flush() only when the same onUpdate must read positions, animate or query afterwards.",
          "createTransformBatch() makes an extra batch, such as a cancelable drag preview, that is never flushed for you: flush() commits it and clear() discards it. set(entity, TransformOptions) handles occasional mixed updates but allocates more.",
        ],
        examples: [
          {
            title: "Orbit a swarm",
            code: `import { quat, type Entity, type MutableQuat, type World } from "@nayan-ui/engine";

// Pass the result to GameView's onUpdate; GameView steps the world right after.
export function orbit(world: World, bees: readonly Entity[]) {
  const turn: MutableQuat = [0, 0, 0, 1];
  let time = 0;
  return (dt: number) => {
    time += dt;
    bees.forEach((bee, i) => {
      const angle = time + i;
      quat.y(-angle, turn);
      world.transforms.transform(bee, Math.sin(angle) * 3, 1, Math.cos(angle) * 3, turn[0], turn[1], turn[2], turn[3]);
    });
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
          "New arrays every frame cause garbage-collection stutter on phones, so allocate scratch values once and pass them as out arguments. The returned value is that out object (or null); copy it to keep it past the frame.",
        ],
        table: {
          headers: ["Instead of", "Use"],
          rows: [
            [
              "world.position(e) / worldPosition(e) / velocity(e)",
              "Same call with a reused [x, y, z] out.",
            ],
            ["world.raycast(o, d, max)", "world.raycast(o, d, max, mask, hit)"],
            ["world.pick(x, y)", "world.pick(x, y, hit)"],
            [
              "world.toScreen(p) / screenToWorld(x, y, plane)",
              "Pass a reused [x, y] or [x, y, z] out.",
            ],
            [
              "world.set(e, { rotation: quat.y(a) })",
              "quat.y(a, q), then world.transforms.rotation(e, ...q).",
            ],
            [
              "world.set(e, { position }) for many entities",
              "world.transforms.position(e, x, y, z)",
            ],
          ],
        },
        examples: [
          {
            title: "A ground probe",
            code: `import type { Entity, RaycastHit, Vec3, World } from "@nayan-ui/engine";

const DOWN: Vec3 = [0, -1, 0];

export function groundProbe(world: World, player: Entity, floorLayer: number) {
  const at: [number, number, number] = [0, 0, 0];
  const hit: RaycastHit = { entity: -1 as Entity, distance: 0, normal: [0, 0, 0], point: [0, 0, 0] };
  return () => world.position(player, at) !== null && world.raycast(at, DOWN, 1.05, floorLayer, hit) !== null;
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "frames-and-threads",
        title: "Frames and threads",
        paragraphs: [
          "On iOS and Android the display's clock asks for each 60 Hz frame: onUpdate and the world's step run on the JS thread, then the engine's render thread culls, submits and presents a copy. JS never waits on the GPU, a frame still waiting is replaced rather than queued, and the clock stops in the background.",
          "On the web, requestAnimationFrame drives the same loop. Never add your own requestAnimationFrame or setInterval game loop.",
        ],
        examples: [
          {
            title: "Watch frame timing",
            code: `import { GameView, useWorld } from "@nayan-ui/engine";

export function Scene() {
  const world = useWorld(64, (w) => {
    w.spawn({ mesh: "cube", color: "#33B3FF" });
  });
  // No loop of your own: GameView runs onUpdate (if any), then steps the world, every frame.
  return (
    world && (
      <GameView
        source={world}
        onStats={({ fps, updateMs, renderMs, backend }) => console.log(fps, updateMs, renderMs, backend)}
        style={{ flex: 1 }}
      />
    )
  );
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "still-scenery-backdrop",
        title: "Still scenery and the backdrop layer",
        paragraphs: [
          "Scenery that never moves (a sky, hills and a forest, a board's patterned background) doesn't need drawing every frame. Spawn it with still: true, or spawn a whole scene into world.backdropLayer(capacity) and step that layer once with update(0). GameView draws the layer once into a cached image behind the scene and reuses it, redrawing only when the layer steps, the camera moves, or the light, size or quality change. A heavy still scene then costs one full-screen image a frame: a meadow game went from 19 to 60 fps on a low-end Android tablet.",
          "A still entity keeps a stand-in in its world, so set and despawn work as usual, but it can't have a parent, physics, text or animations, and it can't be picked. Backdrop pixels are drawn behind every live entity and receive no live shadows, so keep anything that moves, or that a live piece passes behind or sinks into (holes, the ground a runner stands on), in the world. A camera that moves every frame redraws the cache every frame, so hold the camera still while you can and only shake it for real events.",
          "GameView reads source.backdrop by default; pass the backdrop prop to draw another RenderSource there. The layer is disposed with its world.",
        ],
        examples: [
          {
            title: "A still forest behind live players",
            description:
              "Run once when the scene is built. The trees are drawn into the cached backdrop; the player stays a live entity in front of them.",
            code: `import type { Entity, Model, World } from "@nayan-ui/engine";

export function buildScene(world: World, tree: Model) {
  const forest = world.backdropLayer(256);
  for (let i = 0; i < 120; i++) {
    const angle = (i / 120) * Math.PI * 2;
    const distance = 18 + (i % 5) * 4;
    forest.spawn({ mesh: tree, position: [Math.cos(angle) * distance, 0, Math.sin(angle) * distance], color: "#6b8f4e" });
  }
  forest.update(0); // writes the layer's matrices and tells GameView to draw it again
  // A single still piece can live in the world itself
  world.spawn({ mesh: "plane", position: [0, -0.01, 0], scale: [80, 1, 80], color: "#a3b86c", still: true });
  return world.spawn({ mesh: "capsule", position: [0, 1, 0], color: "#33B3FF" }); // live, drawn in front
}

export function replaceForest(world: World, previous: Entity[], spawn: (layer: World) => Entity[]) {
  const layer = world.backdropLayer();
  for (const e of previous) layer.despawn(e);
  const next = spawn(layer);
  layer.update(0);
  return next;
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "culling-and-background-loading",
        title: "Culling and background decoding",
        paragraphs: [
          "Rust frustum-culls every instance against the camera, and shadow casters against the light's box, every frame; skinned meshes are never culled. Don't cull scenery in JS. An instance scaled to 0 (a pooled piece put away) is never drawn, small built-in spheres draw with coarser stand-ins, and opaque instances are drawn nearest first so the depth test rejects hidden pixels before shading. Static textures get mip chains and are sampled trilinearly.",
          "loadTexture, loadModel, loadFont and audio.load decode on native background threads, and loaded meshes register with the renderer inside Rust. Start loads together so they decode in parallel.",
        ],
        examples: [
          {
            title: "Load everything in parallel",
            code: `import { audio, loadFont, loadModel, loadTexture, type AssetSource } from "@nayan-ui/engine";

export async function loadAssets(files: { car: AssetSource; road: AssetSource; font: AssetSource; horn: AssetSource }) {
  const sfx = audio.load({ horn: files.horn });
  const [car, road, font] = await Promise.all([
    loadModel(files.car, { fit: 2 }),
    loadTexture(files.road),
    loadFont(files.font),
    sfx.ready,
  ]);
  return { car, road, font, sfx };
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "sliced-loading",
        title: "Slice long setup with afterNextFrame",
        paragraphs: [
          "afterNextFrame(fn) runs fn right after the next frame leaves and returns a cancel function; with no GameView running it falls back to requestAnimationFrame. Do one slice per frame behind a loader, and check ProceduralCache.peek first so a saved result skips the work.",
        ],
        examples: [
          {
            title: "Build a level one row per frame",
            code: `import { afterNextFrame, ProceduralCache } from "@nayan-ui/engine";

const cache = new ProceduralCache("levels:1");
type Level = { heights: number[] };

export function buildLevel(seed: number, onReady: (level: Level) => void): () => void {
  const key = \`levels/terrain:\${seed}\`;
  const saved = cache.peek<Level>(key);
  if (saved) {
    onReady(saved); // restored from an earlier launch, nothing to build
    return () => {};
  }
  const heights: number[] = [];
  let cancel = () => {};
  const step = (row: number) => {
    for (let x = 0; x < 64; x++) heights.push(Math.sin(seed + row * 0.3 + x * 0.2));
    if (row < 63) cancel = afterNextFrame(() => step(row + 1));
    else onReady(cache.get(key, () => ({ heights })));
  };
  cancel = afterNextFrame(() => step(0));
  return () => cancel(); // call on unmount
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
          "Mesh ids are app-wide and never freed, so build meshes once at module scope or behind a cache and spawn many entities from them. One long job stalls Android's Hermes far longer than desktop JavaScript suggests.",
        ],
        table: {
          headers: ["Budget", "Rule"],
          rows: [
            [
              "MAX_MESHES",
              "4096 ids including 16 built-ins: about 4,080 custom meshes per session.",
            ],
            ["getMeshIdLimit()", "One past the highest mesh id in use."],
            ["Meshes", "Never create one per spawn, per size or per frame."],
            [
              "warmUpEngine()",
              "Await before procedural meshes and web worlds; repeat calls are free.",
            ],
            ["World capacity", "Text letters and particles use entity slots too."],
            ["Long jobs", "Keep out of gameplay frames; slice with afterNextFrame."],
            ["Profiling", "Use onStats in a production build on real target devices."],
            ["Drawings", "A DrawingDocument texture costs one texture, not a mesh id."],
          ],
        },
        examples: [
          {
            title: "Report budgets",
            code: `import { MAX_MESHES, getMeshIdLimit, type World } from "@nayan-ui/engine";

export function budgets(world: World) {
  return {
    meshIdsLeft: MAX_MESHES - getMeshIdLimit(),
    entitySlotsLeft: world.capacity - world.count,
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
    slug: "render-source",
    title: "Custom RenderSource integration",
    description: "Draw your own simulation with GameView through the instance-buffer contract.",
    sections: [
      {
        id: "instance-buffer-contract",
        title: "Instance buffer contract",
        paragraphs: [
          "A RenderSource packs instances grouped by mesh: matrices holds a column-major mat4 each, colors an RGBA each, and optional regions a texture rectangle each, in the same order. Only the first count instances draw; capacity sizes the GPU buffers.",
          "ranges holds [first, count] per mesh id: opaque instances at ranges[2 * mesh], transparent ones at ranges[2 * (MAX_MESHES + mesh)]. Meshes must already be registered (built-ins after warmUpEngine, createShape or a loader).",
        ],
        examples: [
          {
            title: "An opaque and a see-through cube",
            code: `import { MAX_MESHES, type RenderSource } from "@nayan-ui/engine";

const CUBE = 0; // built-in cube mesh id

export function twoCubes(): RenderSource {
  const matrices = new Float32Array(32);
  matrices.set([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -1, 0, 0, 1], 0);
  matrices.set([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1], 16);
  const ranges = new Uint32Array(MAX_MESHES * 4);
  ranges.set([0, 1], 2 * CUBE); // opaque: instance 0
  ranges.set([1, 1], 2 * (MAX_MESHES + CUBE)); // transparent: instance 1
  const colors = new Float32Array([1, 0.4, 0.2, 1, 0.2, 0.7, 1, 0.4]);
  return { matrices, colors, ranges, count: 2, capacity: 2 };
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "stepping-a-source",
        title: "Stepping and the view",
        paragraphs: [
          "GameView calls source.update(dt) after onUpdate each frame, unless its updateCount changed during onUpdate or isDisposed is true. setView(viewProj, width, height) receives the camera of each drawn frame for your own picking.",
          "A custom source gets no physics, timers, animation or picking from World, and nativeWorld belongs only to a real World. Prefer World unless you already own a simulation.",
        ],
        examples: [
          {
            title: "A spinning cube source",
            code: `import { MAX_MESHES, type RenderSource } from "@nayan-ui/engine";

export class Spinner implements RenderSource {
  readonly matrices = new Float32Array(16);
  readonly colors = new Float32Array([0.2, 0.7, 1, 1]);
  readonly ranges = new Uint32Array(MAX_MESHES * 4);
  readonly count = 1;
  readonly capacity = 1;
  updateCount = 0;
  private angle = 0;
  constructor() {
    this.ranges.set([0, 1], 0); // built-in cube, instance 0
  }
  update(dt: number) {
    this.updateCount++;
    this.angle += dt;
    const c = Math.cos(this.angle), s = Math.sin(this.angle);
    this.matrices.set([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 1, 0, 1]); // Y rotation
  }
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "draw-a-custom-source",
        title: "Draw it with GameView",
        paragraphs: [
          "Await warmUpEngine so the built-in meshes exist, then pass the source to GameView with a Camera and Light, like a world. A custom source can also be GameView's overlay.",
        ],
        examples: [
          {
            title: "CustomView.tsx",
            code: `import { useEffect, useState } from "react";
import { GameView, warmUpEngine, type Camera, type Light, type RenderSource } from "@nayan-ui/engine";

const camera: Camera = { eye: [0, 3, 6], target: [0, 1, 0], fov: 1 };
const light: Light = { direction: [0.4, 0.8, 0.5], ambient: 0.35, color: "white" };

export function CustomView({ source }: { source: RenderSource }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    void warmUpEngine().then(() => setReady(true));
  }, []);
  return ready ? <GameView source={source} camera={camera} light={light} style={{ flex: 1 }} /> : null;
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
    ],
  },
  {
    slug: "troubleshooting",
    title: "Troubleshooting and deployment",
    description: "Find the fix for common engine problems, then check a build before shipping.",
    sections: [
      {
        id: "setup-and-rendering",
        title: "Setup and rendering",
        paragraphs: [
          "Most blank screens are a missing native build, an unawaited warm-up or a view with no size. Log onError first.",
        ],
        table: {
          headers: ["Symptom", "Fix"],
          rows: [
            [
              "Blank view",
              "Give it a size; check onError, camera direction, entity scale and paused.",
            ],
            [
              "isEngineAvailable is false / core not linked",
              "Expo Go or an old build: make a new development build.",
            ],
            [
              '"await warmUpEngine" error',
              "Await it before new World or procedural meshes; useWorld does it.",
            ],
            [
              "WASM fails with a MIME or HTML error",
              "Serve the real .wasm file as application/wasm from the right path.",
            ],
            ["No WebGPU or audio worklet", "Use HTTPS or localhost; WebGL2 is the fallback."],
            [
              "Paused after navigation",
              "Pass the real focus state to paused and clear held input.",
            ],
          ],
        },
        examples: [
          {
            title: "Guard and log",
            code: `import { GameView, isEngineAvailable, type World } from "@nayan-ui/engine";

export function SafeView({ world }: { world: World }) {
  if (!isEngineAvailable) return null; // show "needs a development build"
  return <GameView source={world} onError={(error) => console.error("Engine:", error.message)} style={{ flex: 1 }} />;
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "worlds-and-frames",
        title: "Worlds, frames and queries",
        paragraphs: [
          "After dispose, cleanup calls and queries are no-ops, but spawn, update, burst and effects throw. Check world.isDisposed after every await before spawning.",
        ],
        table: {
          headers: ["Symptom", "Fix"],
          rows: [
            [
              '"World: used after dispose()"',
              "Check world.isDisposed after awaits; never reuse a disposed world.",
            ],
            [
              "world.transforms moves don't show yet",
              "They apply on the step; flush() first to read them back.",
            ],
            [
              "createTransformBatch moves never apply",
              "Extra batches aren't flushed for you: call flush().",
            ],
            [
              "Game runs at double speed",
              "Remove extra world.update calls and rAF or setInterval loops.",
            ],
            [
              "toScreen / screenToWorld return null",
              "Needs a drawn frame; null also means behind camera or edge-on.",
            ],
            [
              "Blank Android screenshot",
              "Use captureScreen(..., { handleGLSurfaceViewOnAndroid: true }).",
            ],
          ],
        },
        examples: [
          {
            title: "Spawn safely after an await",
            code: `import { loadModel, type World } from "@nayan-ui/engine";

export async function addBoss(world: World, url: string) {
  const boss = await loadModel(url, { fit: 3 });
  if (world.isDisposed) return null; // the screen closed while loading
  return world.spawn({ mesh: boss, position: [0, 0, -8] });
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "assets-and-feedback",
        title: "Assets, animation and feedback",
        paragraphs: [
          "When a clip or asset fails, print what the model actually contains before changing code.",
        ],
        table: {
          headers: ["Symptom", "Fix"],
          rows: [
            [
              "Bundled asset fails in an Android release",
              "Install expo-asset, add glb/gltf to assetExts, test a release build.",
            ],
            ["Web asset is a number", "Use URL strings on the web instead of require(...)."],
            [
              "Clip doesn't play",
              "Check model.animations names; export clips into a self-contained GLB.",
            ],
            ["Model at the wrong origin", "Review center, fit and the model's own coordinates."],
            [
              "pick returns null",
              "Wait for a drawn frame, use view coordinates, keep pickable true.",
            ],
            [
              "No sound on the web",
              "Output starts on the first click, touch or key; await bank.ready.",
            ],
            ["No vibration", "Check haptics.enabled and haptics.supported; simulators have none."],
            ["Out of entities", "Raise capacity; text letters and particles take slots."],
            ["Out of mesh ids", "A mesh is built per spawn or frame: build once (getMeshIdLimit)."],
            [
              "Loader freezes on first launch",
              "Slice the job with afterNextFrame and cache it with ProceduralCache.",
            ],
          ],
        },
        examples: [
          {
            title: "Name the clips when one fails",
            code: `import type { Entity, LoadedModel, World } from "@nayan-ui/engine";

export function play(world: World, actor: Entity, model: LoadedModel, clip: string) {
  if (!world.playClip(actor, clip)) {
    console.warn(\`No clip "\${clip}". Available: \${model.animations.map((a) => a.name).join(", ")}\`);
  }
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "production-checklist",
        title: "Production checklist",
        paragraphs: [
          "Test production builds on real devices: a rebuilt engine library doesn't prove the installed app binary was rebuilt.",
        ],
        table: {
          headers: ["Check", "What to verify"],
          rows: [
            ["Web", "Production build over HTTP: asset URLs, .wasm MIME, WebGPU and WebGL2."],
            ["Input and layout", "Resizing, tap, pinch and overlay touches."],
            ["Lifecycle", "Pause, resume, hidden tabs and backgrounding the app."],
            ["Feedback", "First-interaction audio, sound and haptics settings."],
            ["Native", "Fresh iOS and Android builds after engine or config changes."],
            ["Runs", "Each run reports once, including cancel, and cleans up."],
          ],
        },
        examples: [
          {
            title: "Serve a production web build",
            description:
              "Vite shown; serve any framework's built output the same way, then test on real devices.",
            code: `bun run build        # vite build
bunx vite preview    # serves dist/ as production will`,
            platform: "shell",
            language: "bash",
          },
        ],
      },
    ],
  },
];
