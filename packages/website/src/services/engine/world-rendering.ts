import type { EngineGuide } from "./types";

export const WorldRenderingGuides: EngineGuide[] = [
  {
    slug: "world-entities",
    title: "Worlds, entities and lifecycle",
    description: "Own a world, spawn and change entities, and dispose them safely.",
    sections: [
      {
        id: "lifecycle",
        title: "Lifecycle in five rules",
        paragraphs: [
          "useWorld and GameView make a complete scene; these five rules keep it leak-free and crash-free.",
          "1. Own the world with useWorld(capacity, setup), or create it in an effect after await warmUpEngine(); never during render or at module scope.",
          "2. GameView steps the world right after onUpdate; call world.update(dt) yourself only to step differently, and GameView then skips its step (it watches world.updateCount).",
          "3. Queue per-frame moves on world.transforms in onUpdate; the step applies them, so call flush() only before reading positions back.",
          "4. Dispose the world on unmount (useWorld does) and release your subscriptions with it.",
          "5. Check world.isDisposed instead of keeping a flag: afterwards set, despawn, has, animate, stopAnimation, impulse, clips, timers, queries and forEachCollision are no-ops, while spawn and update throw.",
        ],
        examples: [
          {
            title: "SpinningCube.tsx",
            description:
              "A complete scene: useWorld owns the world, onUpdate queues the spin and GameView steps the world after it.",
            code: `import { useRef } from "react";
import { GameView, quat, useWorld, type Entity, type MutableQuat } from "@nayan-ui/engine";

const turn: MutableQuat = [0, 0, 0, 1]; // reused every frame

export function SpinningCube() {
  const cube = useRef<Entity | null>(null);
  const angle = useRef(0);
  const world = useWorld(64, (w) => {
    cube.current = w.spawn({ mesh: "cube", color: "#33B3FF" });
  });
  if (!world) return null; // ready after warm-up (one frame)
  return (
    <GameView source={world} style={{ flex: 1 }} camera={{ eye: [0, 2, 5], target: [0, 0, 0], fov: 0.9 }}
      onUpdate={(dt) => {
        if (!cube.current) return;
        angle.current += dt;
        quat.y(angle.current, turn);
        world.transforms.rotation(cube.current, turn[0], turn[1], turn[2], turn[3]);
      }} />
  );
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
        note: "World has no start, pause or reset method: pause with GameView's paused prop, and reset with your own function.",
      },
      {
        id: "spawn-set-despawn",
        title: "Spawn, set and despawn",
        paragraphs: [
          "new World(capacity) reserves slots for entities, text letters and particles; spawn returns an Entity handle and throws when the world is full or an option is invalid.",
          "set(entity, options) changes only what you pass (null removes) and returns false if the entity is gone. despawn removes an entity with its children; has and count report what is alive.",
        ],
        examples: [
          {
            title: "Spawn, change and remove",
            code: `import { quat, type World } from "@nayan-ui/engine";

export function addPlayer(world: World) {
  const player = world.spawn({ mesh: "capsule", position: [0, 1, 0], color: "#4DB3FF" });
  world.set(player, { scale: [1, 1.5, 1], rotation: quat.y(Math.PI / 2) });
  world.set(player, { bob: null }); // null removes an option
  console.log(world.count, world.has(player));
  return () => world.despawn(player);
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "entity-options",
        title: "EntityOptions reference",
        paragraphs: [
          "spawn and set take the same EntityOptions; in set, null removes physics, parent, follow, bob, lifetime and impact.",
        ],
        table: {
          headers: ["Option", "Behavior"],
          rows: [
            [
              "mesh",
              "Built-in Shape or loaded Model; default cube. none draws nothing (groups, pivots).",
            ],
            [
              "texture / textureRegion",
              "Texture or null; atlas rect [u0, v0, u1, v1]. In set, pass mesh too.",
            ],
            ["text / font", "3D text (1 unit tall at scale 1) instead of a mesh; needs font."],
            [
              "align / letterSpacing / tabular",
              "Text alignment (default center), extra em spacing, equal-width digits.",
            ],
            ["position / rotation", "Vec3 and quat [x, y, z, w]; relative to the parent."],
            ["scale", "Number or Vec3; visual only once a body exists."],
            ["color", "CSS string or 0..1 tuple; alpha < 1 is see-through, channels > 1 glow."],
            [
              "velocity / groundVelocity",
              "Units per second; groundVelocity sets [x, z] and keeps vertical speed.",
            ],
            [
              "acceleration / spin",
              "Units/s² for non-dynamic entities; radians per second per axis.",
            ],
            ["bob", "{ amplitude, speed, phase? }: visual sine offset of the drawn position."],
            ["follow", "{ target, speed }: chase an entity along the ground."],
            ["lifetime", "Seconds until it shrinks away and despawns."],
            ["parent", "Attach to an entity: moves, turns, scales and despawns with it."],
            ["physics / impact", "BodyType or PhysicsOptions; automatic impact sound and haptic."],
            ["pickable", "Whether pick can hit it; default true."],
          ],
        },
        examples: [
          {
            title: "Reusable options",
            code: `import type { EntityOptions, World } from "@nayan-ui/engine";

const coin: EntityOptions = {
  mesh: "cylinder",
  scale: [0.6, 0.1, 0.6],
  color: "#FFC83D",
  spin: [0, 3, 0],
  bob: { amplitude: [0, 0.2, 0], speed: 4 },
  pickable: false,
};

export function dropCoin(world: World, x: number, z: number) {
  return world.spawn({ ...coin, position: [x, 1, z], lifetime: 10 });
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "quat",
        title: "Rotations with quat",
        paragraphs: [
          "Rotations are quaternions [x, y, z, w] built with quat, with angles in radians. Every helper takes an optional out array; reuse one in per-frame code so nothing allocates.",
        ],
        table: {
          headers: ["Helper", "Result"],
          rows: [
            ["quat.identity", "No rotation (frozen)."],
            ["quat.x / y / z(angle, out?)", "Pitch, yaw (heading) or roll; z spins 2D games."],
            ["quat.axisAngle(x, y, z, angle, out?)", "Rotation around a unit axis."],
            ["quat.multiply(a, b, out?)", "a after b (b turns first); out may be a or b."],
            ["quat.fromEuler(x, y, z, out?)", "Turns around x, then y, then z."],
            ["quat.slerp(a, b, t, out?)", "Shortest-path blend from a (t = 0) to b (t = 1)."],
          ],
        },
        examples: [
          {
            title: "Turn smoothly toward travel",
            description: "Call the returned function from onUpdate; it allocates nothing.",
            code: `import { quat, type Entity, type MutableQuat, type World } from "@nayan-ui/engine";

export function makeSteering(world: World, actor: Entity) {
  const current: MutableQuat = [0, 0, 0, 1];
  const target: MutableQuat = [0, 0, 0, 1];
  return (dt: number, x: number, z: number) => {
    if (x || z) quat.y(Math.atan2(x, z), target); // face +z toward (x, z)
    quat.slerp(current, target, Math.min(1, dt * 10), current);
    world.transforms.rotation(actor, current[0], current[1], current[2], current[3]);
  };
}

export const tilted = quat.multiply(quat.y(Math.PI / 4), quat.x(-0.3)); // tilt, then turn`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "transforms",
        title: "Per-frame moves with world.transforms",
        paragraphs: [
          "world.transforms queues draw-only position, rotation, scale, color and transform updates without allocating; the next world.update applies them in one native call.",
          "Call flush() only before reading positions or animating in the same frame; set(entity, options) takes the object form. Use world.set for text entities.",
        ],
        examples: [
          {
            title: "Move many pieces in one call",
            description: "Call from onUpdate; GameView's step applies the batch.",
            code: `import type { Entity, World } from "@nayan-ui/engine";

type Piece = { entity: Entity; x: number; z: number };

export function placePieces(world: World, pieces: readonly Piece[], time: number) {
  const batch = world.transforms;
  for (const p of pieces) {
    batch.position(p.entity, p.x, Math.sin(time + p.x) * 0.2, p.z);
    batch.scale(p.entity, 1 + Math.sin(time) * 0.05);
  }
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "parenting",
        title: "Parents and groups",
        paragraphs: [
          "Children inherit their parent's position, rotation and scale and despawn with it. Put physics on the parent: attached entities can't have bodies.",
        ],
        examples: [
          {
            title: "Compose a collectible",
            code: `import type { World } from "@nayan-ui/engine";

export function addCollectible(world: World) {
  const root = world.spawn({ mesh: "none", position: [2, 1, 0], spin: [0, 1, 0] });
  world.spawn({ mesh: "torus", parent: root, scale: 0.8, color: "orange" });
  world.spawn({ mesh: "sphere", parent: root, scale: 0.3, color: "#FFF080" });
  return root; // despawn(root) removes all three
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "queries-and-settings",
        title: "Queries, bounds and gravity",
        paragraphs: [
          "position (parent-relative), worldPosition (as drawn) and velocity return null once an entity is gone; pass an out tuple per frame. toScreen and screenToWorld use the last drawn camera, so they return null before the first frame.",
          "world.bounds = [minX, minZ, maxX, maxZ] keeps non-physics entities inside; bodies need walls. world.gravity defaults to [0, -9.81, 0], and world.listener pans impact sounds.",
        ],
        examples: [
          {
            title: "Read state without allocating",
            code: `import type { Entity, World } from "@nayan-ui/engine";

export function makeTracker(world: World, player: Entity, onFall: () => void) {
  const at: [number, number, number] = [0, 0, 0];
  const screen: [number, number] = [0, 0];
  world.bounds = [-20, -20, 20, 20];
  world.listener = player;
  return () => {
    if (world.position(player, at) && at[1] < -5) onFall();
    return world.toScreen(at, screen); // place a label over the player
  };
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "reset-and-dispose",
        title: "Reset and dispose",
        paragraphs: [
          "A reset is your own function: cancelTimers(), despawn the round's entities, reset the scoreboard and spawn the next round in the same world. Loaded assets and mesh ids stay valid.",
          "dispose() is idempotent, resolves pending animation promises and drops timers. Code that spawns after an await checks world.isDisposed; cleanup calls need no guard.",
        ],
        examples: [
          {
            title: "Spawn safely after an await",
            code: `import type { Entity, World } from "@nayan-ui/engine";

export async function popAndReplace(world: World, piece: Entity) {
  await world.animate(piece, { scale: 0 }, { duration: 0.2 });
  world.despawn(piece); // safe even if the screen closed
  if (world.isDisposed) return null; // spawn would throw
  return world.spawn({ mesh: "cube", position: [0, 4, 0] });
}

export function resetRound(world: World, actors: Entity[]) {
  world.cancelTimers();
  for (const actor of actors.splice(0)) world.despawn(actor);
  world.scoreboard.reset(3);
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
    ],
  },
  {
    slug: "game-view",
    title: "GameView, quality and overlays",
    description: "Draw a world, run the frame loop, choose quality and layer overlays.",
    sections: [
      {
        id: "props",
        title: "GameView props",
        paragraphs: [
          "GameView draws a RenderSource (usually a World) and calls onUpdate once a frame. Other props are read live; changing source restarts the view.",
        ],
        table: {
          headers: ["Prop", "Behavior"],
          rows: [
            ["source", "Required RenderSource; never pass a disposed world."],
            ["onUpdate(dt)", "Game logic per frame; GameView steps source and overlay after it."],
            ["camera / light", "Mutable Camera and Light objects, read every frame."],
            ["background / fog", "Sky and fog color (CSS or tuple); fog density, default 0."],
            ["quality", "auto (default), high, medium, low or lowest."],
            ["paused", "Stops updates and drawing, cancels gestures, keeps the surface."],
            ["style", "ViewStyle on React Native; CSS properties on the web."],
            ["onTap / onLongPress", "(x, y) in view points; world.pick(x, y) finds the entity."],
            [
              "onSwipe / onDrag / onPinch",
              "Flick direction, drag phases and two-finger scale/rotation.",
            ],
            ["onPrimaryAction", "Keyboard primary action, such as Start or Play Again."],
            [
              "overlay / onOverlayTouch",
              "Screen-space RenderSource drawn on top, and its touch handler.",
            ],
            ["onStats", "GameViewStats once a second."],
            ["onError", "Setup and rendering errors; default console.error."],
          ],
        },
        examples: [
          {
            title: "Scene.tsx",
            code: `import { GameView, useWorld } from "@nayan-ui/engine";

export function Scene() {
  const world = useWorld(100, (w) => {
    w.spawn({ mesh: "plane", scale: [20, 1, 20], color: "#4C9A4C", physics: "fixed" });
    w.spawn({ mesh: "sphere", position: [0, 4, 0], color: "#3399FF", physics: "dynamic" });
  });
  if (!world) return null;
  return (
    <GameView source={world} style={{ flex: 1 }} background="#87CEEB" quality="auto"
      camera={{ eye: [0, 8, 14], target: [0, 0, 0], fov: Math.PI / 3 }}
      onTap={(x, y) => {
        const hit = world.pick(x, y);
        if (hit) world.impulse(hit.entity, [0, 6, 0]);
      }} />
  );
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "frames",
        title: "Frames and dt",
        paragraphs: [
          "On iOS and Android frames come from the display clock at 60 Hz: onUpdate steps the game and hands a copy to the engine's render thread, so JavaScript never waits on the GPU. A frame not yet drawn is replaced by a newer one, not queued; the web uses requestAnimationFrame.",
          "dt is capped at 0.1 s and is 0 until the first frame is on screen, so intros don't play unseen. Step the world yourself only for a different dt, such as slow motion.",
        ],
        examples: [
          {
            title: "SlowMotion.tsx",
            description:
              "Calling world.update in onUpdate replaces GameView's own step for that frame (updateCount changed).",
            code: `import { GameView, type World } from "@nayan-ui/engine";

export function SlowMotion({ world, slow }: { world: World; slow: boolean }) {
  return (
    <GameView source={world} style={{ flex: 1 }}
      onUpdate={(dt) => {
        if (slow) world.update(dt * 0.25); // GameView skips its step this frame
      }} />
  );
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
        note: "afterNextFrame(fn) runs fn right after the next frame leaves, the best moment for sliced loading; it returns a cancel function.",
      },
      {
        id: "quality",
        title: "Render quality",
        paragraphs: [
          "auto starts at high and steps down only while drawing can't keep up: after one second under ~33 fps, or three seconds missing ~50 fps while drawing takes most of the frame (a slow game loop isn't helped by drawing less, and shows in updateMs). It drops shadow-edge filtering first, then shadows and MSAA, then resolution. It climbs back after ten smooth seconds, or after two when the render thread uses at most 10 ms a frame; a level that fails again soon after being restored becomes the ceiling, so it never bounces.",
          "qualityKey (a game's id) remembers the level auto settles on in the engine's durable store, so every later view with that key, after restarts too, starts there instead of at high. adaptQuality={false} while what's on screen isn't the game in play (a ready screen, a menu, a results card): its cost says nothing about the game and would otherwise be remembered for the next visit.",
          "Shadows are drawn only from full-resolution maps: a low-resolution map's smeared edges look worse than none. Lower levels skip the shadow pass instead. A level's pixel cap shrinks only the scene, which is stretched over the full-resolution screen before the overlay draws, so HUD text stays crisp; lowest smooths that stretch with FXAA.",
        ],
        table: {
          headers: ["Level", "Pixel cap", "MSAA", "Shadows"],
          rows: [
            ["high", "ratio 3", "4×", "2048 map, soft (hardware 2×2 PCF, four taps)"],
            ["medium", "ratio 3", "4×", "2048 map, one filtered tap"],
            ["low", "ratio 3", "off", "off"],
            ["lowest", "ratio 2, 0.8 MP, FXAA", "off", "off"],
          ],
        },
        examples: [
          {
            title: "Battery saver",
            code: `import { GameView, type RenderQualitySetting, type World } from "@nayan-ui/engine";

export function Game({ world, saver }: { world: World; saver: boolean }) {
  const quality: RenderQualitySetting = saver ? "low" : "auto";
  return <GameView source={world} quality={quality} style={{ flex: 1 }} />;
}`,
            platform: "shared",
            language: "tsx",
          },
          {
            title: "Adapt to the game in play, and remember it per game",
            description:
              "Use in a game screen with a ready screen and a results card. Auto quality only judges frames while the game is played, and the next visit starts at the level it settled on.",
            code: `import { GameView, type World } from "@nayan-ui/engine";

export function GameScreen({ world, gameId, playing, over }: { world: World; gameId: string; playing: boolean; over: boolean }) {
  return <GameView source={world} qualityKey={gameId} adaptQuality={playing && !over} style={{ flex: 1 }} />;
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "stats",
        title: "Frame statistics",
        paragraphs: [
          "onStats receives GameViewStats once a second. On iOS and Android fps counts frames actually presented and renderMs is the render thread's time per frame.",
        ],
        table: {
          headers: ["Field", "Meaning"],
          rows: [
            ["fps", "Frames per second (presented frames on native)."],
            ["updateMs", "Mean milliseconds in onUpdate and the step."],
            [
              "publishMs",
              "Mean JS-thread milliseconds handing the frame and overlay to the renderer (copying only, with a render thread).",
            ],
            ["renderMs", "Mean milliseconds drawing (render thread on native, CPU side on web)."],
            ["quality", "Level drawn with; with auto, where it settled so far."],
            ["backend", "metal, vulkan or gl on native; webgpu or gl on the web."],
          ],
        },
        examples: [
          {
            title: "Log rendering cost",
            code: `import { GameView, type GameViewStats, type World } from "@nayan-ui/engine";

const log = ({ fps, updateMs, renderMs, quality, backend }: GameViewStats) =>
  console.log(\`\${fps.toFixed(0)} fps, update \${updateMs.toFixed(1)} ms, render \${renderMs.toFixed(1)} ms, \${quality}, \${backend}\`);

export function Profiled({ world }: { world: World }) {
  return <GameView source={world} onStats={log} onError={(e) => console.error(e.message)} />;
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "overlay",
        title: "Overlays",
        paragraphs: [
          "overlay draws a second World in view points from the top-left, y up (visible y ≤ 0) and z within -100..100. It is unlit, always in front and stepped after onUpdate like the scene.",
          'Return true from onOverlayTouch("start") to claim a touch: its moves and end then go to the overlay, never to scene gestures. "cancel" arrives when the system takes the touch.',
        ],
        examples: [
          {
            title: "Overlay button",
            code: `import { GameView, type World } from "@nayan-ui/engine";

export function WithHud({ world, hud, onStart }: { world: World; hud: World; onStart: () => void }) {
  const inside = (x: number, y: number) => x >= 20 && x <= 140 && y >= 20 && y <= 70;
  return (
    <GameView source={world} overlay={hud} style={{ flex: 1 }}
      onOverlayTouch={(phase, x, y) => {
        if (phase === "start") return inside(x, y);
        if (phase === "end" && inside(x, y)) onStart();
        return true;
      }} />
  );
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "pause",
        title: "Pause",
        paragraphs: [
          "paused stops onUpdate, stepping and drawing and cancels gestures while the surface stays mounted. The view also suspends itself when the app goes to the background.",
        ],
        examples: [
          {
            title: "Pause behind a settings sheet",
            code: `import { GameView, type World } from "@nayan-ui/engine";

export function Paused({ world, settingsOpen }: { world: World; settingsOpen: boolean }) {
  return <GameView source={world} paused={settingsOpen} style={{ flex: 1 }} />;
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
    ],
  },
  {
    slug: "camera-lighting",
    title: "Camera, light and fog",
    description: "Aim, follow and shake the camera, and light and color the scene.",
    sections: [
      {
        id: "camera",
        title: "Perspective and orthographic",
        paragraphs: [
          "A Camera has mutable eye and target tuples and a vertical fov in radians. ortho (half the visible height in world units) makes it orthographic and overrides fov.",
          "Mutate the object from onUpdate; GameView reads it every frame. Keep a tiny offset for straight-down views so eye and target never align vertically.",
        ],
        examples: [
          {
            title: "Two cameras",
            code: `import type { Camera } from "@nayan-ui/engine";

export const perspective: Camera = { eye: [8, 6, 12], target: [0, 1, 0], fov: Math.PI / 3 };
export const board: Camera = { eye: [0, 20, 0.01], target: [0, 0, 0], fov: 1, ortho: 6 };

export function orbit(camera: Camera, time: number) {
  camera.eye[0] = Math.sin(time) * 12;
  camera.eye[2] = Math.cos(time) * 12;
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "follow-shake",
        title: "Follow and shake",
        paragraphs: [
          "camera.follow = { target, offset, smoothing? } eases the target toward the entity's drawn position and keeps the eye at offset. smoothing is roughly the catch-up time in seconds (default 0.15, 0 is rigid); null returns control.",
          "camera.shake is a strength in world units that fades by itself.",
        ],
        examples: [
          {
            title: "Chase and hit feedback",
            code: `import type { Camera, Entity } from "@nayan-ui/engine";

export function chase(camera: Camera, player: Entity) {
  camera.follow = { target: player, offset: [0, 4, 7], smoothing: 0.12 };
}
export function onHit(camera: Camera) {
  camera.shake = 0.3;
}
export function release(camera: Camera) {
  camera.follow = null;
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "light",
        title: "Directional light",
        paragraphs: [
          "One directional light with ambient fill and a shadow map centred on the camera target. A small shadowExtent clips distant shadows; a large one blurs them.",
        ],
        table: {
          headers: ["Light field", "Behavior"],
          rows: [
            ["direction", "Toward the light; need not be normalized."],
            ["ambient", "0..1 ambient term."],
            ["color", "CSS or tuple multiplying sun and ambient; glowing colors unaffected."],
            ["shadows", "Cast shadows; default true."],
            ["shadowExtent", "Half-size of the shadowed area in world units; default 30."],
          ],
        },
        examples: [
          {
            title: "Moonlit scene",
            code: `import { GameView, type Light, type World } from "@nayan-ui/engine";

const moon: Light = { direction: [-0.5, 0.8, 0.3], ambient: 0.3, color: "#5A61A0", shadowExtent: 24 };

export function Night({ world }: { world: World }) {
  return <GameView source={world} light={moon} background="#0B1020" style={{ flex: 1 }} />;
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "background-fog",
        title: "Background and fog",
        paragraphs: [
          "background is the clear color (CSS or tuple, alpha ignored; default dark navy) and also the fog color. fog is the density toward it, such as 0.02; default 0.",
        ],
        examples: [
          {
            title: "Hazy horizon",
            code: `import { GameView, type World } from "@nayan-ui/engine";

export function Haze({ world }: { world: World }) {
  return <GameView source={world} background="rgb(200, 215, 230)" fog={0.03} style={{ flex: 1 }} />;
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "front-light",
        title: "Flat boards with frontLight",
        paragraphs: [
          "frontLight(direction, ambient) lights camera-facing surfaces at exactly 1, so flat tiles show their exact theme color while rounded shapes keep shading. It turns shadows off; pair it with a camera looking down -z.",
        ],
        examples: [
          {
            title: "Puzzle board",
            code: `import { GameView, frontLight, type World } from "@nayan-ui/engine";

const light = frontLight([-0.45, 0.6, 1], 0.5);

export function Board({ world }: { world: World }) {
  return (
    <GameView source={world} light={light} background="#F4F1EA" style={{ flex: 1 }}
      camera={{ eye: [0, 0, 50], target: [0, 0, 0], fov: 1, ortho: 10 }} />
  );
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "colors",
        title: "Colors and toColor",
        paragraphs: [
          "Every color option takes '#RGB', '#RGBA', '#RRGGBB', '#RRGGBBAA', 'rgb(…)', 'rgba(…)', a name (transparent, black, white, red, green, blue, yellow, orange, purple, gray, grey) or a 0..1 tuple. Tuple channels above 1 glow, and at 2 ignore light and shadow.",
          "toColor(color, alpha?) returns the [r, g, b, a] tuple, for when you need the numbers. Unknown strings throw.",
        ],
        examples: [
          {
            title: "Brighten a theme color",
            code: `import { toColor, type World } from "@nayan-ui/engine";

const [r, g, b] = toColor("#FF4757");
export const ember = [r * 2, g * 2, b * 2] as const; // self-lit glow
export const ghost = toColor("#FF4757", 0.4); // see-through

export function addLamp(world: World) {
  return world.spawn({ mesh: "sphere", color: ember, position: [0, 3, 0] });
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
    ],
  },
  {
    slug: "physics-collisions",
    title: "Physics, collisions and raycasts",
    description: "Add rigid bodies, sensors, layers, impulses and raycasts.",
    sections: [
      {
        id: "bodies",
        title: "Bodies and colliders",
        paragraphs: [
          "dynamic bodies move under gravity and contact, kinematic ones are moved by you and push dynamic ones, and fixed ones never move. The collider matches the mesh (models get a box) and is sized from the entity when the body is created.",
          "Later scale changes don't resize it, so set explicit sizes for gameplay volumes. set(entity, { physics: null }) removes the body.",
        ],
        examples: [
          {
            title: "Floor, ball and paddle",
            code: `import type { World } from "@nayan-ui/engine";

export function setupPhysics(world: World) {
  world.spawn({ mesh: "cube", position: [0, -0.5, 0], scale: [30, 1, 30], physics: "fixed" });
  const ball = world.spawn({ mesh: "sphere", position: [0, 5, 0], physics: { type: "dynamic", bounce: 0.6 } });
  const paddle = world.spawn({ mesh: "cube", position: [0, 0.5, 4], scale: [3, 0.5, 0.5], physics: "kinematic" });
  return { ball, paddle };
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "physics-options",
        title: "PhysicsOptions reference",
        paragraphs: ["physics takes a BodyType string for defaults, or PhysicsOptions."],
        table: {
          headers: ["Option", "Behavior"],
          rows: [
            ["type", "dynamic, kinematic or fixed."],
            ["shape", "ball, box, cylinder, capsule or cone; default matches the mesh."],
            ["radius / height", "Ball, cylinder, capsule or cone radius and total height."],
            ["size", "Full box size Vec3; default the entity's size."],
            ["layer / mask", "Layer bits (default 1) and layers it meets (default all)."],
            ["sensor", "Reports touches without pushing."],
            ["friction / bounce / density", "Defaults 0.5, 0 (0..1) and 1 (mass per volume)."],
            ["drag / angularDrag", "Linear and spin damping; defaults 0 and 0.05."],
            ["gravityScale", "Multiplier on world gravity; default 1."],
            ["upright", "Never tumbles (characters)."],
            ["ccd", "Stops fast, small bodies passing through walls."],
            ["planar", "2D: stays in XY and spins around z; camera looks down -z."],
          ],
        },
        examples: [
          {
            title: "Character capsule",
            code: `import type { PhysicsOptions, World } from "@nayan-ui/engine";

const body: PhysicsOptions = {
  type: "dynamic", shape: "capsule", radius: 0.4, height: 1.8,
  upright: true, ccd: true, friction: 0.2, drag: 0.5,
};

export function addHero(world: World) {
  return world.spawn({ mesh: "capsule", position: [0, 2, 0], scale: [0.8, 1.8, 0.8], physics: body });
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "move-bodies",
        title: "Steer and push",
        paragraphs: [
          "groundVelocity sets horizontal [x, z] speed and keeps the vertical one, so a steered body still falls. impulse(entity, vec) is a one-off push for dynamic bodies: jumps, knockback.",
        ],
        examples: [
          {
            title: "Steer and jump",
            description: "Call steer from onUpdate with joystick input.",
            code: `import type { Entity, World } from "@nayan-ui/engine";

export function steer(world: World, player: Entity, x: number, z: number) {
  world.set(player, { groundVelocity: [x * 6, z * 6] });
}
export function jump(world: World, player: Entity) {
  world.impulse(player, [0, 5, 0]);
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "sensors-layers",
        title: "Sensors, layers and masks",
        paragraphs: [
          "A sensor reports touches but never pushes: pickups and trigger zones. Two colliders interact when either one's mask includes the other's layer.",
        ],
        examples: [
          {
            title: "Pickup on its own layer",
            code: `import type { World } from "@nayan-ui/engine";

export const PLAYER = 2;
export const PICKUP = 4;

export function addPickup(world: World, x: number, z: number) {
  return world.spawn({
    mesh: "sphere", position: [x, 1, z], color: "yellow",
    physics: { type: "fixed", shape: "ball", radius: 0.7, sensor: true, layer: PICKUP, mask: PLAYER },
  });
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "collisions",
        title: "Collision events",
        paragraphs: [
          "forEachCollision in onUpdate visits the touches that started or ended during the last step. CollisionInfo (started, sensor, speed) is reused, and either entity may already be despawned by an earlier callback.",
        ],
        examples: [
          {
            title: "Collect pickups",
            description: "Call from onUpdate; GameView steps the world right after.",
            code: `import type { Entity, World } from "@nayan-ui/engine";

export function collect(world: World, player: Entity, pickups: Set<Entity>) {
  world.forEachCollision((a, b, info) => {
    if (!info.started || !info.sensor) return;
    const other = a === player ? b : b === player ? a : null;
    if (other === null || !pickups.delete(other)) return;
    world.despawn(other);
    world.scoreboard.add(100);
  });
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "raycast",
        title: "Raycasts",
        paragraphs: [
          "raycast(origin, direction, maxDistance, mask?, out?) returns the first solid, non-sensor collider as of the last step, as { entity, distance, normal, point }, or null. Reuse an out hit per frame.",
        ],
        examples: [
          {
            title: "Ground probe",
            code: `import type { World } from "@nayan-ui/engine";

export function groundHeight(world: World, x: number, y: number, z: number) {
  const hit = world.raycast([x, y + 1, z], [0, -1, 0], 20, 1);
  return hit ? hit.point[1] : null;
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "impact",
        title: "Impact feedback",
        paragraphs: [
          "impact makes the core play a sound and haptic by itself when the entity hits something solid, scaled by speed. Sounds pan relative to world.listener; leave impact off when the player muted sounds.",
        ],
        table: {
          headers: ["ImpactFeedback", "Behavior"],
          rows: [
            ["sound", "A loaded Sound; omit for haptics only."],
            ["minSpeed / maxSpeed", "Silent below; full strength at; defaults 1 and 10."],
            ["volume", "Volume at full strength, 0..2; default 1."],
            ["haptic", "Vibration at full strength, 0..1; default 0."],
          ],
        },
        examples: [
          {
            title: "Bouncing crate",
            code: `import type { Sound, World } from "@nayan-ui/engine";

export function addCrate(world: World, thud: Sound, sounds: boolean) {
  return world.spawn({
    mesh: "cube", position: [0, 6, 0], physics: "dynamic",
    impact: sounds ? { sound: thud, minSpeed: 2, maxSpeed: 12, haptic: 0.4 } : null,
  });
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
    ],
  },
  {
    slug: "animation",
    title: "Animation and springs",
    description: "Tween, keyframe and spring entities in Rust, awaiting their completion.",
    sections: [
      {
        id: "animate",
        title: "Animate and await",
        paragraphs: [
          "world.animate(targets, to, options?) runs in Rust and returns a promise that resolves when every part finishes, is replaced or stopped, or its entity or world goes. Resolution means it ended, not that it reached the target.",
          "Each property runs on its own channel, so a piece can move while it pulses; animating a property again replaces only that one.",
        ],
        table: {
          headers: ["AnimateTarget", "Behavior"],
          rows: [
            ["position / rotation", "Move to a Vec3; turn to a quat."],
            ["scale / color", "Number or Vec3; CSS color or tuple."],
            ["moveBy", "Offset from where the animation starts."],
            ["turn", "Radians around x, y, z from the start; 2π spins once."],
            ["shake", "Shakes the drawn position by up to this distance, fading."],
          ],
        },
        examples: [
          {
            title: "Sequence two steps",
            code: `import type { Entity, World } from "@nayan-ui/engine";

export async function reveal(world: World, tile: Entity) {
  await world.animate(tile, { scale: 1.15, color: "#FFCC4D" }, { duration: 0.2, easing: "back" });
  await world.animate(tile, { scale: 1 }, { duration: 0.15 });
}

export function flip(world: World, card: Entity) {
  return world.animate(card, { turn: [0, Math.PI, 0] });
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "options",
        title: "AnimateOptions reference",
        paragraphs: [
          'A repeat: "forever" promise resolves only when stopped, replaced or despawned, so never await it.',
        ],
        table: {
          headers: ["Option", "Behavior"],
          rows: [
            ["duration", "Seconds; default 0.3; ignored by springs."],
            ["delay", "Seconds before it starts; default 0."],
            ["easing", "linear, easeIn, easeOut (default), easeInOut, back, bounce, elastic."],
            ["repeat", 'Extra runs after the first, or "forever"; default 0.'],
            ["yoyo", "Every other run plays backwards."],
            ["stagger", "Extra delay per entity when animating several."],
            ["path", 'linear (default) or "smooth" curve through keyframes.'],
            ["spring", 'true, "bouncy" or SpringOptions instead of a duration.'],
          ],
        },
        examples: [
          {
            title: "Pulse and shake",
            code: `import type { Entity, World } from "@nayan-ui/engine";

export function pulse(world: World, coin: Entity) {
  void world.animate(coin, { scale: 1.2 }, { duration: 0.5, repeat: "forever", yoyo: true, easing: "easeInOut" });
}
export function wrong(world: World, tile: Entity) {
  return world.animate(tile, { shake: 0.15 }, { duration: 0.4, delay: 0.05 });
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "keyframes",
        title: "Keyframes and paths",
        paragraphs: [
          'Pass an array of up to 64 Keyframes to pass through values in order. Each may set at (0..1 of the duration; default evenly spaced), and path: "smooth" curves through them.',
        ],
        examples: [
          {
            title: "Hop",
            code: `import type { Entity, World } from "@nayan-ui/engine";

export function hop(world: World, piece: Entity) {
  return world.animate(piece, [
    { moveBy: [1, 1.5, 0], at: 0.5 },
    { moveBy: [2, 0, 0], at: 1 },
  ], { duration: 0.6, path: "smooth" });
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "groups",
        title: "Groups and stagger",
        paragraphs: [
          "Pass an array of entities to animate them together with one promise. stagger adds a delay per entity for waves and board reveals.",
        ],
        examples: [
          {
            title: "Reveal a board",
            code: `import type { Entity, World } from "@nayan-ui/engine";

export function revealBoard(world: World, tiles: readonly Entity[]) {
  for (const tile of tiles) world.set(tile, { scale: 0 });
  return world.animate(tiles, { scale: 1 }, { stagger: 0.03, easing: "back" });
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "springs",
        title: "Springs",
        paragraphs: [
          'spring replaces the duration with simulated motion: true (smooth, no overshoot), "bouncy" or { stiffness, damping, mass } (defaults 170, 26, 1). Interrupting a spring keeps its speed, so following a finger never jerks.',
        ],
        examples: [
          {
            title: "Follow the finger",
            description: "Call on every drag move; each call retargets the running spring.",
            code: `import type { Entity, World } from "@nayan-ui/engine";

export function moveCursor(world: World, cursor: Entity, x: number, z: number) {
  void world.animate(cursor, { position: [x, 0, z] }, { spring: { stiffness: 220, damping: 20 } });
}
export function landPiece(world: World, piece: Entity) {
  return world.animate(piece, { scale: 1 }, { spring: "bouncy" });
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "stop",
        title: "Stop animations",
        paragraphs: [
          "stopAnimation(entity) stops every channel where it is and resolves their promises. Despawning or disposing does the same, so no guard is needed afterwards.",
        ],
        examples: [
          {
            title: "Stop a pulse on pickup",
            code: `import type { Entity, World } from "@nayan-ui/engine";

export async function pickUp(world: World, coin: Entity) {
  world.stopAnimation(coin);
  await world.animate(coin, { scale: 0, moveBy: [0, 1, 0] }, { duration: 0.25 });
  world.despawn(coin);
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
    ],
  },
];
