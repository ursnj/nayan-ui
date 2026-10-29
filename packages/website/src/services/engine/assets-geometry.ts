import type { EngineGuide } from "./types";

export const AssetsGeometryGuides: EngineGuide[] = [
  {
    slug: "skeletal-animation",
    title: "Skeletal models and animation clips",
    description: "Load GLB clips, control each character and sample animated vertices.",
    sections: [
      {
        id: "load-a-rig-and-inspect-clips",
        title: "Load a rig and inspect clips",
        paragraphs: [
          "loadModel returns LoadedModel: id, size, jointCount and animations [{name,duration}]. Use metadata rather than assuming a model contains a clip named walk. Geometry, joint weights, hierarchy and inverse bind matrices are retained by the core. Each entity has its own playback state; sharing a model does not synchronize every character.",
        ],
        examples: [
          {
            title: "Load a browser character",
            code: `import { loadModel } from "@nayan-ui/engine";
export const loadCharacter = () => loadModel("/models/character.glb", { center: false });`,
            platform: "react",
            language: "tsx",
          },
          {
            title: "Load a native character",
            code: `import { loadModel } from "@nayan-ui/engine";
export const loadCharacter = () => loadModel(require("./assets/character.glb"), { center: false });`,
            platform: "native",
            language: "tsx",
          },
        ],
      },
      {
        id: "playback-hold-crossfade-and-stop",
        title: "Playback, hold, crossfade and stop",
        paragraphs: [
          "playClip(entity,name,{loop?,speed?,fade?,time?}) returns boolean. Defaults: loop true, speed 1, fade 0.15 seconds; omitted time continues rather than seeking. Re-selecting the same clip changes speed without restarting it. Explicit time seeks in seconds. stopClip(entity,false) holds the current pose; true returns to bind pose.",
          "For a ready screen, select a known idle clip at time: 0 and speed: 0. Begin playback on Start. Movement of the entity remains gameplay’s responsibility; playing a clip is not a character controller or automatic terrain grounding.",
        ],
        examples: [
          {
            title: "Independent clip players",
            code: `import type { World, LoadedModel } from "@nayan-ui/engine";
export function addCharacters(world: World, model: LoadedModel) {
  const clip = model.animations[0];
  if (!clip || model.jointCount === 0) throw new Error("This model needs a skeleton and an animation clip");
  const a = world.spawn({ mesh: model });
  const b = world.spawn({ mesh: model, position: [3, 0, 0] });
  world.playClip(a, clip.name, { speed: 0, time: 0, fade: 0 });
  world.playClip(b, clip.name, { speed: 0.8, fade: 0.2 });
  return { start: () => world.playClip(a, clip.name, { speed: 1 }), stop: () => world.stopClip(a, false) };
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "sample-selected-surface-points",
        title: "Sample selected surface points",
        paragraphs: [
          "sampleSkinnedVertices(entity,indices,output,after=0) fills reusable model-space XYZ coordinates for selected original model vertex indices. output must hold at least three floats per index. after previews the pose following an upcoming update; use the next frame dt when positioning a supporting foot for that pose. It returns false if sampling cannot be performed.",
          "The engine supports up to 128 joints in its skin palette. Query a small set of known boot/contact vertices rather than skinning the whole model in JavaScript. Convert model-space samples through the actor transform when comparing against world-space terrain. A model re-export or topology change can change vertex indices; inspect your actual asset rather than copying arbitrary indices.",
        ],
        examples: [
          {
            title: "Reuse skin point query buffers",
            code: `import type { World, Entity } from "@nayan-ui/engine";
export function makeContactSampler(world: World, actor: Entity, bootVertexIds: Uint32Array) {
  const points = new Float32Array(bootVertexIds.length * 3);
  return (nextDt: number) => world.sampleSkinnedVertices(actor, bootVertexIds, points, nextDt) ? points : null;
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
    title: "Gestures, joystick and picking",
    description: "Handle gestures, read joystick input and convert screen coordinates.",
    sections: [
      {
        id: "gesture-callbacks",
        title: "Gesture callbacks",
        paragraphs: [
          "onTap(x,y) reports a quick local tap/click. onSwipe receives left/right/up/down. onLongPress fires after a still hold (about 500 ms) and suppresses the following tap. A native touch and a browser pointer both use local view points/CSS pixels; do not multiply coordinates by devicePixelRatio.",
          "DragEvent has phase start/move/end, x/y, dx/dy from the initial point and cancelled? on interruption. PinchEvent has phase, relative scale, clockwise rotation in radians and midpoint x/y. Pinching cancels a prior drag. Release, pointer cancellation, pause and disposal must release application-held state. An overlay that claims a touch receives it instead of game gestures.",
        ],
        examples: [
          {
            title: "Pick and drag over a plane",
            code: `import { useRef } from "react";
import { GameView, type World, type Entity } from "@nayan-ui/engine";
export function DragBoard({ world }: { world: World }) {
  const held = useRef<Entity | null>(null);
  return <GameView source={world} onUpdate={dt => world.update(dt)}
    onDrag={event => {
      if (event.phase === "start") held.current = world.pick(event.x, event.y)?.entity ?? null;
      if (event.cancelled) { held.current = null; return; }
      const point = world.screenToWorld(event.x, event.y, { point: [0, 0.5, 0] });
      if (held.current !== null && point) world.set(held.current, { position: point });
      if (event.phase === "end") held.current = null;
    }} />;
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "joystick-state-without-frame-by-frame-react-renders",
        title: "Joystick state without frame-by-frame React renders",
        paragraphs: [
          "useJoystick returns a stable mutable {x,y} object. Joystick writes it from touch/pointer input; each axis ranges -1..1 and Y points up. The relative stick starts wherever the pointer lands inside the pad. Read its state from onUpdate. Place the joystick as a sibling/overlay in your host layout, not a child of GameView.",
        ],
        examples: [
          {
            title: "Read the shared joystick",
            code: `import { GameView, Joystick, useJoystick, type World, type Entity } from "@nayan-ui/engine";
export function Controls({ world, player }: { world: World; player: Entity }) {
  const stick = useJoystick();
  return <>
    <GameView source={world} onUpdate={dt => {
      world.set(player, { groundVelocity: [stick.x * 6, -stick.y * 6] });
      world.update(dt);
    }} />
    <Joystick state={stick} size={150} />
  </>;
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "pick-project-and-intersect",
        title: "Pick, project and intersect",
        paragraphs: [
          "world.pick(x,y) tests pickable rendered bounding boxes and returns PickHit {entity,point,distance} or null. It needs a camera from a successfully drawn GameView and does not require a physics body. It is a bounds test rather than exact per-triangle ray intersection.",
          "screenToWorld(x,y,{point?,normal?}) intersects a plane; defaults to ground Y=0. Use normal [0,0,1] for an XY board. toScreen(Vec3) returns [x,y] or null when behind the camera or not yet drawn. These queries use the most recently rendered view. setView(matrix,width,height) is for custom render integration, not necessary for an ordinary World in GameView.",
        ],
        examples: [
          {
            title: "Project a label and query a board",
            code: `import type { World, Vec3 } from "@nayan-ui/engine";
export function queryScreen(world: World, x: number, y: number, position: Vec3) {
  return {
    entity: world.pick(x, y),
    onBoard: world.screenToWorld(x, y, { point: [0, 0, 0], normal: [0, 0, 1] }),
    label: world.toScreen(position),
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
    slug: "particles",
    title: "Particles, smoke and emissive effects",
    description: "Create sparks, confetti, fire and smoke with reusable particle settings.",
    sections: [
      {
        id: "burst-lifecycle",
        title: "Burst lifecycle",
        paragraphs: [
          "world.burst(options) returns how many particles were spawned, possibly fewer when world capacity is exhausted. Position is required. Bursts advance and expire through World.update, so they pause with the scene. Particle entities share the world capacity with normal actors and text glyphs; reserve room for peak effects.",
        ],
        examples: [
          {
            title: "Smoke and sparks",
            code: `import type { World, Vec3 } from "@nayan-ui/engine";
export function explosion(world: World, position: Vec3) {
  world.burst({ position, mesh: "puff", count: 18, color: [0.5, 0.5, 0.5, 0.5],
    size: 0.3, speed: 2, gravity: 0, lifetime: 1.5, endSize: 4, endColor: [0.2, 0.2, 0.2, 0] });
  return world.burst({ position, mesh: "flame", count: 28, direction: [0, 1, 0], spread: Math.PI / 2,
    color: [[2, 1.2, 0.2], [2, 0.4, 0.1]], speed: 7, lifetime: 0.6, endSize: 0.1 });
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "burstoptions-reference",
        title: "BurstOptions reference",
        paragraphs: [],
        table: {
          headers: ["API / option", "Behavior"],
          rows: [
            [
              "position / direction / spread",
              "Origin; main direction default [0,1,0]; cone half-angle default π (all directions).",
            ],
            ["count / mesh", "Defaults 16 particles and cube. Shape or Model may be reused."],
            [
              "size / speed / lifetime",
              "Defaults 0.15 world units, maximum speed 5 units/sec, lifetime 0.8 sec.",
            ],
            ["gravity", "Vertical acceleration, default -9.81; zero makes a floating effect."],
            [
              "color",
              "One Color or an array of up to four colors chosen per particle; default white.",
            ],
            ["endSize", "Multiplier of initial size at end of life; default 1."],
            ["endColor", "Optional RGB/RGBA destination color, including alpha fading."],
          ],
        },
      },
      {
        id: "puff-and-flame-materials",
        title: "Puff and flame materials",
        paragraphs: [
          "puff is a soft billboard that faces the camera and alpha-blends with the scene. flame uses the same sprite additively, so overlap builds a bright core. They are rendering shapes rather than solid physical colliders, and shapeGeometry does not support them. Bright entity colors are distinct from bloom or a dynamic light source.",
        ],
      },
    ],
  },
  {
    slug: "models-textures",
    title: "Models, textures and asset loading",
    description: "Load models and images, handle errors and apply textures.",
    sections: [
      {
        id: "asset-sources-on-each-platform",
        title: "Asset sources on each platform",
        paragraphs: [
          "React: pass a URL or bundler asset import. React Native: pass a URI or Metro require(...). Add glb/gltf to Metro and install expo-asset for bundled Android release assets.",
          "Async asset loaders initialize the core and reuse decoded resources. Load outside onUpdate. Await warmUpEngine() before synchronous worlds or procedural meshes. Each scene still owns its World.",
        ],
        examples: [
          {
            title: "Browser asset preparation",
            code: `import { loadModel, loadTexture } from "@nayan-ui/engine";
export async function loadAssets() {
  const [tree, bark] = await Promise.all([
    loadModel("/models/tree.glb", { center: false, fit: 3, shine: 0.1 }),
    loadTexture("/textures/bark.jpg"),
  ]);
  return { tree, bark };
}`,
            platform: "react",
            language: "tsx",
          },
          {
            title: "React Native asset preparation",
            code: `import { loadModel, loadTexture } from "@nayan-ui/engine";
export async function loadAssets() {
  const [tree, bark] = await Promise.all([
    loadModel(require("./assets/tree.glb"), { center: false, fit: 3, shine: 0.1 }),
    loadTexture(require("./assets/bark.jpg")),
  ]);
  return { tree, bark };
}`,
            platform: "native",
            language: "tsx",
          },
        ],
      },
      {
        id: "loading-errors-and-retry",
        title: "Loading errors and retry",
        paragraphs: [
          "Model, texture and font errors include the API name, source and Error.cause. Call the loader again to retry. Rejected payloads are discarded; initialization and network failures preserve saved data.",
          "Show loading, errors and a Retry action. Ignore late results after unmount. SoundBank.ready resolves after all attempts; failed sounds log and skip. Never retry from onUpdate.",
        ],
        examples: [
          {
            title: "useBoardTexture.ts",
            code: `import { useEffect, useState } from "react";
import { loadTexture, type AssetSource, type Texture } from "@nayan-ui/engine";
export function useBoardTexture(source: AssetSource) {
  const [attempt, setAttempt] = useState(0);
  const [texture, setTexture] = useState<Texture | null>(null);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    let active = true;
    setTexture(null);
    setError(null);
    loadTexture(source).then(
      value => { if (active) setTexture(value); },
      cause => { if (active) setError(cause instanceof Error ? cause : new Error(String(cause))); },
    );
    return () => { active = false; };
  }, [source, attempt]);
  return { texture, error, retry: () => setAttempt(value => value + 1) };
}`,
            platform: "shared",
            language: "tsx",
          },
          {
            title: "React loading and error UI",
            code: `import { useBoardTexture } from "./useBoardTexture";
export function TextureStatus() {
  const { texture, error, retry } = useBoardTexture("/textures/board.png");
  if (error) return <div role="alert">{error.message} <button onClick={retry}>Retry</button></div>;
  if (!texture) return <p>Loading board…</p>;
  return <p>Ready: {texture.width} × {texture.height}</p>;
}`,
            platform: "react",
            language: "tsx",
          },
          {
            title: "React Native loading and error UI",
            code: `import { ActivityIndicator, Button, Text, View } from "react-native";
import { useBoardTexture } from "./useBoardTexture";
export function TextureStatus() {
  const { texture, error, retry } = useBoardTexture(require("./assets/board.png"));
  if (error) return <View><Text>{error.message}</Text><Button title="Retry" onPress={retry} /></View>;
  if (!texture) return <ActivityIndicator />;
  return <Text>Ready: {texture.width} × {texture.height}</Text>;
}`,
            platform: "native",
            language: "tsx",
          },
        ],
      },
      {
        id: "models-and-format-limits",
        title: "Models and format limits",
        paragraphs: [
          "loadModel(source,{center?,fit?,shine?}) parses glTF 2.0: GLB or glTF with embedded buffers. External glTF buffer references are unsupported; export a self-contained GLB or embed data. Node transforms, vertex/material colors and one base-color texture per resulting model are retained. EXT_meshopt_compression data is decoded during loading before mesh, skin and clip readers run. This is not a general importer for every glTF material extension.",
          "center defaults true and centers the mesh bounding box. fit scales the longest dimension to a requested world-unit length; omitted preserves source size. shine is clamped to 0..1, default 0. A LoadedModel exposes readonly id/size plus animations and jointCount. Skeletal clips are covered in the skeletal guide. Preserve source licenses when shipping third-party models.",
        ],
        table: {
          headers: ["API / option", "Behavior"],
          rows: [
            ["Model", "{ id: number; size: Vec3 }; shared mesh handle, not an entity."],
            ["LoadedModel", "Model plus animations: readonly ModelClip[] and jointCount: number."],
            ["ModelClip", "{ name: string; duration: number } in seconds."],
            ["ModelOptions", "center?: boolean; fit?: number; shine?: number."],
          ],
        },
      },
      {
        id: "textures-tint-and-atlas-regions",
        title: "Textures, tint and atlas regions",
        paragraphs: [
          "loadTexture supports PNG/JPEG up to 4096×4096 and returns {id,width,height}. It preserves image alpha. Textures use the mesh UVs; entity color tints the sampled color. A textureRegion uses normalized [u0,v0,u1,v1], useful for cards/sprites/atlases. Reuse mesh/texture combinations: textured variants consume mesh registrations.",
        ],
        examples: [
          {
            title: "Apply and change an atlas tile",
            code: `import type { World, Texture, Model } from "@nayan-ui/engine";
export function addCard(world: World, atlas: Texture, cardMesh: Model) {
  const card = world.spawn({ mesh: cardMesh, texture: atlas, textureRegion: [0, 0, 0.25, 0.5], color: [1, 1, 1] });
  world.set(card, { textureRegion: [0.25, 0, 0.5, 0.5] });
  // When changing the texture itself, supply mesh again:
  world.set(card, { mesh: cardMesh, texture: atlas });
  return card;
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
        note: "A textured or imported/skinned model belongs in its loader cache, not ProceduralCache. The procedural cache serializes static untextured geometry; it does not retain texture bindings or skeleton data.",
      },
    ],
  },
  {
    slug: "text-fonts",
    title: "Fonts, text and measurement",
    description: "Load fonts, draw text and align changing scores.",
    sections: [
      {
        id: "load-font-outlines",
        title: "Load font outlines",
        paragraphs: [
          "loadFont(source,{depth?,chars?,weight?}) reads TrueType/OpenType outlines. depth is extrusion as a font-size fraction (default 0.2; zero is flat). chars prewarms a useful subset; space and ? are included. weight selects a variable font weight when supported, otherwise retain the font default.",
          "Additional font-supported Unicode glyphs are registered on demand during measurement or layout. Missing outlines use ?. This is not full browser text shaping, a color-emoji renderer or an automatic fallback font stack. Use a font containing the characters your game needs; imported font licenses still apply.",
        ],
        examples: [
          {
            title: "Browser font",
            code: `import { loadFont } from "@nayan-ui/engine";
export const loadHudFont = () => loadFont("/fonts/Inter-SemiBold.ttf", { depth: 0, chars: "0123456789SCORE: ", weight: 600 });`,
            platform: "react",
            language: "tsx",
          },
          {
            title: "Native font",
            code: `import { loadFont } from "@nayan-ui/engine";
export const loadHudFont = () => loadFont(require("./assets/Inter-SemiBold.ttf"), { depth: 0, chars: "0123456789SCORE: ", weight: 600 });`,
            platform: "native",
            language: "tsx",
          },
        ],
      },
      {
        id: "spawn-update-and-align-text",
        title: "Spawn, update and align text",
        paragraphs: [
          "A text entity requires font. align is left/center/right around its position (default center). letterSpacing is additional em spacing. tabular makes digits use the widest digit advance so changing scores do not shift. measureText returns the same line advance used by layout, in ems before entity scaling; multiply it by your scale for world-unit width.",
          "Text is an invisible root with a child entity per drawn glyph; every glyph counts against World.capacity. Updating text reuses existing glyph entities when possible. It remains geometry: it can be lit, shadowed and transformed in the scene; an overlay renders it unlit.",
        ],
        examples: [
          {
            title: "Create a stable score label",
            code: `import { measureText, type World, type Font } from "@nayan-ui/engine";
export function createScoreLabel(world: World, font: Font) {
  const scale = 0.5;
  const label = world.spawn({ text: "0000", font, align: "left", tabular: true,
    letterSpacing: 0.02, position: [-2, 2, 0], scale, color: [1, 1, 1] });
  const width = measureText(font, "9999", { tabular: true, letterSpacing: 0.02 }) * scale;
  return { width, set(score: number) { world.set(label, { text: String(score).padStart(4, "0") }); } };
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "font-and-text-types",
        title: "Font and text types",
        paragraphs: [],
        table: {
          headers: ["API / option", "Behavior"],
          rows: [
            [
              "Font",
              "Readonly id, capHeight and glyphs map. capHeight is the capital-letter height at scale one.",
            ],
            [
              "FontOptions",
              "depth, chars, weight. Source/depth/weight identify a shared font; chars extends its prewarmed glyph set without rebuilding existing glyphs.",
            ],
            [
              "TextLayout",
              "letterSpacing?: number; tabular?: boolean. Used by measureText and entity layout.",
            ],
            [
              "TextAlign",
              "left | center | right. Text is a single line; layout/wrapping belongs to the caller.",
            ],
          ],
        },
      },
    ],
  },
  {
    slug: "procedural-geometry",
    title: "Paths, extrusion, lathe and tube geometry",
    description: "Create meshes from paths, profiles, tubes and combined parts.",
    sections: [
      {
        id: "geometry-and-registration",
        title: "Geometry and registration",
        paragraphs: [
          "Geometry contains Float32Array vertices and Uint32Array indices. Each vertex has 11 floats: position XYZ, normal XYZ, RGB color and UV. Indices are triangle triples. Geometry is unregistered CPU data; createShape registers it and returns a Model. Equal geometry and options automatically reuse prepared models. Spawn new entities for each run; no application-level model map is needed.",
          "createShape options: center defaults true; fit sets the longest dimension; shine defaults zero; optimize defaults false and accepts true or OptimizeOptions. It copies the geometry. Built-in shapeGeometry returns copied geometry for cube, sphere, plane, cylinder, cone, capsule, torus and roundedBox after warm-up; none/puff/flame have no supported solid geometry.",
        ],
        examples: [
          {
            title: "Prepare and reuse a model",
            code: `import { warmUpEngine, createShape, shapeGeometry, type World } from "@nayan-ui/engine";
export async function loadToken() {
  await warmUpEngine();
  return createShape(shapeGeometry("roundedBox"), { fit: 1, shine: 0.25, optimize: true });
}
export async function addToken(world: World) { return world.spawn({ mesh: await loadToken(), position: [0, 1, 0] }); }`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "path-commands-and-extrusion",
        title: "Path commands and extrusion",
        paragraphs: [
          "Path coordinates use X right and Y down, like SVG. extrude flips Y so the resulting shape stands upright in the world, facing +Z. depth defaults 0.2; zero creates a one-sided flat face. nonzero is the default fillRule; evenodd makes inner contours holes regardless of winding.",
        ],
        examples: [
          {
            title: "Extrude a badge with a hole",
            code: `import { Path, extrude, createShape } from "@nayan-ui/engine";
// Build once after warmUpEngine().
export function createBadge() {
  const outline = new Path().addCircle(0, 0, 1).addCircle(0, 0, 0.35);
  return createShape(extrude(outline, { depth: 0.15, fillRule: "evenodd", color: [1, 0.75, 0.2] }), { shine: 0.5 });
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
        table: {
          headers: ["API / option", "Behavior"],
          rows: [
            [
              "moveTo / lineTo / close",
              "Begin a contour, append a line and close it; builder methods chain.",
            ],
            [
              "quadraticTo / cubicTo",
              "Quadratic and cubic Bézier controls and destination coordinates.",
            ],
            ["arcTo", "rx, ry, rotation in radians, largeArc, sweep, x, y."],
            [
              "addPolygon / addRect / addRoundedRect",
              "Polygon (optional close), rectangle and rounded rectangle.",
            ],
            [
              "addOval / addCircle / addStar",
              "Ellipse, circle and alternating inner/outer-radius star. addRegularPolygon(cx,cy,radius,sides) builds a regular polygon.",
            ],
            [
              "Path.fromSVG",
              "Parse supported SVG path commands, including relative forms. Use outlines rather than SVG markup.",
            ],
            [
              "toContours / bounds",
              "Copies of flattened contours and [minX,minY,maxX,maxY], or undefined if empty. transform(sx,sy=sx,dx=0,dy=0) returns a scaled/translated Path.",
            ],
          ],
        },
      },
      {
        id: "lathe-profiles-and-painted-cut-faces",
        title: "Lathe profiles and painted cut faces",
        paragraphs: [
          "lathe accepts a Path or [radius,y] profile points and revolves around Y. Options include segments (default 32), sweep (default 2π), color, displace(u,v), capColor/capRings and cutColor/cutSteps. Partial sweeps produce cut faces. SurfaceColor can inspect UV, position and normal; FaceColor receives normalized radius and angle.",
          "Make displacements repeat at u=0 and u=1 to avoid a seam. More cap rings/cut steps help detailed vertex-color patterns but cost vertices. Color callbacks paint vertices, not a per-pixel material shader.",
        ],
        examples: [
          {
            title: "Lathe a painted half fruit",
            code: `import { lathe, createShape } from "@nayan-ui/engine";
export function createHalfFruit() {
  return createShape(lathe([[0, -1], [0.7, -0.7], [1, 0], [0.7, 0.7], [0, 1]], {
    segments: 40, sweep: Math.PI,
    color: ({ v }) => [1, 0.35 + v * 0.2, 0.05],
    displace: (u, v) => 0.015 * Math.cos(u * Math.PI * 16) * Math.sin(v * Math.PI),
    cutColor: (radius, y) => [1, 0.6 + radius * 0.3, 0.2 + Math.abs(y) * 0.1],
    cutSteps: 12,
  }), { shine: 0.2 });
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "tubes-parts-and-surface-passes",
        title: "Tubes, parts and surface passes",
        paragraphs: [
          "tube(points,options?) sweeps a circular cross-section along a 3D polyline. radius can vary along normalized path progress. Options include radius (number or callback), sides (default 12), smoothness (default 8), shape, closed, caps, color and capColor. merge(parts) bakes position/quaternion/scale/color per part into one Geometry, useful for a reusable compound visual model.",
          "recolor mutates and returns geometry based on SurfacePoint. smoothNormals also works in place and welds coincident positions; apply it to a smooth surface before merging intentional hard-edged caps. Per-vertex alpha is not stored in the 11-float geometry layout; use entity color for transparency.",
        ],
        examples: [
          {
            title: "Merge a tube and a sphere",
            code: `import { tube, merge, shapeGeometry, recolor, createShape } from "@nayan-ui/engine";
export function createMarker() {
  const stem = tube([[0, 0, 0], [0, 0.8, 0], [0.2, 1.2, 0]], { radius: 0.08, sides: 10 });
  recolor(stem, ({ position }) => position[1] > 0.6 ? [0.3, 0.8, 0.2] : [0.15, 0.4, 0.1]);
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
    description: "Build curved surfaces, lofts, terrain and deformed geometry.",
    sections: [
      {
        id: "parametric-surfaces",
        title: "Parametric surfaces",
        paragraphs: [
          "parametricSurface(sample,options?) samples u/v from zero to one. ParametricSurfaceOptions sets uSegments (default 32), vSegments (16), wrapU/wrapV and color. Wrapped edges retain separate 0/1 UVs with coincident geometry/normals. Winding follows dP/du × dP/dv; choose your coordinate order so the front faces outward.",
        ],
        examples: [
          {
            title: "Upward-facing terrain",
            code: `import { parametricSurface, createShape } from "@nayan-ui/engine";
export function createTerrain() {
  return createShape(parametricSurface((u, v) => {
    const x = (u - 0.5) * 20, z = (0.5 - v) * 20;
    return [x, 0.4 * Math.sin(x * 0.5) * Math.cos(z * 0.4), z];
  }, { uSegments: 64, vSegments: 64, color: ({ position }) => position[1] > 0.2 ? [0.3, 0.5, 0.2] : [0.2, 0.35, 0.12] }), { center: false });
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
        note: "This creates a visual mesh. The physics system does not automatically turn its triangles into a terrain collider. Match gameplay grounding/collision to the surface you draw, or create explicit supported colliders.",
      },
      {
        id: "loft-cross-sections-and-convenience-forms",
        title: "Loft cross-sections and convenience forms",
        paragraphs: [
          "loft interpolates ordered cross-sections along Z. Each LoftSection has z, bottom, top, width (half-width), optional topWidth and square (superellipse exponent, default 4). At least two sections are required and Z must be strictly ordered. LoftOptions sets around (default 32), smoothness (default 4) and a color or (position,normal) callback.",
          "block(w,h,d,square=6,color?) makes a rounded rectangular cross-section with flat end caps. ellipsoid(radii,color?,around=16) makes an exact ellipsoid with analytic normals. These helpers return Geometry, so compose or deform them before registering.",
        ],
        examples: [
          {
            title: "Loft a reusable shell",
            code: `import { loft, block, ellipsoid, merge, createShape } from "@nayan-ui/engine";
export function createShell() {
  const body = loft([
    { z: -2, bottom: 0, top: 0.8, width: 0.6, square: 3 },
    { z: 0, bottom: 0, top: 1.2, width: 1, topWidth: 0.8, square: 4 },
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
          "smoothCurve takes increasing [x,value] points and returns clamped Hermite interpolation. It is useful for profiles and gameplay tuning. deformGeometry copies geometry and calls (position,uv) => Vec3, then recomputes normals. Apply it to smooth surfaces before combining hard edges; it does not deform an existing registered model or preserve a rig.",
        ],
        examples: [
          {
            title: "Sculpt a surface once",
            code: `import { smoothCurve, parametricSurface, deformGeometry, createShape } from "@nayan-ui/engine";
export function createRamp() {
  const height = smoothCurve([[0, 0], [0.5, 1], [1, 0.4]]);
  const base = parametricSurface((u, v) => [(u - 0.5) * 4, 0, (0.5 - v) * 8]);
  return createShape(deformGeometry(base, (position, uv) => [position[0], height(uv[1]), position[2]]), { center: false });
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
    ],
  },
];
