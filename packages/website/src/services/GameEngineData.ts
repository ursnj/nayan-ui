// Option tables for the @nayan-ui/engine docs (rendered with <Attributes />).
// Keep them in sync with packages/engine/src.

export const entityOptionsAttributes = [
  { name: "mesh", type: "Mesh.Cube | Mesh.Sphere | Mesh.Plane | model.mesh", default: "Mesh.Cube", details: "The shape to draw: a built-in shape or a loaded model." },
  { name: "position", type: "[x, y, z]", default: "[0, 0, 0]", details: "Where it is. Relative to the parent when attached." },
  { name: "rotation", type: "[x, y, z, w]", default: "none", details: "A quaternion." },
  { name: "scale", type: "number | [x, y, z]", default: "1", details: "Size. Also sizes the default collider." },
  { name: "color", type: "[r, g, b] | [r, g, b, a]", default: "[1, 1, 1]", details: "Each channel 0..1." },
  { name: "velocity", type: "[x, y, z]", default: "none", details: "Units per second." },
  { name: "groundVelocity", type: "[x, z]", default: "none", details: "Horizontal speed that keeps the vertical one: steer a body and it still falls." },
  { name: "spin", type: "[x, y, z]", default: "none", details: "Radians per second around each axis." },
  { name: "bob", type: "{ amplitude, speed, phase? } | null", default: "none", details: "A visual bob. Doesn't move the collider." },
  { name: "follow", type: "{ target, speed } | null", default: "none", details: "Chase another entity along the ground." },
  { name: "lifetime", type: "number | null", default: "none", details: "Seconds until it shrinks away and is despawned." },
  { name: "parent", type: "Entity | null", default: "none", details: "Attach to another entity. Visual only: no physics." },
  { name: "physics", type: '"dynamic" | "kinematic" | "fixed" | PhysicsOptions | null', default: "none", details: "Adds a rigid body and collider. See the Physics page." },
  { name: "impact", type: "ImpactFeedback | null", default: "none", details: "Sound and haptic played by the engine on solid impacts." },
];

export const physicsOptionsAttributes = [
  { name: "type", type: '"dynamic" | "kinematic" | "fixed"', default: "required", details: "Dynamic: moved by physics. Kinematic: moved by you. Fixed: never moves." },
  { name: "shape", type: '"ball" | "box"', default: "from mesh", details: "Spheres get a ball, everything else a box." },
  { name: "radius", type: "number", default: "half the largest scale", details: "Ball size." },
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
  { name: "onStats", type: "({ fps, updateMs }) => void", default: "none", details: "Called once a second." },
  { name: "onError", type: "(error: Error) => void", default: "console.error", details: "GPU setup failures and WebGPU errors." },
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
