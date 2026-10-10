// Public API of @nayan-ui/engine.

// World: entities, physics, collisions, impact feedback.
export { World, isRustAvailable } from "./world/World";
export type {
  BodyOptions,
  BodyType,
  ColliderOptions,
  CollisionInfo,
  Color,
  Entity,
  ImpactFeedback,
  RaycastHit,
  SpawnOptions,
} from "./world/World";

// Rendering.
export { GameView } from "./render/GameView";
export type { GameStats } from "./render/GameView";

// Sound and haptics.
export { audio, impactStrength, SoundBank } from "./media/audio";
export type { PlayOptions, Sound, SoundSource, Voice } from "./media/audio";
export { haptics } from "./media/haptics";
export type { HapticTap } from "./media/haptics";

// Input.
export { Joystick, createJoystickState } from "./input/Joystick";
export type { JoystickState } from "./input/Joystick";

// Shared types.
export { Mesh } from "./types";
export type { Camera, Light, MeshKind, RenderSource, Vec3 } from "./types";
