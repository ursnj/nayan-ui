import type { EngineGuide } from "./types";

export const WorldRenderingGuides: EngineGuide[] = [
  {
    slug: "world-entities",
    title: "Worlds, entities and lifecycle",
    description:
      "Create fixed-capacity worlds, compose reusable entities, drive motion and parent transforms, and release each world predictably.",
    sections: [
      {
        id: "create-set-and-remove",
        title: "Create, set and remove",
        paragraphs: [
          "new World(capacity) reserves space; capacity includes glyph entities and particles. count is the number of live entities. spawn(options) returns an opaque Entity and throws when full or invalid. set(entity, options) changes only fields supplied and returns false for a stale entity or rejected option. despawn removes descendants too; has tests existence.",
        ],
        examples: [
          {
            title: "Entity operations",
            code: `import { World } from "@nayan-ui/engine";
export function addPlayer(world: World) {
  const player = world.spawn({ mesh: "capsule", position: [0, 1, 0], color: [0.3, 0.7, 1] });
  world.set(player, { scale: [1, 1.5, 1], rotation: [0, 0, 0, 1] });
  if (world.has(player)) console.log(world.position(player));
  return () => world.despawn(player);
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "entityoptions-reference",
        title: "EntityOptions reference",
        paragraphs: [],
        table: {
          headers: ["API / option", "Behavior"],
          rows: [
            [
              "mesh",
              "Shape or Model; defaults to cube. none is invisible and useful as a group/pivot.",
            ],
            [
              "position / rotation / scale",
              "Position Vec3; quaternion rotation; uniform numeric scale or Vec3. Child transforms are parent-relative.",
            ],
            ["color", "RGB/RGBA. Alpha controls transparency; channels above one glow."],
            [
              "texture / textureRegion",
              "Texture or null; normalized atlas rectangle [u0,v0,u1,v1]. When changing texture with set(), also pass mesh.",
            ],
            [
              "velocity / groundVelocity",
              "Full velocity Vec3; horizontal [x,z] preserving existing vertical velocity.",
            ],
            [
              "acceleration / spin",
              "Acceleration for non-dynamic motion; angular velocity in radians/sec.",
            ],
            ["bob", "{amplitude: Vec3, speed, phase?}; a visual offset. null removes it."],
            ["follow", "{target: Entity, speed}; ground chase. null removes it."],
            ["lifetime", "Seconds before shrinking/despawning; null clears."],
            ["parent", "Entity handle or null. Attached entities cannot own physics."],
            [
              "physics / impact",
              "Physics body/options or null; impact sound/haptic configuration or null.",
            ],
            [
              "text / font / align / letterSpacing / tabular",
              "Text content and layout instead of a mesh. A font is required when text is supplied.",
            ],
            ["pickable", "Defaults true; set false for scenery that should not receive taps."],
          ],
        },
      },
      {
        id: "parenting-and-independent-actors",
        title: "Parenting and independent actors",
        paragraphs: [
          "Attach visual children to an invisible root. They inherit translation, rotation and scale and disappear with the parent. Put physics on the root; attached children are visual rather than separate rigid bodies. For independent collision bodies, spawn independent entities.",
        ],
        examples: [
          {
            title: "Compose a collectible",
            code: `import { World } from "@nayan-ui/engine";
export function addCollectible(world: World) {
  const root = world.spawn({ mesh: "none", position: [2, 1, 0], spin: [0, 1, 0] });
  world.spawn({ mesh: "torus", parent: root, scale: 0.8, color: [1, 0.7, 0.1] });
  world.spawn({ mesh: "sphere", parent: root, scale: 0.3, color: [1, 1, 0.5] });
  return root;
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "movement-bounds-and-queries",
        title: "Movement, bounds and queries",
        paragraphs: [
          "position returns the simulated, parent-relative position. worldPosition returns the last rendered world position, including hierarchy and interpolation. velocity returns current velocity. These return null for removed entities; pass an output tuple to reuse storage. Do not interpret a query as a frame subscription.",
          "world.bounds = [minX,minZ,maxX,maxZ] confines non-physics movement on the ground plane. null removes it. Rigid bodies need actual walls. world.gravity defaults to [0,-9.81,0]. world.listener controls spatial attenuation/panning of impact sounds; null clears the listener.",
        ],
        examples: [
          {
            title: "Reuse query storage",
            code: `import { World, type Entity } from "@nayan-ui/engine";
export function makeTracker(world: World, entity: Entity) {
  const out: [number, number, number] = [0, 0, 0];
  world.bounds = [-20, -20, 20, 20];
  world.listener = entity;
  return () => { if (world.worldPosition(entity, out)) console.log(out[0], out[1], out[2]); };
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "update-pause-reset-and-dispose",
        title: "Update, pause, reset and dispose",
        paragraphs: [
          "World.update(dt) advances native/WASM fixed 60 Hz steps, refreshes render buffers and dispatches completed animations, timers and scoreboard changes. GameView caps dt at 0.1 seconds and supplies zero until a frame has actually appeared. paused prevents its callback and drawing, preserving the mounted scene.",
          "A reset is your game policy: clear timers and held input, despawn actors and spawn a new run while reusing assets. World has no reset() or start() method. dispose() is idempotent, resolves pending animation promises and clears timers; subsequent active operations throw. Always release worlds on unmount and unsubscribe application-owned listeners.",
        ],
      },
    ],
  },
  {
    slug: "game-view",
    title: "GameView, quality and overlays",
    description:
      "Configure the shared frame loop, rendering surface, errors, performance reporting and screen-space engine UI.",
    sections: [
      {
        id: "gameview-props",
        title: "GameView props",
        paragraphs: [],
        table: {
          headers: ["API / option", "Behavior"],
          rows: [
            ["source", "Required RenderSource, usually a World. Keep it stable during a visit."],
            [
              "onUpdate(dt)",
              "Seconds since the previous rendered frame; step each scene/overlay once yourself.",
            ],
            [
              "camera / light",
              "Mutable Camera and Light objects read each frame. See Camera and lighting.",
            ],
            ["background / fog", "Clear/fog RGB, default [0.04,0.05,0.09]; fog density default 0."],
            ["quality", "auto (default), high, medium, low or lowest."],
            [
              "paused",
              "Stops updates/drawing and cancels active gestures while keeping the surface.",
            ],
            ["style", "CSSProperties on React; ViewStyle on React Native."],
            [
              "onTap / onSwipe / onDrag / onLongPress / onPinch",
              "Shared gesture callbacks in local CSS pixels/view points.",
            ],
            [
              "overlay / onOverlayTouch",
              "A separate screen-space RenderSource and touch capture callback.",
            ],
            ["onStats", "Once-per-second GameStats reporting."],
            ["onError", "Receives initialization/rendering errors. Defaults to console.error."],
          ],
        },
      },
      {
        id: "quality-levels-and-statistics",
        title: "Quality levels and statistics",
        paragraphs: [
          "Auto quality starts high and adjusts when sustained drawing cost cannot keep up. Lower shadow detail comes first, followed by antialiasing and resolution. It does not fix expensive JavaScript gameplay. updateMs and renderMs measure CPU-side time, not a GPU timestamp or the full cost of every browser compositor operation.",
        ],
        examples: [
          {
            title: "Observe rendering cost",
            code: `import { GameView, type RenderSource } from "@nayan-ui/engine";
export function Preview({ source }: { source: RenderSource }) {
  return <GameView source={source} quality="auto"
    onStats={({ fps, updateMs, renderMs, quality, backend }) => {
      console.log({ fps, updateMs, renderMs, quality, backend });
    }} onError={error => console.error(error.message)} />;
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
        table: {
          headers: ["API / option", "Behavior"],
          rows: [
            ["high", "Pixel ratio cap 3; 4× MSAA; 2048 shadow map; soft shadows."],
            ["medium", "Pixel ratio cap 3; 4× MSAA; 1024 shadow map; soft shadows."],
            ["low", "Pixel ratio cap 3; 1× MSAA; 1024 shadow map; hard shadows."],
            ["lowest", "Pixel ratio cap 2; 1× MSAA; 512 shadow map; hard shadows."],
            [
              "GameStats",
              "fps, updateMs, renderMs, quality, backend. Browser backend is webgpu or gl; native is metal, vulkan or gl.",
            ],
          ],
        },
      },
      {
        id: "draw-engine-ui-over-a-scene",
        title: "Draw engine UI over a scene",
        paragraphs: [
          "An overlay uses view points: X right, Y up from the top-left, so visible screen Y is negative; Z ranges from -100 to 100 toward the viewer. It is unlit and drawn in front of the scene. Supply the container width and height yourself when placing controls. GameView does not step the overlay automatically.",
          'Return true from onOverlayTouch("start", x, y) only when a control was hit. That gesture then belongs to the overlay, including move/end/cancel, and is excluded from scene gestures. World.pick uses the scene camera; test overlay rectangles yourself.',
        ],
        examples: [
          {
            title: "Overlay controls",
            code: `import { GameView, type World } from "@nayan-ui/engine";
export function SceneWithHud({ world, hud, onStart }: { world: World; hud: World; onStart: () => void }) {
  // hud was created after warmUpEngine(), and is disposed by its owner.
  return <GameView source={world} overlay={hud}
    onUpdate={dt => { world.update(dt); hud.update(dt); }}
    onOverlayTouch={(phase, x, y) => {
      const inside = x >= 20 && x <= 140 && y >= 20 && y <= 70;
      if (phase === "start") return inside;
      if (phase === "end" && inside) onStart();
      return true;
    }} />;
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
        note: "Share the same screen-space sizing convention with your layout. In React use ResizeObserver or a measured DOM container; on React Native use onLayout. A fixed browser pixel size is not a substitute for measuring a responsive canvas.",
      },
    ],
  },
  {
    slug: "camera-lighting",
    title: "Camera, light, fog and materials",
    description:
      "Build perspective, orthographic and following cameras, then tune directional lighting, shadows and material color.",
    sections: [
      {
        id: "camera-configuration",
        title: "Camera configuration",
        paragraphs: [
          "eye and target are mutable [x,y,z] tuples. fov is the vertical field of view in radians. ortho is an optional orthographic half-height in world units and takes precedence over fov. Avoid coincident eye/target and an exactly vertical view with an ambiguous up vector; a tiny Z offset helps a top-down board.",
        ],
        examples: [
          {
            title: "Perspective and board cameras",
            code: `import type { Camera } from "@nayan-ui/engine";
export const perspective: Camera = { eye: [8, 6, 12], target: [0, 1, 0], fov: Math.PI / 3 };
export const board: Camera = { eye: [0, 20, 0.01], target: [0, 0, 0], fov: 1, ortho: 6 };
// Use either object as <GameView camera={...} />.`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "follow-and-shake",
        title: "Follow and shake",
        paragraphs: [
          "camera.follow = {target,offset,smoothing?} follows an entity using its drawn position. offset is measured from the followed target, and smoothing roughly expresses catch-up time in seconds (default 0.15; zero is rigid). Set follow to null to return to direct control. Shake is a world-unit amplitude that decays automatically.",
        ],
        examples: [
          {
            title: "Camera feedback",
            code: `import type { Camera, Entity } from "@nayan-ui/engine";
export function chase(camera: Camera, player: Entity) {
  camera.follow = { target: player, offset: [0, 4, 7], smoothing: 0.12 };
  camera.shake = 0.2;
}
export function stopChasing(camera: Camera) { camera.follow = null; }`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "directional-light-and-fog",
        title: "Directional light and fog",
        paragraphs: [
          "Light.direction points toward the light and need not be normalized. ambient is 0..1. shadows defaults true; shadowExtent is the half-size of the shadowed region around the camera target, default 30. A region too small clips distant shadows; a larger region reduces detail at a fixed shadow resolution.",
          "Light.color multiplies sunlight and ambient, default white. Mesh shine is configured when loading a model or registering a shape, rather than on every entity. Background is also the fog color. Fog defaults off.",
        ],
        examples: [
          {
            title: "Evening environment",
            code: `import { GameView, type World, type Light } from "@nayan-ui/engine";
const light: Light = { direction: [-0.5, 0.8, 0.3], ambient: 0.3, color: [0.8, 0.85, 1], shadows: true, shadowExtent: 24 };
export function Evening({ world }: { world: World }) {
  return <GameView source={world} light={light} background={[0.12, 0.16, 0.24]}
    fog={0.02} onUpdate={dt => world.update(dt)} />;
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
    description:
      "Use Rapier rigid bodies, custom colliders, collision layers, sensors, impulses and world-space raycasts through the shared API.",
    sections: [
      {
        id: "choose-a-body-and-collider",
        title: "Choose a body and collider",
        paragraphs: [
          'dynamic bodies respond to gravity, contact and impulses. kinematic bodies are moved by gameplay and can push dynamic bodies. fixed bodies stay stationary. A shorthand physics: "dynamic" uses defaults. Built-in collider defaults match supported shapes; imported/procedural models normally use an enclosing box, not their exact triangle surface.',
          "Collider dimensions are established from the entity at body creation. Later visual scale changes do not resize an existing collider. Set explicit collider dimensions for game-specific collision volumes. Attached child entities cannot own physics.",
        ],
        examples: [
          {
            title: "Floor, player and trigger",
            code: `import { World } from "@nayan-ui/engine";
export function setupPhysics(world: World) {
  world.gravity = [0, -9.81, 0];
  world.spawn({ mesh: "cube", position: [0, -0.5, 0], scale: [30, 1, 30], physics: "fixed" });
  const player = world.spawn({ mesh: "capsule", position: [0, 2, 0], physics: {
    type: "dynamic", shape: "capsule", radius: 0.4, height: 1.8,
    upright: true, ccd: true, layer: 2, mask: 1 | 4,
  } });
  const pickup = world.spawn({ mesh: "sphere", position: [3, 1, 0], physics: {
    type: "fixed", shape: "ball", radius: 0.7, layer: 4, mask: 2, sensor: true,
  } });
  return { player, pickup };
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "physicsoptions-reference",
        title: "PhysicsOptions reference",
        paragraphs: [],
        table: {
          headers: ["API / option", "Behavior"],
          rows: [
            [
              "type / shape",
              "dynamic | kinematic | fixed; shape is ball | box | cylinder | capsule | cone.",
            ],
            [
              "radius / height / size",
              "Explicit radius, total height or full box size Vec3; default from mesh/entity dimensions.",
            ],
            ["friction / bounce / density", "Defaults 0.5, 0 and 1. Density is mass per volume."],
            ["drag / angularDrag", "Linear and angular damping; defaults 0 and 0.05."],
            [
              "gravityScale / upright / ccd",
              "Gravity multiplier default 1, lock tumbling, continuous collision detection.",
            ],
            [
              "layer / mask",
              "32-bit membership and interaction masks. Default layer 1, mask all. Either side allowing the other layer is sufficient in this engine.",
            ],
            ["sensor", "Reports contact without physical push."],
            [
              "planar",
              "Lock to XY motion and Z rotation for 2D games; use a camera looking down -Z.",
            ],
          ],
        },
      },
      {
        id: "steer-jump-and-consume-collisions",
        title: "Steer, jump and consume collisions",
        paragraphs: [
          "groundVelocity sets [x,z] while retaining vertical velocity; impulse is a one-off momentum change for dynamic bodies. Call forEachCollision after world.update to read that update’s events. CollisionInfo is reused, so copy needed values before keeping them beyond the callback. Either entity might already be removed by an earlier callback.",
        ],
        examples: [
          {
            title: "Input and pickup handling",
            code: `import type { World, Entity } from "@nayan-ui/engine";
export function tickPlayer(world: World, player: Entity, pickup: Entity, dt: number, x: number, z: number) {
  world.set(player, { groundVelocity: [x * 6, z * 6] });
  world.update(dt);
  world.forEachCollision((a, b, info) => {
    if (info.started && info.sensor && (a === pickup || b === pickup)) {
      world.despawn(pickup);
      world.scoreboard.add(100);
    }
  });
}
export function jump(world: World, player: Entity) { world.impulse(player, [0, 5, 0]); }`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "raycasts-and-contact-feedback",
        title: "Raycasts and contact feedback",
        paragraphs: [
          "raycast(origin,direction,maxDistance,mask?) finds the first solid collider matching the mask, excluding sensors, as of the last update. Use a normalized nonzero direction. It returns {entity,distance,normal,point} or null. Screen picking is a different query based on rendered bounds, documented under Input and picking.",
          "impact attaches automatic speed-scaled sound and haptics to solid contacts. Use world.listener to pan/attenuate sounds relative to a player. Apply application sound/haptic preferences when configuring these entity options as well as when calling feedback APIs.",
        ],
        examples: [
          {
            title: "Ground probe",
            code: `import type { World } from "@nayan-ui/engine";
export function groundBelow(world: World, x: number, y: number, z: number) {
  const hit = world.raycast([x, y + 1, z], [0, -1, 0], 20, 1);
  return hit ? { height: hit.point[1], normal: hit.normal } : null;
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
    title: "Transform animation and springs",
    description:
      "Animate positions, rotations, scales and colors in the core, including keyframes, staggered groups, loops, relative turns and interruptible springs.",
    sections: [
      {
        id: "targets-and-completion",
        title: "Targets and completion",
        paragraphs: [
          "world.animate(entityOrEntities,targetOrKeyframes,options?) returns Promise<void>. It resolves after all relevant parts finish, are replaced, stop, or their entities/world disappear. Completion is a lifetime signal, not proof that the target was reached. The world must continue receiving updates while you await an ordinary finite animation.",
          "Position, rotation, scale, color and shake use independent channels. Replacing one leaves other channels running. stopAnimation(entity) stops all channels on that entity and resolves their promises. Relative moveBy and turn start from the current state; turn uses Euler angle offsets in radians, while rotation uses a quaternion.",
        ],
        examples: [
          {
            title: "Animate and sequence safely",
            code: `import type { World, Entity } from "@nayan-ui/engine";
export async function reveal(world: World, tile: Entity, isDisposed: () => boolean) {
  await world.animate(tile, { scale: 1.15, color: [1, 0.8, 0.3] }, { duration: 0.2, easing: "back" });
  if (isDisposed() || !world.has(tile)) return;
  await world.animate(tile, { scale: 1 }, { duration: 0.15 });
}
export function spin(world: World, tile: Entity) {
  void world.animate(tile, { turn: [0, Math.PI * 2, 0] }, { duration: 1, repeat: "forever", easing: "linear" });
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "animateoptions-reference",
        title: "AnimateOptions reference",
        paragraphs: [],
        table: {
          headers: ["API / option", "Behavior"],
          rows: [
            [
              "duration / delay",
              "Seconds; duration defaults 0.3, delay 0. Duration is ignored by springs.",
            ],
            ["easing", "linear, easeIn, easeOut (default), easeInOut, back, bounce or elastic."],
            [
              "repeat / yoyo",
              "Extra runs after the first, or forever; yoyo reverses alternating runs.",
            ],
            ["stagger", "Additional delay per entity in an array; useful for reveals."],
            ["path", "linear (default) or smooth through positional keyframes."],
            [
              "spring",
              "true, bouncy or {stiffness?,damping?,mass?}; defaults 170/26/1 for custom settings.",
            ],
            [
              "Keyframe.at",
              "Normalized time within the duration, 0..1; defaults to evenly spaced. At most 64 keyframes.",
            ],
            [
              "AnimateTarget",
              "position, rotation, scale, color, moveBy, turn, shake. Unspecified fields keep their current animation/state.",
            ],
          ],
        },
      },
      {
        id: "paths-group-stagger-and-springs",
        title: "Paths, group stagger and springs",
        paragraphs: [
          'Use keyframes for a defined timeline and springs for interactive following. A replaced spring retains its velocity for a continuous response. A repeat: "forever" promise resolves only when interrupted or disposed; do not await it before starting the game loop.',
        ],
        examples: [
          {
            title: "Hop, reveal and follow",
            code: `import type { World, Entity } from "@nayan-ui/engine";
export function animateBoard(world: World, tiles: readonly Entity[]) {
  void world.animate(tiles, { scale: 1 }, { stagger: 0.03, easing: "back" });
}
export function hop(world: World, piece: Entity) {
  return world.animate(piece, [
    { moveBy: [0, 0, 0], at: 0 },
    { moveBy: [1, 2, 0], at: 0.5 },
    { moveBy: [2, 0, 0], at: 1 },
  ], { duration: 0.6, path: "smooth" });
}
export function followPointer(world: World, cursor: Entity, x: number, z: number) {
  void world.animate(cursor, { position: [x, 0, z] }, { spring: { stiffness: 220, damping: 20 } });
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
    ],
  },
];
