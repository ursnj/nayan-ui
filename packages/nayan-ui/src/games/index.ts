// Game worlds, rendering, assets and input.

// World: entities, physics, collisions, animation, particles, picking.
export { World, isEngineAvailable } from './world/World';
export { quat, type MutableQuat } from './world/quat';
export { toColor, type ColorInput } from './world/color';
export { effects, type DustOptions, type EffectOptions, type FlashOptions, type PopOptions } from './world/effects';
export { Scoreboard, type ScoreboardHandlers } from './world/Scoreboard';
export type {
  AnimateOptions,
  AnimateTarget,
  BodyType,
  Bounds,
  BurstOptions,
  CollisionInfo,
  ClipOptions,
  ScreenPlane,
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
  SpringOptions
} from './world/types';

// Rendering and touch.
export { afterNextFrame, GameView } from './render/GameView';
export { useWorld, type WorldSetup } from './render/useWorld';
export { frontLight } from './render/light';
export { warmUpEngine, getMeshIdLimit } from './render/meshes';
export type { TransformBatch, TransformOptions } from './world/TransformBatch';
export type { DragEvent, GameViewProps, GameViewStats, OverlayTouchPhase, PinchEvent, SwipeDirection } from './render/GameView';
export type { RenderQuality, RenderQualitySetting } from './render/quality';

// Models, custom shapes, textures and fonts.
export type { AssetSource } from '../assets/source';
export { loadModel } from './assets/model';
export { clearAssetCache } from '../assets/AssetCache';
export { ProceduralCache, type ProceduralStorage } from './assets/ProceduralCache';
export type { Model, ModelOptions, ModelClip, LoadedModel } from './assets/model';
export { bakeModel, isBakeKept, loadTexture } from './assets/texture';
export { Solid, solidGeometry, createSolid, optimizeGeometry, createGeometryLods, getGeometryStats, deformGeometry } from './assets/modelling';
export type { DisplacementOptions, SolidOptions, OptimizeOptions, GeometryStats } from './assets/modelling';
export { loft, block, ellipsoid, smoothCurve } from './assets/loft';
export type { LoftSection, LoftOptions } from './assets/loft';
export { parametricSurface } from './assets/surface';
export {
  faceColor,
  FieldFunction,
  FieldGraph,
  FieldRef,
  generateMesh,
  generateWorld,
  generateWorldAsync,
  isWorldKept,
  ProceduralWorld,
  sectionColor,
  surfaceColor,
  surfaceDisplacement
} from './assets/procedural';
export type {
  FieldInput,
  FieldShape,
  ItemSolid,
  MeshPart,
  MeshRecipe,
  ScatterFilter,
  ScatterLayer,
  SolidRecipe,
  Spot,
  TerrainRecipe,
  WorldOptions,
  WorldRecipe,
  WorldStep
} from './assets/procedural';
export type { ParametricSurfaceOptions } from './assets/surface';
export type { BakedModel, BakeOptions, BakePart, Texture } from './assets/texture';
export { createShape, extrude, lathe, merge, Path, recolor, shapeGeometry, smoothNormals, tube } from './assets/shape';
export type {
  ExtrudeOptions,
  FaceColor,
  Geometry,
  LatheOptions,
  GeometryPart,
  ShapeOptions,
  SurfaceColor,
  SurfacePoint,
  TubeOptions
} from './assets/shape';
export { loadFont, measureText } from './assets/font';
export type { Font, FontOptions, TextAlign, TextLayout } from './assets/font';

// Input.
export { Joystick, useJoystick } from './input/Joystick';
export type { JoystickState, JoystickProps } from './input/Joystick';
export { createKeyboardInput } from './input/keyboard';
export type { KeyboardInputMode, KeyboardInputOptions } from './input/keyboard';

// Shared types.
export { MAX_MESHES } from './types';
export type { Camera, Light, RenderSource, Shape, Vec3 } from './types';
