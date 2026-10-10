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
  { name: "rotation", type: "[x, y, z, w]", default: "none", details: "A quaternion." },
  { name: "scale", type: "number | [x, y, z]", default: "1", details: "Size. Also sizes the default collider. Children scale with their parent." },
  { name: "color", type: "[r, g, b] | [r, g, b, a]", default: "[1, 1, 1]", details: "Each channel 0..1. Alpha below 1 makes it see-through. Tints a texture." },
  { name: "velocity", type: "[x, y, z]", default: "none", details: "Units per second." },
  { name: "groundVelocity", type: "[x, z]", default: "none", details: "Horizontal speed that keeps the vertical one: steer a body and it still falls." },
  { name: "acceleration", type: "[x, y, z]", default: "none", details: "Units per second², for entities without a dynamic body: falling debris, thrown items." },
  { name: "spin", type: "[x, y, z]", default: "none", details: "Radians per second around each axis." },
  { name: "bob", type: "{ amplitude, speed, phase? } | null", default: "none", details: "A visual bob. Doesn't move the collider." },
  { name: "follow", type: "{ target, speed } | null", default: "none", details: "Chase another entity along the ground." },
  { name: "lifetime", type: "number | null", default: "none", details: "Seconds until it shrinks away and is despawned." },
  { name: "parent", type: "Entity | null", default: "none", details: "Attach to another entity, to any depth. It moves, turns and scales with the parent. Visual only: no physics." },
  { name: "physics", type: '"dynamic" | "kinematic" | "fixed" | PhysicsOptions | null', default: "none", details: "Adds a rigid body and collider. See the Physics page." },
  { name: "impact", type: "ImpactFeedback | null", default: "none", details: "Sound and haptic played by the engine on solid impacts." },
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
  { name: "source", type: "World | RenderSource", default: "required", details: "What to draw. Fixed for the life of the view." },
  { name: "onUpdate", type: "(dt: number) => void", default: "none", details: "Your game loop. Called once per frame before drawing; dt is in seconds." },
  { name: "camera", type: "Camera", default: "looks down at the origin", details: "Mutate it every frame to move the camera." },
  { name: "light", type: "Light", default: "soft daylight", details: "Direction, ambient level and shadows." },
  { name: "background", type: "[r, g, b]", default: "dark navy", details: "Sky color. Also the fog color." },
  { name: "fog", type: "number", default: "0 (off)", details: "Distance fog density, e.g. 0.02." },
  { name: "style", type: "ViewStyle", default: "flex: 1", details: "Style of the canvas view." },
  { name: "onTap", type: "(x: number, y: number) => void", default: "none", details: "A quick tap, in points from the view's top-left. world.pick(x, y) finds what was tapped." },
  { name: "onSwipe", type: '(direction: "left" | "right" | "up" | "down") => void', default: "none", details: "A quick flick in one direction: 2048, runners, sliding puzzles." },
  { name: "onDrag", type: "({ phase, x, y, dx, dy }) => void", default: "none", details: 'Finger down, moving and up. phase is "start", "move" or "end"; dx and dy are measured from the start.' },
  { name: "onStats", type: "({ fps, updateMs }) => void", default: "none", details: "Called once a second." },
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
