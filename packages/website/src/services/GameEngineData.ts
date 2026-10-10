// Option tables for the @nayan-ui/engine docs (rendered with <Attributes />).
// Keep them in sync with packages/engine/src.

export const entityOptionsAttributes = [
  { name: "mesh", type: "Shape | Model", default: '"cube"', details: 'A built-in shape ("cube", "sphere", "plane", "cylinder", "cone", "capsule", "torus", "roundedBox" or "none") or a model from loadModel.' },
  { name: "texture", type: "Texture | null", default: "none", details: "An image from loadTexture, drawn on the mesh. In set, pass mesh with it." },
  { name: "textureRegion", type: "[u0, v0, u1, v1]", default: "whole texture", details: "Part of the texture to show, each 0..1: sprite sheets and card atlases." },
  { name: "text", type: "string", default: "none", details: "3D text instead of a mesh. Needs font. Letters are 1 unit tall at scale 1." },
  { name: "font", type: "Font", default: "none", details: "A font from loadFont, for text." },
  { name: "align", type: '"left" | "center" | "right"', default: '"center"', details: "How text lines up around its position." },
  { name: "position", type: "[x, y, z]", default: "[0, 0, 0]", details: "Where it is. Relative to the parent when attached." },
  { name: "rotation", type: "[x, y, z, w]", default: "[0, 0, 0, 1] (none)", details: "A quaternion. Relative to the parent when attached." },
  { name: "scale", type: "number | [x, y, z]", default: "1", details: "Size. Also sizes the default collider. Children scale with their parent." },
  { name: "color", type: "[r, g, b] | [r, g, b, a]", default: "[1, 1, 1]", details: "Each channel 0..1. Alpha below 1 makes it see-through. Tints a texture." },
  { name: "velocity", type: "[x, y, z]", default: "none", details: "Units per second." },
  { name: "groundVelocity", type: "[x, z]", default: "none", details: "Horizontal speed that keeps the vertical one: steer a body and it still falls." },
  { name: "acceleration", type: "[x, y, z]", default: "none", details: "Units per second², for entities without a dynamic body: falling debris, thrown items." },
  { name: "spin", type: "[x, y, z]", default: "none", details: "Radians per second around each axis." },
  { name: "bob", type: "{ amplitude, speed, phase? } | null", default: "none", details: "A visual bob: the drawn position moves by amplitude × sin(phase). Doesn't move the collider. See Bob options." },
  { name: "follow", type: "{ target, speed } | null", default: "none", details: "Chase another entity along the ground at speed units per second. See Follow options." },
  { name: "lifetime", type: "number | null", default: "none", details: "Seconds until it shrinks away and is despawned." },
  { name: "parent", type: "Entity | null", default: "none", details: "Attach to another entity, to any depth. It moves, turns and scales with the parent. Visual only: no physics." },
  { name: "physics", type: '"dynamic" | "kinematic" | "fixed" | PhysicsOptions | null', default: "none", details: "Adds a rigid body and collider. See the Physics page." },
  { name: "impact", type: "ImpactFeedback | null", default: "none", details: "Sound and haptic played by the engine on solid impacts. See the Audio & Haptics page." },
  { name: "pickable", type: "boolean", default: "true", details: "Whether world.pick can hit it. false lets taps through." },
];

export const physicsOptionsAttributes = [
  { name: "type", type: '"dynamic" | "kinematic" | "fixed"', default: "required", details: "Dynamic: moved by physics. Kinematic: moved by you. Fixed: never moves." },
  { name: "shape", type: '"ball" | "box" | "cylinder" | "capsule" | "cone"', default: "from mesh", details: "Spheres get a ball, cylinders and tori a cylinder, cones a cone, capsules a capsule, everything else a box." },
  { name: "radius", type: "number", default: "from the size", details: "Ball, cylinder, capsule or cone radius." },
  { name: "height", type: "number", default: "from the size", details: "Cylinder, capsule or cone height, end to end." },
  { name: "size", type: "[x, y, z]", default: "the scale", details: "Box size: full width, height and depth. Planes get a thin slab." },
  { name: "layer", type: "number (bits)", default: "1", details: "Which layers this collider is on." },
  { name: "mask", type: "number (bits)", default: "all", details: "Which layers it interacts with. Either side's mask is enough." },
  { name: "sensor", type: "boolean", default: "false", details: "Reports touches but doesn't push: pickups, trigger zones." },
  { name: "friction", type: "number", default: "0.5", details: "How grippy the surface is." },
  { name: "bounce", type: "number", default: "0", details: "Bounciness, 0..1." },
  { name: "density", type: "number", default: "1", details: "Mass per volume: heavier bodies push lighter ones." },
  { name: "drag", type: "number", default: "0", details: "Slows movement over time, like air resistance." },
  { name: "angularDrag", type: "number", default: "0.05", details: "Slows spinning over time." },
  { name: "gravityScale", type: "number", default: "1", details: "Multiplier on world gravity. 0 floats." },
  { name: "upright", type: "boolean", default: "false", details: "Stays upright: never tumbles." },
  { name: "ccd", type: "boolean", default: "false", details: "Stops fast, small bodies passing through walls." },
  { name: "planar", type: "boolean", default: "false", details: "For 2D games: stays in its XY plane and spins only around z. Keep the camera looking down -z." },
];

export const modelOptionsAttributes = [
  { name: "center", type: "boolean", default: "true", details: "Move the model's middle to the origin, so position is its center." },
  { name: "fit", type: "number", default: "keep size", details: "Scale it so its largest side is this long, e.g. 1 to match the built-in shapes." },
];

export const gameViewAttributes = [
  { name: "source", type: "World | RenderSource", default: "required", details: "What to draw, usually a World. Passing a different one restarts the view (e.g. a new round's World). Never pass a disposed world." },
  { name: "onUpdate", type: "(dt: number) => void", default: "none", details: "Your game loop. Called once per frame before drawing, with the elapsed seconds (capped at 0.1). Call world.update(dt) here, then read input, spawn and move the camera." },
  { name: "camera", type: "Camera", default: "eye [0, 40, 60], target [0, 0, 0], fov π/3", details: "Read every frame: mutate it (e.g. camera.eye) from onUpdate to move the camera. See Camera fields." },
  { name: "light", type: "Light", default: "direction [0.4, 0.8, 0.5], ambient 0.35, shadows on", details: "Direction, ambient level and shadows. Read every frame. See Light fields." },
  { name: "background", type: "[r, g, b]", default: "dark navy", details: "Sky / clear color, linear 0..1 RGB. Also the fog color." },
  { name: "fog", type: "number", default: "0 (off)", details: "Distance fog density, e.g. 0.02." },
  { name: "style", type: "ViewStyle", default: "flex: 1", details: "Style of the canvas view." },
  { name: "onTap", type: "(x: number, y: number) => void", default: "none", details: "A quick tap (under 10 points of movement and 300 ms), in points from the view's top-left. world.pick(x, y) finds what was tapped." },
  { name: "onSwipe", type: '(direction: "left" | "right" | "up" | "down") => void', default: "none", details: "A quick flick (over 30 points, faster than 0.3 points/ms) in its main direction: 2048, runners, sliding puzzles." },
  { name: "onDrag", type: "({ phase, x, y, dx, dy }) => void", default: "none", details: 'Finger down, moving and up. phase is "start", "move" or "end"; dx and dy are measured from the start.' },
  { name: "onStats", type: "({ fps, updateMs }) => void", default: "none", details: "Called once a second with the frame rate and the mean onUpdate time in ms. See GameStats." },
  { name: "onError", type: "(error: Error) => void", default: "console.error", details: "GPU setup failures and WebGPU errors." },
];

export const cameraAttributes = [
  { name: "eye", type: "[x, y, z]", default: "required", details: "Where the camera is." },
  { name: "target", type: "[x, y, z]", default: "required", details: "The point it looks at." },
  { name: "fov", type: "number", default: "required", details: "Vertical field of view in radians. Ignored when ortho is set." },
  { name: "ortho", type: "number", default: "none", details: "Orthographic: half the visible height in world units. No perspective, so boards look flat and tidy." },
  { name: "follow", type: "{ target, offset, smoothing? } | null", default: "none", details: "Chase an entity: the target moves toward it and the eye keeps offset from the target." },
  { name: "follow.smoothing", type: "number", default: "0.15", details: "Roughly the seconds it takes to catch up. 0 is rigid." },
  { name: "shake", type: "number", default: "0", details: "Shake strength in world units, e.g. 0.3 for a hit. Fades out by itself." },
];

export const animateOptionsAttributes = [
  { name: "duration", type: "number", default: "0.3", details: "Seconds." },
  { name: "delay", type: "number", default: "0", details: "Seconds to wait before it starts." },
  { name: "easing", type: "Easing", default: '"easeOut"', details: "How it speeds up and slows down. See the easings below." },
  { name: "repeat", type: 'number | "forever"', default: "0", details: "Extra runs after the first." },
  { name: "yoyo", type: "boolean", default: "false", details: "Every other run plays backwards: pulses and ping-pong." },
  { name: "stagger", type: "number", default: "0", details: "With several entities: extra delay for each next one, in seconds." },
  { name: "path", type: '"linear" | "smooth"', default: '"linear"', details: "smooth curves through keyframes: arcs and hops." },
  { name: "spring", type: 'true | "bouncy" | SpringOptions', default: "none", details: "Simulated spring motion instead of a duration. Keeps its speed when retargeted." },
];

export const animateTargetAttributes = [
  { name: "position", type: "[x, y, z]", default: "none", details: "Where to move to." },
  { name: "rotation", type: "[x, y, z, w]", default: "none", details: "A quaternion to turn to (the short way)." },
  { name: "scale", type: "number | [x, y, z]", default: "none", details: "Size to grow or shrink to." },
  { name: "color", type: "[r, g, b] | [r, g, b, a]", default: "none", details: "Color to fade to. Alpha below 1 fades out." },
  { name: "moveBy", type: "[x, y, z]", default: "none", details: "Move by this offset from where it starts." },
  { name: "turn", type: "[x, y, z]", default: "none", details: "Turn by these angles in radians. 2π spins once; more spins more." },
  { name: "shake", type: "number", default: "none", details: "Shake by up to this distance, fading out. Only the drawn position shakes." },
  { name: "at", type: "number", default: "even", details: "Keyframes only: when to reach this keyframe, 0..1 of the duration." },
];

export const springAttributes = [
  { name: "stiffness", type: "number", default: "170", details: "How strongly it pulls toward the target." },
  { name: "damping", type: "number", default: "26", details: "How quickly it calms down. Lower values bounce more." },
  { name: "mass", type: "number", default: "1", details: "Heavier moves slower and swings further." },
];

export const easingAttributes = [
  { name: '"linear"', type: "Easing", default: "", details: "Constant speed." },
  { name: '"easeIn"', type: "Easing", default: "", details: "Starts slow, ends fast." },
  { name: '"easeOut"', type: "Easing", default: "yes", details: "Starts fast, ends slow. Feels responsive." },
  { name: '"easeInOut"', type: "Easing", default: "", details: "Slow at both ends." },
  { name: '"back"', type: "Easing", default: "", details: "Overshoots a little, then settles. Good for pieces snapping into place." },
  { name: '"bounce"', type: "Easing", default: "", details: "Bounces at the end, like a dropped ball." },
  { name: '"elastic"', type: "Easing", default: "", details: "Springs past the end and wobbles back." },
];

export const burstOptionsAttributes = [
  { name: "position", type: "[x, y, z]", default: "required", details: "Where the particles start." },
  { name: "count", type: "number", default: "16", details: "How many particles." },
  { name: "direction", type: "[x, y, z]", default: "[0, 1, 0]", details: "Main direction. Default up." },
  { name: "spread", type: "number", default: "π", details: "Half-angle of the cone around direction, in radians. π means every direction." },
  { name: "mesh", type: "Shape | Model", default: '"cube"', details: "What each particle looks like." },
  { name: "size", type: "number", default: "0.15", details: "Particle size." },
  { name: "speed", type: "number", default: "5", details: "Top speed." },
  { name: "lifetime", type: "number", default: "0.8", details: "Seconds before they shrink away." },
  { name: "gravity", type: "number", default: "-9.81", details: "Vertical acceleration. 0 floats." },
  { name: "color", type: "Color | Color[]", default: "white", details: "One color, or up to 4 to pick from at random." },
];

export const fontOptionsAttributes = [
  { name: "depth", type: "number", default: "0.2", details: "How deep letters are extruded, as a fraction of the font size. 0 is flat." },
  { name: "chars", type: "string", default: "digits, letters, punctuation", details: "Characters to build. Fewer means a faster load and fewer mesh ids used." },
];

export const playOptionsAttributes = [
  { name: "volume", type: "number", default: "1", details: "0..2." },
  { name: "pan", type: "number", default: "0", details: "-1 left to 1 right." },
  { name: "pitch", type: "number", default: "1", details: "Playback speed; also shifts pitch." },
  { name: "loop", type: "boolean", default: "false", details: "Repeat until stopped: music, engines, ambience." },
];

export const impactFeedbackAttributes = [
  { name: "sound", type: "Sound", default: "none", details: 'A loaded sound, e.g. sfx.get("bump"). Omit for haptics only.' },
  { name: "minSpeed", type: "number", default: "1", details: "Impacts slower than this are silent." },
  { name: "maxSpeed", type: "number", default: "10", details: "Full volume and strength at this speed and above." },
  { name: "volume", type: "number", default: "1", details: "Volume at full strength, 0..2." },
  { name: "haptic", type: "number", default: "0", details: "Vibration strength at full speed, 0..1. 0 means none." },
];

export const joystickAttributes = [
  { name: "state", type: "JoystickState", default: "required", details: "Written on touch; read it in onUpdate. x and y are -1..1, y is up." },
  { name: "size", type: "number", default: "150", details: "Diameter of the pad in points." },
  { name: "style", type: "ViewStyle", default: "none", details: "Position it, e.g. absolute in a corner." },
];

// ── World ────────────────────────────────────────────────────────────────

export const bobAttributes = [
  { name: "amplitude", type: "[x, y, z]", default: "required", details: "How far it moves along each axis, e.g. [0, 0.2, 0] to float up and down." },
  { name: "speed", type: "number", default: "required", details: "How fast the phase advances, in radians per second. 2π is one bob per second." },
  { name: "phase", type: "number", default: "0", details: "Starting phase in radians. Give neighbours different phases so they don't move in lockstep." },
];

export const followAttributes = [
  { name: "target", type: "Entity", default: "required", details: "The entity to chase. If it's despawned, the follower stands still." },
  { name: "speed", type: "number", default: "required", details: "Units per second along the ground (x and z)." },
];

export const nullableOptionsAttributes = [
  { name: "physics: null", type: "set", default: "", details: "Removes the body and collider: it stops falling and colliding. Plain motion (velocity, spin) still applies." },
  { name: "parent: null", type: "set", default: "", details: "Detaches it. Its position numbers stay the same but are now in world space, so it may jump: set position too." },
  { name: "follow: null", type: "set", default: "", details: "Stops chasing." },
  { name: "bob: null", type: "set", default: "", details: "Stops bobbing." },
  { name: "lifetime: null", type: "set", default: "", details: "Cancels a pending lifetime: it stays." },
  { name: "impact: null", type: "set", default: "", details: "Stops impact sounds and haptics." },
  { name: "texture: null", type: "set", default: "", details: "Removes the texture (pass mesh with it)." },
];

export const worldMethodsAttributes = [
  { name: "new World(capacity)", type: "World", default: "", details: "Most entities alive at once, particles and text letters included. Throws if the native core isn't linked (Expo Go)." },
  { name: "spawn(options?)", type: "Entity", default: "", details: "Adds an entity in one native call (text adds one per letter). Throws if the world is full or an option is invalid. Attached entities can't have physics." },
  { name: "set(e, options)", type: "boolean", default: "", details: "Changes an entity. Only what you pass changes; null removes. false if the entity is gone or an option was rejected (the others still apply)." },
  { name: "despawn(e)", type: "boolean", default: "", details: "Removes it and everything attached to it; their animations resolve. false if it was already gone." },
  { name: "impulse(e, [x, y, z])", type: "void", default: "", details: "A one-off push on a dynamic body: jumps, explosions, knockback." },
  { name: "animate(targets, to, options?)", type: "Promise<void>", default: "", details: "Animates one or many entities to a target or through up to 64 keyframes, in native code. Resolves when every part finishes, is replaced or stopped, or its entity is despawned." },
  { name: "stopAnimation(e)", type: "void", default: "", details: "Stops every animation on the entity where it is. Their promises resolve." },
  { name: "burst(options)", type: "number", default: "", details: "Spawns particles that fly out, fall, spin, shrink and clean up. Returns how many were spawned (fewer when nearly full)." },
  { name: "position(e, out?)", type: "[x, y, z] | null", default: "", details: "Simulated position, relative to the parent when attached. null if gone. Pass out to avoid allocating every frame." },
  { name: "worldPosition(e, out?)", type: "[x, y, z] | null", default: "", details: "Where it was last drawn, in world space, with parents and smoothing applied." },
  { name: "velocity(e, out?)", type: "[x, y, z] | null", default: "", details: "Current velocity, or null if gone." },
  { name: "has(e)", type: "boolean", default: "", details: "True while the entity exists." },
  { name: "raycast(origin, direction, maxDistance, mask?)", type: "RaycastHit | null", default: "", details: "First solid (non-sensor) collider along the ray whose layer is in mask (default all), as of the last update." },
  { name: "pick(x, y)", type: "PickHit | null", default: "", details: "The pickable entity under a GameView point, tested against bounding boxes of what was last drawn. Needs no physics." },
  { name: "toScreen([x, y, z])", type: "[x, y] | null", default: "", details: "Where a world position appears in the GameView, in points from its top-left. null if behind the camera or nothing has been drawn yet." },
  { name: "update(dt)", type: "void", default: "", details: "Advances the simulation in fixed 60 Hz steps, resolves finished animations and refreshes what GameView draws. Call it from onUpdate." },
  { name: "forEachCollision(fn)", type: "void", default: "", details: "Calls fn(a, b, info) for each touch that started or ended during the last update. info is reused: copy what you need." },
  { name: "dispose()", type: "void", default: "", details: "Frees the native world. Pending animation promises resolve; any later call throws." },
];

export const worldPropertiesAttributes = [
  { name: "capacity", type: "number (read-only)", default: "constructor", details: "The capacity the world was created with." },
  { name: "count", type: "number (read-only)", default: "0", details: "Live entities, text letters and particles included." },
  { name: "gravity", type: "[x, y, z]", default: "[0, -9.81, 0]", details: "World gravity for dynamic bodies. Set [0, 0, 0] for space games, or tilt it for marble games." },
  { name: "bounds", type: "[minX, minZ, maxX, maxZ] | null", default: "null", details: "Keeps moving non-physics entities inside this area. Physics bodies need walls instead." },
  { name: "listener", type: "Entity | null", default: "null", details: "Impact sounds pan and fade relative to this entity, usually the player." },
];

// ── Physics ──────────────────────────────────────────────────────────────

export const colliderDefaultsAttributes = [
  { name: '"sphere"', type: "ball", default: "largest half-size", details: "Radius is half the largest side of the scaled sphere." },
  { name: '"cylinder"', type: "cylinder", default: "from scale", details: "Radius from the wider of x and z, height from y." },
  { name: '"torus"', type: "cylinder", default: "from scale", details: "A flat cylinder around the ring." },
  { name: '"cone"', type: "cone", default: "from scale", details: "Radius from the wider of x and z, height from y." },
  { name: '"capsule"', type: "capsule", default: "from scale", details: "Radius from the wider of x and z; total height from y." },
  { name: '"plane"', type: "box", default: "thin slab", details: "A box 0.1 units thick: floors and ramps." },
  { name: '"cube", "roundedBox", "none"', type: "box", default: "the scale", details: '"none" makes an invisible box: trigger zones and invisible walls.' },
  { name: "Model", type: "box", default: "bounding box", details: "Fits the model's bounding box. Pass shape with radius or size for a tighter fit." },
];

export const collisionInfoAttributes = [
  { name: "started", type: "boolean", default: "", details: "true when the touch started, false when it ended." },
  { name: "sensor", type: "boolean", default: "", details: "A sensor was involved: a pickup or trigger zone, not a solid hit." },
  { name: "speed", type: "number", default: "", details: "Impact speed in units per second. 0 when a touch ends." },
];

export const raycastHitAttributes = [
  { name: "entity", type: "Entity", default: "", details: "What the ray hit." },
  { name: "distance", type: "number", default: "", details: "Distance from the origin in world units (direction is normalized for you)." },
  { name: "normal", type: "[x, y, z]", default: "", details: "Surface direction at the hit point: slopes, bounces, decals." },
  { name: "point", type: "[x, y, z]", default: "", details: "Where it hit, in world space." },
];

// ── Rendering ────────────────────────────────────────────────────────────

export const lightAttributes = [
  { name: "direction", type: "[x, y, z]", default: "[0.4, 0.8, 0.5]", details: "Direction towards the light (the sun). Need not be normalized." },
  { name: "ambient", type: "number", default: "0.35", details: "0..1. How bright the shadowed sides are." },
  { name: "shadows", type: "boolean", default: "true", details: "Cast shadows from one directional shadow map centred on the camera target." },
  { name: "shadowExtent", type: "number", default: "30", details: "Half-size in world units of the shadowed area around the camera target. Smaller is sharper." },
];

export const shapeAttributes = [
  { name: '"cube"', type: "1 × 1 × 1", default: "box", details: "Boxes, walls, floors, crates." },
  { name: '"sphere"', type: "1 across", default: "ball", details: "Balls, planets, orbs." },
  { name: '"plane"', type: "1 × 1, flat", default: "thin box", details: "Ground and tiles. Lies flat in x and z." },
  { name: '"cylinder"', type: "1 across, 1 tall", default: "cylinder", details: "Pillars, coins (scale y down), pipes." },
  { name: '"cone"', type: "1 across, 1 tall", default: "cone", details: "Trees, spikes, beaks. Tip up." },
  { name: '"capsule"', type: "0.5 across, 1 tall", default: "capsule", details: "Characters and pills: rolls and slides smoothly." },
  { name: '"torus"', type: "1 across, 0.3 tall", default: "flat cylinder", details: "Rings and donuts, lying flat." },
  { name: '"roundedBox"', type: "1 × 1 × 1", default: "box", details: "A cube with soft edges: tiles, buttons, cards." },
  { name: '"none"', type: "not drawn", default: "box", details: "Groups, pivots, trigger zones and invisible walls." },
];

export const gameStatsAttributes = [
  { name: "fps", type: "number", default: "", details: "Frames drawn per second over the last second." },
  { name: "updateMs", type: "number", default: "", details: "Mean time spent in onUpdate per frame, in milliseconds." },
];

// ── Input ────────────────────────────────────────────────────────────────

export const gestureAttributes = [
  { name: "onTap(x, y)", type: "tap", default: "< 10 pt, < 300 ms", details: "Fires on release when the finger barely moved and lifted quickly. x and y are where it went down." },
  { name: "onSwipe(direction)", type: "swipe", default: "> 30 pt, > 0.3 pt/ms", details: 'Fires on release for a fast flick. direction is "left", "right", "up" or "down", whichever axis moved more.' },
  { name: "onDrag(drag)", type: "drag", default: "every touch", details: 'Fires "start" on touch, "move" while moving and "end" on release or when the touch is cancelled. Taps and swipes send drag events too.' },
];

export const dragEventAttributes = [
  { name: "phase", type: '"start" | "move" | "end"', default: "", details: "Where in the touch this event is." },
  { name: "x, y", type: "number", default: "", details: "Finger position in the view, in points from its top-left." },
  { name: "dx, dy", type: "number", default: "", details: "Distance moved since the drag started, in points. y grows downward." },
];

export const pickHitAttributes = [
  { name: "entity", type: "Entity", default: "", details: 'The nearest pickable entity under the point. Text and "none" entities are never picked, so a tap on a label hits what\'s behind it.' },
  { name: "point", type: "[x, y, z]", default: "", details: "Where the tap ray hit the entity's bounding box, in world space." },
  { name: "distance", type: "number", default: "", details: "Distance from the camera to point." },
];

export const joystickStateAttributes = [
  { name: "x", type: "number", default: "0", details: "-1 (left) to 1 (right). Back to 0 on release." },
  { name: "y", type: "number", default: "0", details: "-1 (down) to 1 (up). Up is positive, unlike screen coordinates." },
];

// ── Assets ───────────────────────────────────────────────────────────────

export const assetSourceAttributes = [
  { name: 'require("./file.ext")', type: "number", default: "", details: "A bundled asset. Its extension must be in Metro's assetExts (.glb and .gltf need adding; images, fonts and .wav are there by default)." },
  { name: '"https://..."', type: "string", default: "", details: "Downloaded at load time." },
  { name: '"file://..."', type: "string", default: "", details: "A file on the device, e.g. one you downloaded earlier." },
];

export const modelAttributes = [
  { name: "size", type: "[x, y, z]", default: "", details: "Bounding box size at scale 1, after fit. Use it to place the model on the ground (y = size[1] / 2 when centered)." },
  { name: "id", type: "number", default: "", details: "Mesh id in the engine. Pass the model itself as mesh, not the id." },
];

export const textureAttributes = [
  { name: "id", type: "number", default: "", details: "Texture id in the engine." },
  { name: "width", type: "number", default: "", details: "Width in pixels." },
  { name: "height", type: "number", default: "", details: "Height in pixels. Use width and height to compute textureRegion for atlases." },
];

export const fontAttributes = [
  { name: "id", type: "number", default: "", details: "Font id in the engine." },
  { name: "capHeight", type: "number", default: "", details: "Height of capital letters at scale 1 (letters are 1 unit tall per em). Text is centered vertically on it." },
  { name: "glyphs", type: "ReadonlyMap<string, { mesh, advance }>", default: "", details: "Each built character's mesh id (-1 = not drawn, like space) and how far it advances the line." },
];

export const textOptionsAttributes = [
  { name: "text", type: "string", default: "required", details: "One line of text. Change it later with world.set(e, { text })." },
  { name: "font", type: "Font", default: "required", details: "From loadFont." },
  { name: "align", type: '"left" | "center" | "right"', default: '"center"', details: "Where position sits: the start, middle or end of the line." },
  { name: "scale", type: "number | [x, y, z]", default: "1", details: "1 makes letters 1 unit tall per em." },
  { name: "color", type: "Color", default: "[1, 1, 1]", details: "Colors every letter. Changing it recolors without rebuilding." },
];

// ── Audio and haptics ────────────────────────────────────────────────────

export const audioApiAttributes = [
  { name: "audio.load(sources)", type: "SoundBank", default: "", details: 'Loads named sounds: { coin: require("./coin.wav") }. The same file is only decoded once. Failures are logged and skipped.' },
  { name: "audio.play(sound, options?)", type: "Voice | null", default: "", details: "Plays a loaded Sound with low latency. null if it couldn't play." },
  { name: "audio.stop(voice)", type: "void", default: "", details: "Stops a playing voice, e.g. looping music. Ignores null." },
  { name: "audio.muted", type: "boolean", default: "false", details: "Silences everything: a settings toggle." },
  { name: "audio.volume", type: "number", default: "1", details: "Master volume, 0..2." },
  { name: "audio.running", type: "boolean (read-only)", default: "", details: "True once the device's audio output is running." },
];

export const soundBankAttributes = [
  { name: "ready", type: "Promise<void>", default: "", details: "Resolves when every sound has loaded (usually milliseconds). Plays before then are ignored." },
  { name: "play(name, options?)", type: "Voice | null", default: "", details: "Plays a sound by name. See Play options." },
  { name: "get(name)", type: "Sound | undefined", default: "", details: "The loaded Sound, e.g. for an entity's impact.sound or audio.play." },
];

export const hapticsApiAttributes = [
  { name: "haptics.impact(intensity?, sharpness?)", type: "void", default: "0.6, 0.5", details: "A single tap. Repeats under 35 ms apart are dropped so collisions don't buzz." },
  { name: "haptics.selection()", type: "void", default: "", details: "A light, crisp tick for UI selection." },
  { name: 'haptics.notify("success")', type: "void", default: "", details: "Two rising taps." },
  { name: 'haptics.notify("warning")', type: "void", default: "", details: "Two even taps." },
  { name: 'haptics.notify("error")', type: "void", default: "", details: "Three sharp, fading taps." },
  { name: "haptics.play(taps)", type: "void", default: "", details: "Any sequence of taps. See Haptic tap." },
  { name: "haptics.enabled", type: "boolean", default: "true", details: "Set false to silence all haptics: a settings toggle." },
  { name: "haptics.supported", type: "boolean (read-only)", default: "", details: "True if the device can vibrate (false on simulators)." },
];

export const hapticTapAttributes = [
  { name: "time", type: "number", default: "required", details: "Seconds from now." },
  { name: "intensity", type: "number", default: "required", details: "Strength, 0..1." },
  { name: "sharpness", type: "number", default: "required", details: "0 is a dull thud, 1 a crisp click. On Android, sharper taps are shorter pulses." },
];
