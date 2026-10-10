// Public API of @nayan-ui/engine.

// World: entities, physics, collisions, animation, particles, picking.
export { World, isEngineAvailable } from "./world/World";
export type {
  AnimateOptions,
  AnimateTarget,
  BodyType,
  Bounds,
  BurstOptions,
  CollisionInfo,
  Color,
  Easing,
  Entity,
  EntityOptions,
  ImpactFeedback,
  Keyframe,
  PhysicsOptions,
  PickHit,
  Quat,
  RaycastHit,
  SpringOptions,
} from "./world/World";

// Rendering and touch.
export { GameView } from "./render/GameView";
export type { DragEvent, GameStats, SwipeDirection } from "./render/GameView";

// Models, textures and fonts.
export { loadModel } from "./assets/model";
export type { Model, ModelOptions } from "./assets/model";
export { loadTexture } from "./assets/texture";
export type { Texture } from "./assets/texture";
export { loadFont } from "./assets/font";
export type { Font, FontOptions, TextAlign } from "./assets/font";

// Sound and haptics.
export { audio } from "./media/audio";
export type { PlayOptions, Sound, SoundBank, SoundSource, Voice } from "./media/audio";
export { haptics } from "./media/haptics";
export type { HapticTap } from "./media/haptics";

// Input.
export { Joystick, useJoystick } from "./input/Joystick";
export type { JoystickState } from "./input/Joystick";

// Shared types.
export type { Camera, Light, RenderSource, Shape, Vec3 } from "./types";
