// Public API of @nayan-ui/engine.

// World: entities, physics, collisions, impact feedback.
export { World, isEngineAvailable } from "./world/World";
export type {
  BodyType,
  Bounds,
  CollisionInfo,
  Color,
  Entity,
  EntityOptions,
  ImpactFeedback,
  PhysicsOptions,
  Quat,
  RaycastHit,
} from "./world/World";

// Rendering and 3D models.
export { GameView } from "./render/GameView";
export type { GameStats } from "./render/GameView";
export { loadModel } from "./model/Model";
export type { Model, ModelOptions } from "./model/Model";

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
