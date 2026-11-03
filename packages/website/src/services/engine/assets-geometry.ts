import type { EngineGuide } from "./types";

export const AssetsGeometryGuides: EngineGuide[] = [
  {
    slug: "skeletal-animation",
    title: "Skeletal models and animation clips",
    description:
      "Play GLB clips per character, crossfade them and ground feet on the animated pose.",
    sections: [
      {
        id: "load-a-rig",
        title: "Load a rig and read its clips",
        paragraphs: [
          "loadModel resolves a LoadedModel whose animations list each clip's name and duration in seconds; jointCount is 0 for a static mesh. Read clip names from the asset instead of assuming one called walk.",
          "Skins hold up to 128 joints. Every entity spawned from the model has its own clip player, so characters sharing a model animate independently.",
        ],
        examples: [
          {
            title: "Load a character (React)",
            code: `import { loadModel } from "@nayan-ui/engine";

export async function loadHero() {
  const hero = await loadModel("/models/hero.glb", { center: false }); // origin stays at the feet
  console.log(hero.jointCount, hero.animations.map((clip) => clip.name)); // 52 ["idle", "walk", "run"]
  return hero;
}`,
            platform: "react",
            language: "tsx",
          },
          {
            title: "Load a character (React Native)",
            code: `import { loadModel } from "@nayan-ui/engine";

export async function loadHero() {
  const hero = await loadModel(require("./assets/hero.glb"), { center: false }); // origin stays at the feet
  console.log(hero.jointCount, hero.animations.map((clip) => clip.name)); // 52 ["idle", "walk", "run"]
  return hero;
}`,
            platform: "native",
            language: "tsx",
          },
        ],
      },
      {
        id: "play-hold-and-crossfade",
        title: "Play, hold, crossfade and stop",
        paragraphs: [
          "world.playClip(entity, name, options) switches to a clip, crossfading from the current pose, and returns false if it can't play. Re-selecting the playing clip only changes its speed; pass time to seek.",
          "Hold a ready-screen pose with time: 0 and speed: 0, then play on Start. stopClip(entity) freezes the current pose and stopClip(entity, true) returns to the bind pose.",
        ],
        table: {
          headers: ["ClipOptions", "Meaning"],
          rows: [
            ["loop", "Repeat the clip. Default true."],
            ["speed", "Playback rate; 0 holds the pose. Default 1."],
            ["fade", "Crossfade from the current pose, in seconds. Default 0.15."],
            ["time", "Seek to this second. Omit to keep the playback position."],
          ],
        },
        examples: [
          {
            title: "Switch clips when the movement mode changes",
            description: "Call ready() on reset, move(speed) from onUpdate and stop() on pause.",
            code: `import type { Entity, LoadedModel, World } from "@nayan-ui/engine";

export function heroClips(world: World, hero: Entity, model: LoadedModel) {
  const has = (name: string) => model.animations.some((clip) => clip.name === name);
  let current = "";
  const play = (name: string) => {
    if (name !== current && has(name) && world.playClip(hero, name, { fade: 0.2 })) current = name;
  };
  return {
    ready() {
      world.playClip(hero, "idle", { time: 0, speed: 0, fade: 0 }); // first frame, held
      current = "";
    },
    move: (speed: number) => play(speed > 4 ? "run" : speed > 0.1 ? "walk" : "idle"),
    stop() {
      world.stopClip(hero); // keep the current pose
      current = "";
    },
  };
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
        note: "Clips move the skeleton only. Moving the entity, and keeping it on the ground, is gameplay's job.",
      },
      {
        id: "sample-skinned-vertices",
        title: "Ground feet on the animated pose",
        paragraphs: [
          "world.sampleSkinnedVertices(entity, indices, out, after) writes model-space XYZ for chosen vertex indices into out (three floats each) and returns false when it can't sample. Reuse both arrays and query a few boot vertices of your asset; never skin the whole character in JS.",
          "In onUpdate, pass the frame's dt as after: the world steps by it right afterwards, so you read the pose about to be drawn. Scale and transform samples by the actor before comparing them with terrain.",
        ],
        examples: [
          {
            title: "Plant the lower boot on uneven ground",
            code: `import { GameView, type Entity, type World } from "@nayan-ui/engine";

const BOOTS = new Uint32Array([812, 1430]); // vertex indices from your own asset
const feet = new Float32Array(BOOTS.length * 3);
const at: [number, number, number] = [0, 0, 0];

type Props = { world: World; hero: Entity; scale: number; groundAt: (x: number, z: number) => number };

export function GroundedHero({ world, hero, scale, groundAt }: Props) {
  return (
    <GameView source={world} style={{ flex: 1 }} onUpdate={(dt) => {
      if (!world.position(hero, at) || !world.sampleSkinnedVertices(hero, BOOTS, feet, dt)) return;
      const lowest = Math.min(feet[1], feet[4]) * scale; // Y is unaffected by turning around Y
      world.transforms.position(hero, at[0], groundAt(at[0], at[2]) - lowest, at[2]);
    }} />
  );
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
    ],
  },
  {
    slug: "input-picking",
    title: "Gestures, joystick, keyboard and picking",
    description:
      "Read taps, swipes, drags, pinches, a joystick and browser keys, and map screen points to the world.",
    sections: [
      {
        id: "tap-swipe-long-press",
        title: "Tap, swipe and long press",
        paragraphs: [
          "GameView reports onTap(x, y), onSwipe(direction) and onLongPress(x, y) in points from the view's top-left, which are CSS pixels on the web (don't multiply by devicePixelRatio). A long press fires after half a second held still, and no tap follows it.",
          "Touches claimed by onOverlayTouch never reach these callbacks, and pausing the view cancels any touch in progress.",
        ],
        examples: [
          {
            title: "Tap to bounce, swipe to move, hold to shake",
            code: `import { GameView, type SwipeDirection, type World } from "@nayan-ui/engine";

type Props = { world: World; move: (direction: SwipeDirection) => void };

export function Board({ world, move }: Props) {
  return (
    <GameView
      source={world}
      style={{ flex: 1 }}
      onTap={(x, y) => {
        const hit = world.pick(x, y);
        if (hit) world.animate(hit.entity, { scale: 1.2 }, { yoyo: true, repeat: 1 });
      }}
      onSwipe={move}
      onLongPress={(x, y) => {
        const hit = world.pick(x, y);
        if (hit) world.animate(hit.entity, { shake: 0.1 });
      }}
    />
  );
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "drag-and-pinch",
        title: "Drag and pinch",
        paragraphs: [
          "onDrag receives start, move and end; an end with cancelled means a pinch or the system took the touch, so put a held piece back. onPinch reports two-finger zoom and rotation, and starting one ends any drag.",
        ],
        table: {
          headers: ["Event field", "Meaning"],
          rows: [
            ["DragEvent.phase", '"start" | "move" | "end".'],
            ["DragEvent.x / y", "Finger position in the view, in points."],
            ["DragEvent.dx / dy", "Distance moved since the drag started."],
            ["DragEvent.cancelled", "On end: the drag was interrupted."],
            ["PinchEvent.phase", '"start" | "move" | "end".'],
            ["PinchEvent.scale", "Finger spread relative to the start; 2 is twice as far apart."],
            ["PinchEvent.rotation", "Radians turned since the start, clockwise on screen."],
            ["PinchEvent.x / y", "Midpoint between the fingers, in points."],
          ],
        },
        examples: [
          {
            title: "Drag pieces on a board and pinch to zoom",
            code: `import { useRef } from "react";
import { GameView, type Camera, type Entity, type ScreenPlane, type Vec3, type World } from "@nayan-ui/engine";

const BOARD: ScreenPlane = { normal: [0, 0, 1] }; // an XY board facing the camera
const point: [number, number, number] = [0, 0, 0];

export function DragBoard({ world }: { world: World }) {
  const camera = useRef<Camera>({ eye: [0, 0, 20], target: [0, 0, 0], fov: 1, ortho: 6 }).current;
  const held = useRef<{ piece: Entity; from: Vec3 } | null>(null);
  const zoom = useRef(6);
  return <GameView source={world} camera={camera} style={{ flex: 1 }}
    onDrag={({ phase, x, y, cancelled }) => {
      const hit = phase === "start" ? world.pick(x, y) : null;
      if (hit) held.current = { piece: hit.entity, from: world.position(hit.entity) ?? [0, 0, 0] };
      const h = held.current;
      if (!h) return;
      if (phase !== "end") {
        if (world.screenToWorld(x, y, BOARD, point)) world.set(h.piece, { position: point });
        return;
      }
      if (cancelled) world.set(h.piece, { position: h.from });
      held.current = null;
    }}
    onPinch={({ phase, scale }) => {
      if (phase === "start") zoom.current = camera.ortho ?? 6;
      else camera.ortho = Math.min(12, Math.max(2, zoom.current / scale));
    }} />;
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "joystick",
        title: "On-screen joystick",
        paragraphs: [
          "useJoystick() returns a stable { x, y } object that Joystick writes on touch, each axis in -1..1 with y up, without re-rendering React. Read it in onUpdate.",
          "The stick is relative: wherever the finger lands in the pad is the centre. Render it beside GameView, not inside it, and position it with style; size is the pad diameter (default 150).",
        ],
        examples: [
          {
            title: "Steer a player with the stick",
            code: `import { GameView, Joystick, useJoystick, type Entity, type World } from "@nayan-ui/engine";

export function Controls({ world, player }: { world: World; player: Entity }) {
  const stick = useJoystick();
  return (
    <>
      <GameView source={world} style={{ flex: 1 }} onUpdate={() => {
        world.set(player, { groundVelocity: [stick.x * 6, -stick.y * 6] }); // stick up = forward (-z)
      }} />
      <Joystick state={stick} size={140} />
    </>
  );
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "pick-and-project",
        title: "Pick, project and unproject",
        paragraphs: [
          "world.pick(x, y) tests the bounding boxes of what was last drawn and returns a PickHit { entity, point, distance } or null; it needs no physics, and pickable: false opts an entity out. screenToWorld(x, y, plane?) intersects a plane, by default the ground (y = 0); pass normal [0, 0, 1] for an XY board.",
          "toScreen(position) returns view points, or null behind the camera, and all three return null until a frame has been drawn. Each takes a last out argument (a PickHit, [x, y] or [x, y, z]) so per-frame code allocates nothing.",
        ],
        examples: [
          {
            title: "Keep a name tag above an entity",
            description:
              "Create the callback once (for example with useMemo) and pass it as onUpdate; place moves a View or DOM element you own.",
            code: `import type { Entity, World } from "@nayan-ui/engine";

export function tagFollower(world: World, target: Entity, place: (x: number, y: number) => void, hide: () => void) {
  const at: [number, number, number] = [0, 0, 0];
  const screen: [number, number] = [0, 0];
  return () => {
    if (!world.worldPosition(target, at)) return hide();
    at[1] += 1.2; // above the head
    if (world.toScreen(at, screen)) place(screen[0], screen[1]);
    else hide(); // behind the camera, or nothing drawn yet
  };
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "browser-keyboard",
        title: "Browser keyboard input",
        paragraphs: [
          "createKeyboardInput(surface, options) turns arrow keys, WASD, Space and Enter into pointer events on an element wrapping GameView, so onTap, onDrag and onSwipe work unchanged. It uses the DOM: call it in browser code only, never in React Native.",
          "Enter calls GameView's onPrimaryAction (Start, Play Again) when set, otherwise it taps at options.primary() or the cursor. Keys typed into inputs and buttons are ignored, and window blur or a hidden tab releases held keys.",
        ],
        table: {
          headers: ["Option / method", "Behavior"],
          rows: [
            ['mode: "pointer"', "Default. Arrows move a cursor; Space presses and holds there."],
            ['mode: "drag"', "Held arrows drag from the centre, for steering."],
            ['mode: "swipe"', "Each arrow is one 80-point swipe, for 2048-style games."],
            ["enabled()", "Return false to ignore keys and release held input, e.g. while paused."],
            ["primary()", "Point, in CSS pixels, that Enter taps without onPrimaryAction."],
            [
              "cancel() / dispose()",
              "Release a held press; remove listeners and the cursor on unmount.",
            ],
          ],
        },
        examples: [
          {
            title: "KeyboardGame.tsx",
            code: `"use client";
import { useEffect, useRef } from "react";
import { createKeyboardInput, GameView, type SwipeDirection, type World } from "@nayan-ui/engine";

type Props = { world: World; paused: boolean; onSwipe: (direction: SwipeDirection) => void; onStart: () => void };

export function KeyboardGame({ world, paused, onSwipe, onStart }: Props) {
  const surface = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(paused);
  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => {
    if (!surface.current) return;
    const keyboard = createKeyboardInput(surface.current, { mode: "swipe", enabled: () => !pausedRef.current });
    return () => keyboard.dispose();
  }, []);
  return (
    <div ref={surface} tabIndex={0} style={{ position: "relative", height: "100%" }}>
      <GameView source={world} paused={paused} onSwipe={onSwipe} onPrimaryAction={onStart} style={{ height: "100%" }} />
    </div>
  );
}`,
            platform: "react",
            language: "tsx",
          },
        ],
      },
    ],
  },
  {
    slug: "particles",
    title: "Effects, particles and the cleared-piece pop",
    description:
      "Fire ready-made effects in one call, or shape your own particles with world.burst.",
    sections: [
      {
        id: "effects",
        title: "Ready-made effects",
        paragraphs: [
          "Import effects and call one function per event; each layers a few bursts (big slow pieces, small fast ones, a glow, lingering puffs) that move, fade and clean up in Rust. Particles advance with the world, so they pause with the game.",
          "Every particle takes a world slot, so size the World's capacity for the busiest moment. Effects throw on a disposed world: check world.isDisposed in callbacks that can run late.",
        ],
        table: {
          headers: ["Call", "Use it for"],
          rows: [
            [
              "effects.confetti(world, options)",
              "Wins and level-ups: tumbling paper, glints, a pop of light.",
            ],
            [
              "effects.sparkle(world, options)",
              "Pickups and perfect moves: bright beads and glints.",
            ],
            [
              "effects.shatter(world, options)",
              "Bricks, crates, glass: chunks, crumbs, a glow and dust.",
            ],
            ["effects.splash(world, options)", "Water, juice, paint: droplets and mist."],
            [
              "effects.sparks(world, options)",
              "Scrapes, strikes, electricity: hot streaks and beads.",
            ],
            [
              "effects.explosion(world, options)",
              "Flash, fireball cooling to smoke, embers and optional debris.",
            ],
            [
              "effects.dust(world, DustOptions)",
              "Soft swelling puffs: landing dust, sand, steam. Returns the count.",
            ],
            [
              "effects.flash(world, FlashOptions)",
              "One swelling glow: hits, strikes, muzzle flashes. Returns the count.",
            ],
            [
              "effects.pop(world, entity, PopOptions)",
              "A cleared piece swells, flashes white and shrinks away. Returns a Promise.",
            ],
            ["effects.hot(color, peak = 2.2, alpha?)", "The same hue made self-lit, for glows."],
            ["effects.pale(color, t, alpha?)", "The color moved part way (t, 0..1) toward white."],
            ["effects.POP_TIME", "Default pop duration: 0.5 seconds."],
          ],
        },
        examples: [
          {
            title: "Celebrate a win and reward a pickup",
            code: `import { effects, type Vec3, type World } from "@nayan-ui/engine";

export function celebrate(world: World, position: Vec3) {
  effects.confetti(world, {
    position, colors: ["#FF4D4D", "#FFD933", "#3399FF"],
    size: 0.12, speed: 6, count: 40, lifetime: 1.2, gravity: -6,
  });
}

export function collect(world: World, position: Vec3) {
  effects.sparkle(world, { position, colors: "#FFD933", size: 0.08, speed: 3, count: 14, lifetime: 0.6 });
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "effect-options",
        title: "EffectOptions",
        paragraphs: [
          "confetti, sparkle, shatter, splash, sparks and explosion share EffectOptions; position, colors, size, speed, count and lifetime are required, except colors for explosion. Sizes are world units, speeds units per second and times seconds.",
        ],
        table: {
          headers: ["Option", "Meaning"],
          rows: [
            ["position", "Where the effect starts."],
            ["colors", "One CSS color or tuple, or several picked at random."],
            ["size / speed", "Typical particle size; top speed."],
            ["count", "About how many particles; a few extra go to the glow and puffs."],
            ["lifetime", "Seconds."],
            ["gravity", "Vertical acceleration; negative falls. Default 0."],
            [
              "direction / spread",
              "Main direction (default up); cone half-angle (default π, all directions).",
            ],
            ["flash", "A brief glow at the source. Default true."],
            ["shatter: mesh / dust", 'Chunk shape (default "cube"); dust: false skips the puff.'],
            [
              "explosion: debris / smoke",
              "Colors of flying chunks; smoke color. size is the fireball's puff size.",
            ],
          ],
        },
        examples: [
          {
            title: "Break, splash, scrape and blow up",
            code: `import { effects, type EffectOptions, type Vec3, type World } from "@nayan-ui/engine";

const water: Omit<EffectOptions, "position"> = {
  colors: "rgba(77, 153, 255, 0.9)", size: 0.1, speed: 4, count: 24, lifetime: 0.8, gravity: -9.8,
};

export const splashAt = (world: World, position: Vec3) => effects.splash(world, { ...water, position });

export function breakCrate(world: World, position: Vec3) {
  effects.shatter(world, { position, colors: ["#8B5A2B", "#6B4220"], size: 0.2, speed: 5, count: 16,
    lifetime: 0.7, gravity: -9.8, mesh: "cube" });
}

export function scrape(world: World, position: Vec3, away: Vec3) {
  effects.sparks(world, { position, colors: "orange", size: 0.05, speed: 8, count: 20, lifetime: 0.4,
    direction: away, spread: 0.5, gravity: -6 });
}

export function blowUp(world: World, position: Vec3) {
  effects.explosion(world, { position, size: 0.6, speed: 6, count: 40, lifetime: 1,
    debris: ["#4D4D52"], smoke: "rgba(50, 50, 50, 0.6)" });
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "dust-and-flash",
        title: "Dust puffs and flashes",
        paragraphs: [
          "effects.dust makes soft puffs that swell and fade; gravity defaults to 0 so dust hangs, and positive values rise like smoke. effects.flash draws one glow at a point; channels above 1 glow, most easily via effects.hot(color).",
        ],
        table: {
          headers: ["Option", "Meaning"],
          rows: [
            ["position", "Required by both."],
            ["dust: color", "Start color (alpha is thickness), or several. Required."],
            [
              "dust: size / speed / count / lifetime",
              "Required: puff size, top speed, puffs, seconds.",
            ],
            ["dust: direction / spread / gravity", "Default up, π and 0 (positive rises)."],
            [
              "dust: endSize / endColor",
              "Growth by the end (default 2); end color (default: faded).",
            ],
            ["dust: mesh", 'Default "puff" (blended); "flame" adds light.'],
            ["flash: color / size", "Required. Channels above 1 glow."],
            ["flash: lifetime / endSize", "Defaults 0.22 seconds and 2.2."],
            ["flash: endColor", "Default: color faded to transparent."],
            ["flash: mesh", 'Default "flame" (additive); "sphere" or "puff" for solid or soft.'],
            [
              "flash: count / speed",
              "Glows drawn (default 1), scattered when speed > 0 (default 0).",
            ],
          ],
        },
        examples: [
          {
            title: "Landing dust, a hit flash and steam",
            code: `import { effects, type Vec3, type World } from "@nayan-ui/engine";

export function landed(world: World, feet: Vec3) {
  effects.dust(world, { position: feet, color: "rgba(204, 191, 166, 0.6)", size: 0.3, speed: 1.5, count: 6, lifetime: 0.5 });
}

export function hit(world: World, at: Vec3) {
  effects.flash(world, { position: at, color: effects.hot("#FF8000"), size: 0.8 });
}

export function steam(world: World, vent: Vec3) {
  effects.dust(world, { position: vent, color: effects.pale("#99B3CC", 0.6, 0.4), size: 0.4, speed: 1,
    count: 8, lifetime: 1.5, gravity: 1, endSize: 3 });
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "pop",
        title: "Pop a cleared piece",
        paragraphs: [
          "effects.pop(world, entity, options) swells a cleared, matched or collected piece, flashes it white, settles it and shrinks it to nothing, stopping any animation it had. It resolves when the piece is gone; despawn it then, with no guard needed since despawn is safe after dispose.",
        ],
        table: {
          headers: ["PopOptions", "Meaning"],
          rows: [
            ["scale", "Its rest scale, a number or Vec3. Required."],
            ["color", "Rest color to return to after the white flash; omit to skip it."],
            ["flash", "Child entities (white at rest) to flash as well."],
            ["delay", "Seconds before it starts. Default 0."],
            ["duration", "Seconds. Default effects.POP_TIME (0.5)."],
          ],
        },
        examples: [
          {
            title: "Clear matched pieces in a wave",
            code: `import { effects, type ColorInput, type Entity, type World } from "@nayan-ui/engine";

export async function clearPieces(world: World, pieces: readonly Entity[], color: ColorInput) {
  await Promise.all(pieces.map((piece, i) =>
    effects.pop(world, piece, { scale: 1, color, delay: i * 0.05 }).then(() => world.despawn(piece))));
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "burst",
        title: "Custom particles with world.burst",
        paragraphs: [
          "Use world.burst(options) only when you need one plain layer under exact control; it spawns up to count particles in one native call and returns how many fit. Particles advance and expire with world.update.",
          'The "puff" mesh is a soft camera-facing sprite that alpha-blends, and "flame" is the same sprite added to the scene, so overlaps build a bright core. Neither is solid or a light source, and shapeGeometry can\'t build them.',
        ],
        table: {
          headers: ["BurstOptions", "Meaning"],
          rows: [
            ["position", "Origin. Required."],
            ["count", "Particles. Default 16."],
            ["direction / spread", "Main direction, default up; cone half-angle, default π."],
            ["mesh", 'Built-in shape or Model. Default "cube".'],
            ["size / speed / lifetime", "Defaults 0.15 units, 5 units per second, 0.8 seconds."],
            ["gravity", "Vertical acceleration. Default -9.81; 0 floats."],
            ["color", "One color, or up to four picked per particle. Default white."],
            ["endSize", "End size as a multiple of the start; above 1 grows. Default 1."],
            ["endColor", "Color reached by the end; alpha below 1 fades out."],
          ],
        },
        examples: [
          {
            title: "Smoke and sparks",
            code: `import type { Vec3, World } from "@nayan-ui/engine";

export function smokeAndSparks(world: World, position: Vec3) {
  world.burst({ position, mesh: "puff", count: 18, color: "rgba(128, 128, 128, 0.5)", size: 0.3,
    speed: 2, gravity: 0, lifetime: 1.5, endSize: 4, endColor: "rgba(50, 50, 50, 0)" });
  // Glowing colors need channels above 1, so these are 0..1+ tuples.
  return world.burst({ position, mesh: "flame", count: 28, direction: [0, 1, 0], spread: Math.PI / 2,
    color: [[2, 1.2, 0.2], [2, 0.4, 0.1]], speed: 7, lifetime: 0.6, endSize: 0.1 });
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
    ],
  },
  {
    slug: "models-textures",
    title: "Models, textures and asset loading",
    description: "Load glTF models and images in parallel, recover from failures and map textures.",
    sections: [
      {
        id: "load-assets",
        title: "Load assets in parallel",
        paragraphs: [
          "Pass a URL string (or a bundler import) on the web, and require(...) or a URI in React Native; add glb and gltf to Metro's assetExts and install expo-asset for bundled Android release assets. Loaders start the engine themselves and cache by source and options, so a second call returns the same promise.",
          "On iOS and Android, loadTexture, loadModel, loadFont and audio.load decode on native background threads, so Promise.all loads a level in parallel while the loading screen animates, and meshes register with the renderer inside Rust. The web's single-threaded core decodes on the main thread, so load before play, never in onUpdate.",
        ],
        examples: [
          {
            title: "Load a level (React)",
            code: `import { loadFont, loadModel, loadTexture } from "@nayan-ui/engine";

export async function loadLevel() {
  const [tree, bark, font] = await Promise.all([
    loadModel("/models/tree.glb", { center: false, fit: 3 }),
    loadTexture("/textures/bark.jpg"),
    loadFont("/fonts/Inter-Bold.ttf", { chars: "0123456789" }),
  ]);
  return { tree, bark, font };
}`,
            platform: "react",
            language: "tsx",
          },
          {
            title: "Load a level (React Native)",
            code: `import { loadFont, loadModel, loadTexture } from "@nayan-ui/engine";

export async function loadLevel() {
  const [tree, bark, font] = await Promise.all([
    loadModel(require("./assets/tree.glb"), { center: false, fit: 3 }),
    loadTexture(require("./assets/bark.jpg")),
    loadFont(require("./assets/Inter-Bold.ttf"), { chars: "0123456789" }),
  ]);
  return { tree, bark, font };
}`,
            platform: "native",
            language: "tsx",
          },
        ],
      },
      {
        id: "errors-and-retry",
        title: "Errors and retry",
        paragraphs: [
          "A failed load rejects with an Error naming the loader and source (loadTexture: couldn't load …), with the original error as cause. Failures aren't cached, so calling the loader again retries; a file the core rejects discards its saved bytes, while network and start-up failures keep them.",
          "Offer a Retry action rather than retrying from onUpdate, and ignore results that arrive after unmount.",
        ],
        examples: [
          {
            title: "useTexture.ts",
            code: `import { useEffect, useState } from "react";
import { loadTexture, type AssetSource, type Texture } from "@nayan-ui/engine";

export function useTexture(source: AssetSource) {
  const [attempt, setAttempt] = useState(0);
  const [texture, setTexture] = useState<Texture | null>(null);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    let active = true;
    setError(null);
    loadTexture(source).then(
      (value) => active && setTexture(value),
      (cause: Error) => active && setError(cause),
    );
    return () => { active = false; };
  }, [source, attempt]);
  return { texture, error, retry: () => setAttempt((n) => n + 1) };
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "models-and-gltf-limits",
        title: "Models and glTF limits",
        paragraphs: [
          "loadModel reads glTF 2.0: a .glb, or a .gltf with embedded buffers; external buffer files are rejected, so export a self-contained GLB. It keeps meshes, node transforms, vertex and material colors, one base-color texture per model, skins and clips, and decodes EXT_meshopt_compression, but it isn't a general importer for every material extension.",
          "Every entity using a model draws in one instanced call, and colliders sized from it fit its bounding box. Ship third-party models with their licences.",
        ],
        table: {
          headers: ["API / option", "Meaning"],
          rows: [
            ["center", "Move the bounding-box centre to the origin. Default true."],
            ["fit", "Scale so the largest side is this long. Default: source size."],
            ["shine", "Gloss 0..1; about 0.8 reads as paint or glass. Default 0."],
            ["Model", "{ id, size }: a shared mesh handle with its fitted size, not an entity."],
            ["LoadedModel", "Model plus animations (ModelClip[]) and jointCount."],
            ["ModelClip", "{ name, duration }, duration in seconds."],
          ],
        },
        examples: [
          {
            title: "Stand a centred model on the ground",
            code: `import type { Model, World } from "@nayan-ui/engine";

// A centred model's bottom is half its height below its position.
export function placeProp(world: World, model: Model, x: number, z: number) {
  return world.spawn({ mesh: model, position: [x, model.size[1] / 2, z], physics: "fixed" });
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "textures-and-atlas-regions",
        title: "Textures, tint and atlas regions",
        paragraphs: [
          "loadTexture reads a PNG or JPEG up to 4096 × 4096, keeps its alpha and returns { id, width, height }; it maps through the mesh's UVs and the entity's color tints it. textureRegion shows [u0, v0, u1, v1] of the image (0..1, v from the top) for sprite sheets and card atlases.",
          "Pass mesh again when set changes texture. Each mesh–texture pair takes a mesh id, so reuse a few pairs rather than making one per entity.",
        ],
        examples: [
          {
            title: "Show tiles from a 4 × 2 atlas",
            code: `import type { Model, Texture, World } from "@nayan-ui/engine";

const COLUMNS = 4, ROWS = 2;
const tile = (i: number) => {
  const x = i % COLUMNS, y = Math.floor(i / COLUMNS);
  return [x / COLUMNS, y / ROWS, (x + 1) / COLUMNS, (y + 1) / ROWS] as const;
};

export function addCard(world: World, card: Model, atlas: Texture) {
  const entity = world.spawn({ mesh: card, texture: atlas, textureRegion: tile(0), color: "white" });
  return {
    show: (index: number) => world.set(entity, { textureRegion: tile(index) }),
    swap: (other: Texture) => world.set(entity, { mesh: card, texture: other }), // texture changes need mesh
  };
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
        note: "Textured, imported and skinned models stay in their loader caches. ProceduralCache saves static untextured geometry only, without texture bindings or skeletons.",
      },
    ],
  },
  {
    slug: "text-fonts",
    title: "Fonts, text and measurement",
    description: "Load fonts, then draw, update and measure 3D text.",
    sections: [
      {
        id: "load-font",
        title: "Load a font",
        paragraphs: [
          "loadFont(source, options) reads TrueType or OpenType outlines and builds a mesh per glyph; prewarm known characters with chars, and others build on first use. Characters the font lacks draw as ?, and there's no complex shaping, color emoji or fallback font.",
          "Source, depth and weight identify a shared font; a later call with other chars only adds glyphs. Font licences still apply.",
        ],
        table: {
          headers: ["FontOptions", "Meaning"],
          rows: [
            ["depth", "Extrusion as a fraction of the font size; 0 is flat. Default 0.2."],
            ["chars", "Glyphs to prewarm (space and ? always). Default: ASCII and common symbols."],
            ["weight", "Weight of a variable font, e.g. 600. Default: the font's own."],
          ],
        },
        examples: [
          {
            title: "Load a HUD font (React)",
            code: `import { loadFont } from "@nayan-ui/engine";

export const loadHudFont = () =>
  loadFont("/fonts/Inter-SemiBold.ttf", { depth: 0, chars: "0123456789SCORE: ", weight: 600 });`,
            platform: "react",
            language: "tsx",
          },
          {
            title: "Load a HUD font (React Native)",
            code: `import { loadFont } from "@nayan-ui/engine";

export const loadHudFont = () =>
  loadFont(require("./assets/Inter-SemiBold.ttf"), { depth: 0, chars: "0123456789SCORE: ", weight: 600 });`,
            platform: "native",
            language: "tsx",
          },
        ],
      },
      {
        id: "text-entities",
        title: "Spawn and update text",
        paragraphs: [
          "Spawn an entity with text and font; letters are 1 unit tall at scale 1 and the line is a single row. Setting text again reuses the existing letter entities.",
          "Each drawn letter is a child entity that counts against the World's capacity. Text is lit, shadowed geometry in a scene, and flat and unlit in an overlay.",
        ],
        table: {
          headers: ["Text option", "Meaning"],
          rows: [
            ["text / font", "The line to draw and its loaded Font."],
            ["align", '"left" | "center" | "right" around position. Default "center".'],
            ["letterSpacing", "Extra space between letters, in ems. Default 0."],
            ["tabular", "Digits share the widest advance so scores don't shift. Default false."],
          ],
        },
        examples: [
          {
            title: "A score label that doesn't jitter",
            code: `import type { Font, World } from "@nayan-ui/engine";

export function scoreLabel(world: World, font: Font) {
  const label = world.spawn({ text: "0", font, align: "left", tabular: true,
    position: [-2, 3, 0], scale: 0.5, color: "white" });
  return (score: number) => world.set(label, { text: String(score) });
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "measure-text",
        title: "Measure text",
        paragraphs: [
          "measureText(font, text, layout) returns a line's advance in ems, with the same glyph loading, spacing and fallbacks as drawing; multiply by the entity's scale for world units. Pass the letterSpacing and tabular you draw with.",
        ],
        table: {
          headers: ["Type", "Meaning"],
          rows: [
            ["Font", "id, capHeight (capital height at scale 1) and glyphs, which grows with use."],
            ["TextLayout", "letterSpacing? and tabular?, shared by measureText and text entities."],
            ["TextAlign", '"left" | "center" | "right".'],
          ],
        },
        examples: [
          {
            title: "Shrink a title to fit",
            code: `import { measureText, type Font, type TextLayout, type World } from "@nayan-ui/engine";

const layout: TextLayout = { letterSpacing: 0.02 };

export function fittedTitle(world: World, font: Font, text: string, maxWidth: number) {
  const width = measureText(font, text, layout); // ems at scale 1
  const scale = Math.min(1, maxWidth / Math.max(width, 0.001));
  return world.spawn({ text, font, ...layout, scale, position: [0, 2, 0] });
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
    ],
  },
  {
    slug: "procedural-geometry",
    title: "Paths, extrusion, lathe and tube geometry",
    description: "Build meshes in code from paths, profiles, tubes and merged parts.",
    sections: [
      {
        id: "geometry-and-create-shape",
        title: "Geometry and createShape",
        paragraphs: [
          "Builders return Geometry: a Float32Array of 11 floats per vertex (position, normal, RGB color, UV) and a Uint32Array of triangle indices. createShape(geometry, options) registers it as a Model for any entity's mesh, and equal geometry and options reuse the same model.",
          "Mesh ids are app-wide and never freed (about 4,080), so build each mesh once after warmUpEngine (useWorld's setup runs after it), keep it at module scope and spawn many entities from it. shapeGeometry(name, { color }) copies a built-in shape (cube, sphere, plane, cylinder, cone, capsule, torus, roundedBox) for merging.",
        ],
        table: {
          headers: ["ShapeOptions", "Meaning"],
          rows: [
            ["center", "Centre the bounding box on the origin. Default true."],
            ["fit", "Scale so the largest side is this long. Default: keep the size."],
            ["shine", "Gloss 0..1; 0.6 waxy, 0.85 glass. Default 0."],
            [
              "optimize",
              "true or OptimizeOptions: clean, weld and optionally simplify. Default false.",
            ],
          ],
        },
        examples: [
          {
            title: "Build once, spawn many",
            code: `import { createShape, GameView, shapeGeometry, useWorld, type Model } from "@nayan-ui/engine";

let token: Model | undefined; // one mesh for the whole app
const tokenMesh = () => (token ??= createShape(shapeGeometry("roundedBox"), { fit: 1, shine: 0.25 }));

export function Tokens() {
  const world = useWorld(50, (w) => {
    for (let i = 0; i < 5; i++) w.spawn({ mesh: tokenMesh(), position: [i * 1.2 - 2.4, 0.5, 0], color: "#FFB020" });
  });
  return world && <GameView source={world} camera={{ eye: [0, 4, 8], target: [0, 0, 0], fov: 1 }} style={{ flex: 1 }} />;
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
        note: "Vertex and part colors are 0..1 tuples that multiply the entity's color, which also accepts CSS strings.",
      },
      {
        id: "paths-and-extrusion",
        title: "Paths and extrusion",
        paragraphs: [
          "Path builds 2D outlines like SVG (x right, y down, world units) with chaining methods, and Path.fromSVG parses path data (M L H V C S Q T A Z, absolute and relative). extrude(path, options) fills it into a solid facing +Z, flipped so it stands as drawn.",
          "depth defaults to 0.2, and 0 gives a one-sided flat face. fillRule defaults to nonzero; evenodd makes every inner contour a hole.",
        ],
        table: {
          headers: ["API", "Meaning"],
          rows: [
            ["moveTo / lineTo / close", "Start a contour, add a line, close it."],
            ["quadraticTo / cubicTo", "Bézier curves through control points to (x, y)."],
            ["arcTo(rx, ry, rotation, largeArc, sweep, x, y)", "SVG elliptical arc."],
            ["addPolygon(points, close = true)", "Polygon through [x, y] points."],
            ["addRect / addRoundedRect", "(x, y, width, height), plus radius or [rx, ry]."],
            ["addOval / addCircle", "Ellipse filling a box; circle (cx, cy, radius)."],
            ["addStar(cx, cy, outer, inner, points = 5)", "Star with its first tip up."],
            [
              "addRegularPolygon(cx, cy, radius, sides)",
              "Regular polygon with its first corner up.",
            ],
            ["Path.fromSVG(d)", "Parses path data, not whole SVG markup."],
            ["transform(sx, sy = sx, dx = 0, dy = 0)", "A scaled, moved copy."],
            ["toContours() / bounds()", "Flattened points; [minX, minY, maxX, maxY] or undefined."],
            ["ExtrudeOptions", 'depth (0.2), fillRule ("nonzero" | "evenodd"), color tuple.'],
          ],
        },
        examples: [
          {
            title: "Extrude a ring and an SVG arrow",
            code: `import { createShape, extrude, Path } from "@nayan-ui/engine";

// Call once after warmUpEngine() and keep the models.
export function badgeMeshes() {
  const ring = new Path().addCircle(0, 0, 1).addCircle(0, 0, 0.35); // inner circle becomes a hole
  const arrow = Path.fromSVG("M0 4 L6 4 L6 1 L10 6 L6 11 L6 8 L0 8 Z");
  return {
    ring: createShape(extrude(ring, { depth: 0.15, fillRule: "evenodd", color: [1, 0.75, 0.2] }), { shine: 0.5 }),
    arrow: createShape(extrude(arrow, { depth: 1 }), { fit: 1.5 }),
  };
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "lathe",
        title: "Lathe profiles",
        paragraphs: [
          "lathe(profile, options) spins a profile around the Y axis, like a potter's wheel: a Path (x is the radius, y down) or [radius, height] points. Open ends away from the axis are capped, and a sweep below 2π closes its cut faces too.",
          "Make displace equal at u = 0 and 1 to avoid a seam. Color callbacks paint vertices, so more segments, capRings or cutSteps give finer patterns at a vertex cost.",
        ],
        table: {
          headers: ["LatheOptions", "Meaning"],
          rows: [
            ["segments", "Steps around the axis. Default 32."],
            ["sweep", "Radians around; Math.PI for a half. Default 2π."],
            ["color", "Tuple, or ({ u, v, position, normal }) => tuple. Default white."],
            ["displace(u, v)", "Offset along the normal: dimples, ribs, ridges."],
            [
              "capColor / capRings",
              "End-cap color or (r, angle) => tuple; rings, default 1 (12 for a function).",
            ],
            [
              "cutColor / cutSteps",
              "Cut-face color or (r, y) => tuple; steps, default 12 for a function.",
            ],
          ],
        },
        examples: [
          {
            title: "A painted half fruit",
            code: `import { createShape, lathe } from "@nayan-ui/engine";

export function halfFruitMesh() {
  return createShape(lathe([[0, -1], [0.7, -0.7], [1, 0], [0.7, 0.7], [0, 1]], {
    segments: 40,
    sweep: Math.PI,
    color: ({ v }) => [1, 0.35 + v * 0.2, 0.05],
    displace: (u, v) => 0.015 * Math.cos(u * Math.PI * 16) * Math.sin(v * Math.PI),
    cutColor: (r, y) => [1, 0.6 + r * 0.3, 0.2 + Math.abs(y) * 0.1],
  }), { shine: 0.2 });
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "tubes",
        title: "Tubes",
        paragraphs: [
          "tube(points, options) sweeps a cross-section along a smooth curve through 3D points: stems, horns, ropes, pipes, snakes. radius tapers when it's a function of t, 0 at the first point and 1 at the last.",
        ],
        table: {
          headers: ["TubeOptions", "Meaning"],
          rows: [
            ["radius", "Number or (t) => number. Default 0.1."],
            [
              "shape(around)",
              "Radius multiplier around the section, for ridges or stars. Default round.",
            ],
            ["sides", "Steps around. Default 12."],
            ["smoothness", "Steps between each pair of points. Default 8."],
            ["caps", "Cap the ends where the radius isn't 0. Default true."],
            ["closed", "Join the last point to the first, without caps. Default false."],
            ["color / capColor", "Surface color (v = t) and end-cap color. Default white."],
          ],
        },
        examples: [
          {
            title: "A tapered horn",
            code: `import { createShape, tube } from "@nayan-ui/engine";

export function hornMesh() {
  return createShape(tube([[0, 0, 0], [0.2, 0.6, 0], [0.5, 1, 0.1], [0.8, 1.1, 0.2]], {
    radius: (t) => 0.25 * (1 - t), // 0 at the tip
    color: [0.8, 0.75, 0.6],
  }));
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "merge-recolor-smooth",
        title: "Merge parts, recolor and smooth",
        paragraphs: [
          "merge(parts) bakes parts, each with an optional position, rotation quaternion, scale and color multiplier, into one Geometry that draws in one call and moves as one entity. recolor(geometry, fn) repaints vertices in place from their SurfacePoint { u, v, position, normal }.",
          "smoothNormals(geometry) recomputes normals in place and welds seams; run it on a sculpted surface before merging hard-edged caps. Geometry has no per-vertex alpha, so use the entity's color for transparency.",
        ],
        examples: [
          {
            title: "A stem and a berry in one mesh",
            code: `import { createShape, merge, recolor, shapeGeometry, tube } from "@nayan-ui/engine";

export function berryMesh() {
  const stem = tube([[0, 0, 0], [0, 0.8, 0], [0.2, 1.2, 0]], { radius: 0.08, sides: 10 });
  recolor(stem, ({ position }) => (position[1] > 0.6 ? [0.3, 0.8, 0.2] : [0.15, 0.4, 0.1]));
  return createShape(merge([
    { geometry: stem },
    { geometry: shapeGeometry("sphere"), position: [0.2, 1.3, 0], scale: 0.4, color: [1, 0.3, 0.2] },
  ]));
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
    ],
  },
  {
    slug: "surfaces-lofts",
    title: "Parametric surfaces, lofts and deformation",
    description: "Sample parametric surfaces, loft smooth bodies and sculpt geometry.",
    sections: [
      {
        id: "parametric-surfaces",
        title: "Parametric surfaces",
        paragraphs: [
          "parametricSurface(sample, options) turns (u, v) from 0 to 1 into positions, for terrain, cloth, wings and ribbons. Triangles wind by dP/du × dP/dv, so order coordinates so the front faces outward.",
        ],
        table: {
          headers: ["ParametricSurfaceOptions", "Meaning"],
          rows: [
            [
              "uSegments / vSegments",
              "Grid steps, 1..1024 each (at most a million vertices). Defaults 32 and 16.",
            ],
            ["wrapU / wrapV", "Join the edges' positions and normals, keeping separate 0/1 UVs."],
            ["color", "Tuple, or ({ u, v, position, normal }) => tuple."],
          ],
        },
        examples: [
          {
            title: "Rolling terrain",
            code: `import { createShape, parametricSurface } from "@nayan-ui/engine";

export function terrainMesh() {
  return createShape(parametricSurface((u, v) => {
    const x = (u - 0.5) * 20, z = (0.5 - v) * 20; // this order faces up
    return [x, 0.4 * Math.sin(x * 0.5) * Math.cos(z * 0.4), z];
  }, {
    uSegments: 64,
    vSegments: 64,
    color: ({ position }) => (position[1] > 0.2 ? [0.3, 0.5, 0.2] : [0.2, 0.35, 0.12]),
  }), { center: false });
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
        note: "A surface is a visual mesh, not a collider. Match gameplay grounding to the surface you draw, or add supported colliders.",
      },
      {
        id: "lofts",
        title: "Lofts, blocks and ellipsoids",
        paragraphs: [
          "loft(sections, options) runs a smooth closed body through rounded-rectangle cross-sections along Z: vehicle shells, cabins, shoes. It needs at least two sections in strictly increasing or decreasing z.",
          "block(w, h, d, square = 6, color?) is a rounded box with flat end caps, and ellipsoid(radii, color?, around = 16) an exact ellipsoid. All three return Geometry to merge or deform before createShape.",
        ],
        table: {
          headers: ["API / option", "Meaning"],
          rows: [
            ["LoftSection.z", "Position along Z."],
            ["bottom / top", "Lower and upper edge heights; top must be above bottom."],
            ["width / topWidth", "Half-width at the lower corners; at the top (default width)."],
            ["square", "Superellipse exponent: 2 is oval, higher is boxier. Default 4."],
            ["LoftOptions.around", "Steps around each section, 6..512. Default 32."],
            ["smoothness", "Steps between sections, 1..64. Default 4."],
            ["color", "Tuple, or (position, normal) => tuple."],
          ],
        },
        examples: [
          {
            title: "A car-like shell",
            code: `import { block, createShape, ellipsoid, loft, merge } from "@nayan-ui/engine";

export function shellMesh() {
  const body = loft([
    { z: -2, bottom: 0, top: 0.8, width: 0.6, square: 3 },
    { z: 0, bottom: 0, top: 1.2, width: 1, topWidth: 0.8 },
    { z: 2, bottom: 0.1, top: 0.6, width: 0.5, square: 3 },
  ], { around: 24, smoothness: 5, color: [0.2, 0.55, 0.8] });
  return createShape(merge([
    { geometry: body },
    { geometry: block(1, 0.2, 1), position: [0, 1.1, 0] },
    { geometry: ellipsoid([0.3, 0.2, 0.5]), position: [0, 1.4, 0] },
  ]));
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "smooth-curves-and-deformation",
        title: "Smooth curves and deformation",
        paragraphs: [
          "smoothCurve(points) returns a smooth Hermite function through increasing [x, value] points, clamped past the ends, for profiles and tuning curves. deformGeometry(geometry, (position, uv) => Vec3) moves every vertex of a copy and recomputes its normals.",
          "Deform smooth surfaces before adding hard-edged parts; it can't change a registered model or keep a rig.",
        ],
        examples: [
          {
            title: "Sculpt a ramp",
            code: `import { createShape, deformGeometry, parametricSurface, smoothCurve } from "@nayan-ui/engine";

const height = smoothCurve([[0, 0], [0.5, 1], [1, 0.4]]);

export function rampMesh() {
  const flat = parametricSurface((u, v) => [(u - 0.5) * 4, 0, (0.5 - v) * 8]);
  return createShape(deformGeometry(flat, ([x, , z], [, v]) => [x, height(v), z]), { center: false });
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
    ],
  },
];
