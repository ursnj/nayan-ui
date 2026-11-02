import type { EngineGuide } from "./types";

export const WorldRenderingGuides: EngineGuide[] = [
  {
    slug: "world-entities",
    title: "Worlds, entities and lifecycle",
    description:
      "Create a world, spawn and change entities, rotate them with quat, query their state and dispose the scene safely.",
    sections: [
      {
        id: "lifecycle-rules",
        title: "The five lifecycle rules",
        paragraphs: [
          "Every engine scene follows the same five rules. Following them prevents almost every blank screen, leak and crash.",
          "1. Create the World inside a React effect, after await warmUpEngine() (required on the web, harmless on native). Never create it in useMemo, at module scope or during render. 2. Step it exactly once per frame: call world.update(dt) from GameView's onUpdate and nowhere else. 3. If you queue moves on world.transforms, call world.transforms.flush() once at the end of the same onUpdate, after world.update(dt); it is not flushed automatically. 4. Call world.dispose() in the effect's cleanup, and cancel any setup that finishes after unmount. 5. Use world.isDisposed instead of keeping your own disposed flag: after dispose, despawn, set, has, animate, stopAnimation, impulse, playClip, stopClip, after, cancelTimer, cancelTimers, the queries and forEachCollision are safe no-ops, so late animation promises and timers need no guard. spawn, update, burst and the effects still throw, because calling them on a disposed world is a bug.",
        ],
        examples: [
          {
            title: "useSpinningCube.ts",
            description:
              "A complete, copyable scene hook. Pass the returned world and update function to GameView. Works unchanged in React and React Native.",
            code: `import { useEffect, useState } from "react";
import { warmUpEngine, World, quat } from "@nayan-ui/engine";

export function useSpinningCube() {
  const [scene, setScene] = useState<{ world: World; update: (dt: number) => void } | null>(null);
  useEffect(() => {
    let cancelled = false;
    let world: World | undefined;
    void warmUpEngine().then(() => {
      if (cancelled) return; // Unmounted while warming up: create nothing.
      const owned = new World(64);
      world = owned;
      const cube = owned.spawn({ mesh: "cube", color: [0.2, 0.7, 1] });
      let angle = 0;
      const turn: [number, number, number, number] = [0, 0, 0, 1];
      const update = (dt: number) => {
        owned.update(dt); // Rule 2: once per frame.
        angle += dt;
        quat.y(angle, turn); // No allocation per frame.
        owned.transforms.rotation(cube, turn[0], turn[1], turn[2], turn[3]);
        owned.transforms.flush(); // Rule 3: after update, once.
      };
      setScene({ world: owned, update });
    }).catch((error: unknown) => console.error(error));
    return () => {
      cancelled = true;
      world?.dispose(); // Rule 4.
    };
  }, []);
  return scene;
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
        note: "World has no start(), reset() or pause() method. Pause by passing paused to GameView (or by not calling update). Reset is your own function: cancel timers, despawn the round's entities and spawn new ones in the same world.",
      },
      {
        id: "create-set-and-remove",
        title: "Create, set and remove",
        paragraphs: [
          "new World(capacity) reserves a fixed number of entity slots; capacity also covers text letters and particles, so size it for the busiest moment. world.count is the number of live entities.",
          "spawn(options) returns an opaque Entity handle and throws when the world is full or an option is invalid. set(entity, options) changes only the fields you pass (null removes an option) and returns false if the entity is gone, the world is disposed or an option was rejected. despawn(entity) removes the entity and everything attached to it and returns false if it was already gone. has(entity) tells you whether it still exists. Keep the handle spawn returns; never invent numeric IDs.",
        ],
        examples: [
          {
            title: "Spawn, change and remove an entity",
            description: "Call once during scene setup. The returned function removes the player.",
            code: `import { World, quat } from "@nayan-ui/engine";
export function addPlayer(world: World) {
  const player = world.spawn({ mesh: "capsule", position: [0, 1, 0], color: [0.3, 0.7, 1] });
  world.set(player, { scale: [1, 1.5, 1], rotation: quat.y(Math.PI / 2) });
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
        paragraphs: [
          "spawn and set take the same EntityOptions object. Import the type to share configurations between spawns.",
        ],
        table: {
          headers: ["API / option", "Behavior"],
          rows: [
            [
              "mesh",
              "Shape or Model; defaults to cube. none is invisible and useful as a group/pivot. Built-in shapes: cube, sphere, plane, cylinder, cone, capsule, torus, roundedBox, puff, flame, none.",
            ],
            [
              "position / rotation / scale",
              "Position Vec3; rotation quaternion [x,y,z,w] (build it with quat); uniform numeric scale or Vec3. Child transforms are parent-relative.",
            ],
            ["color", "RGB/RGBA. Alpha below 1 draws see-through; channels above 1 glow."],
            [
              "texture / textureRegion",
              "Texture (from loadTexture or DrawingDocument.texture()) or null; normalized atlas rectangle [u0,v0,u1,v1]. When changing texture with set(), also pass mesh.",
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
        id: "rotations-with-quat",
        title: "Rotations with quat",
        paragraphs: [
          "Rotations are quaternions [x, y, z, w]. Do not write them by hand: use the quat helpers, which return a MutableQuat you can pass straight to rotation options, keyframes and geometry parts. Angles are in radians.",
          "Every helper takes an optional last out argument. Pass a reused array in per-frame code so nothing is allocated; omit it in setup code. multiply(a, b) means a after b: b turns first. out may be a or b.",
        ],
        table: {
          headers: ["Helper", "Result"],
          rows: [
            ["quat.identity", "No rotation (a read-only Quat)."],
            ["quat.x(angle, out?)", "Pitch: rotation around the x axis."],
            [
              "quat.y(angle, out?)",
              "Yaw/heading: rotation around the y axis (the usual choice for ground actors).",
            ],
            ["quat.z(angle, out?)", "Roll; also the spin for 2D games looking down -z."],
            ["quat.axisAngle(x, y, z, angle, out?)", "Rotation around a unit axis."],
            ["quat.multiply(a, b, out?)", "Combine rotations: a after b."],
            [
              "quat.fromEuler(x, y, z, out?)",
              "Turn around x, then y, then z: multiply(z(z), multiply(y(y), x(x))).",
            ],
            [
              "quat.slerp(a, b, t, out?)",
              "Shortest-path blend from a (t=0) to b (t=1); use it to turn smoothly.",
            ],
          ],
        },
        examples: [
          {
            title: "Face the direction of travel and turn smoothly",
            description:
              "Call setup once; call steer from onUpdate after world.update(dt) and flush the transforms once at the end of the frame. The scratch arrays are reused, so steering allocates nothing. quat.y(Math.atan2(x, z)) faces a model whose front is +z toward (x, z).",
            code: `import { quat, type Entity, type MutableQuat, type World } from "@nayan-ui/engine";

export function makeSteering(world: World, actor: Entity) {
  const current: MutableQuat = [0, 0, 0, 1];
  const target: MutableQuat = [0, 0, 0, 1];
  return (dt: number, moveX: number, moveZ: number) => {
    if (moveX !== 0 || moveZ !== 0) quat.y(Math.atan2(moveX, moveZ), target);
    quat.slerp(current, target, Math.min(1, dt * 10), current); // out may be an input
    world.transforms.rotation(actor, current[0], current[1], current[2], current[3]);
  };
}

// Setup-time rotations can allocate freely:
export function addSign(world: World) {
  const tilt = quat.multiply(quat.y(Math.PI / 4), quat.x(-0.3)); // tilt first, then turn
  return world.spawn({ mesh: "cube", scale: [2, 1, 0.1], rotation: tilt });
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
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
            description:
              "Call once per collectible. Despawning the returned root removes both parts.",
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
          "position(entity) returns the simulated, parent-relative position. worldPosition(entity) returns where it was last drawn in world space, including parents and smoothing. velocity(entity) returns the current velocity. All three return null for removed entities (and after dispose).",
          "Every query takes an optional out argument: position, worldPosition and velocity fill a [x, y, z] tuple, raycast and pick fill a hit object, toScreen fills [x, y] and screenToWorld fills [x, y, z]. Pass a reused value in per-frame code so a 60 fps loop allocates nothing. toScreen and screenToWorld use the last drawn camera, so they return null until the first frame is on screen.",
          "world.bounds = [minX, minZ, maxX, maxZ] keeps moving non-physics entities inside a rectangle; null removes it. Rigid bodies need real walls. world.gravity defaults to [0, -9.81, 0]. world.listener is the entity impact sounds pan and fade relative to; null clears it.",
        ],
        examples: [
          {
            title: "Read positions without allocating",
            description:
              "Create the tracker once; call the returned function from onUpdate after world.update(dt).",
            code: `import { World, type Entity } from "@nayan-ui/engine";
export function makeTracker(world: World, player: Entity, onFall: () => void) {
  const at: [number, number, number] = [0, 0, 0];
  world.bounds = [-20, -20, 20, 20];
  world.listener = player;
  return () => {
    if (world.position(player, at) && at[1] < -5) onFall();
  };
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
          "world.update(dt) advances fixed 60 Hz steps, refreshes what GameView draws and then runs finished animation promises, due timers and scoreboard handlers. GameView caps dt at 0.1 seconds and passes 0 until a frame has actually appeared. Passing paused to GameView stops both its onUpdate callback and drawing while keeping the scene mounted.",
          "A reset is your own function: cancel timers, despawn the round's actors, reset the scoreboard and spawn the next round in the same world while reusing loaded assets. Call world.update(0) afterwards if the new layout must be visible before the clock runs.",
          "dispose() frees the native world; calling it twice is safe. Pending animation promises resolve and timers are dropped. After it, world.isDisposed is true, cleanup calls and queries are no-ops (false, null, 0 or a resolved promise) and spawn and update throw. So world.animate(e, ...).then(() => world.despawn(e)) needs no guard, but code that spawns new entities after an await should check world.isDisposed first.",
        ],
        examples: [
          {
            title: "Spawn safely after an await",
            description:
              "Late continuations only need a guard when they spawn. Cleanup calls such as despawn are already safe after dispose.",
            code: `import { World, type Entity } from "@nayan-ui/engine";
export async function popAndReplace(world: World, piece: Entity) {
  await world.animate(piece, { scale: 0 }, { duration: 0.2 });
  world.despawn(piece); // Safe even if the screen closed meanwhile.
  if (world.isDisposed) return null; // spawn would throw on a disposed world.
  return world.spawn({ mesh: "cube", position: [0, 4, 0] });
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
    description: "Connect the frame loop, gestures, quality settings and overlays.",
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
            [
              "background / fog",
              "Sky/clear color as a Color (RGB, or RGBA with alpha ignored), default dark navy; it is also the fog color. fog is the density toward it, default 0 (off).",
            ],
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
            ["onStats", "Once-per-second GameViewStats reporting."],
            ["onError", "Receives initialization/rendering errors. Defaults to console.error."],
          ],
        },
      },
      {
        id: "quality-levels-and-statistics",
        title: "Render quality levels and statistics",
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
              "GameViewStats",
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
    description: "Set perspective, orthographic and following cameras, lighting and fog.",
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
          "Light.color is a Color (alpha ignored) that multiplies sunlight and ambient, default white; glowing colors above 1 are unaffected, so lamps stay lit at night. Mesh shine is configured when loading a model or registering a shape, rather than on every entity. Background is also the fog color. Fog defaults off.",
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
    description: "Add rigid bodies, sensors, collision filters, impulses and raycasts.",
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
    description: "Animate transforms with keyframes, springs, loops and stagger.",
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
