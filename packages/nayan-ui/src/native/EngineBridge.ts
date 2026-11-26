import type { Spec } from './spec/NativeNayanEngine';

/** Geometry returned by the core without registering a renderable mesh. */
export interface NativeGeometry {
  vertices: ArrayBuffer;
  indices: ArrayBuffer;
}

// React Native codegen requires Object for JSI ArrayBuffers. Keep that generated contract
// unchanged, but give engine code real buffer types instead of repeating unchecked casts.
// Numeric arrays remain arrays; structured geometry results have explicit overrides below.
type BufferValue<T, Buffer> = T extends readonly number[]
  ? T
  : T extends Promise<unknown>
    ? T
    : T extends (...args: never[]) => unknown
      ? T
      : T extends object
        ? Buffer
        : T;
type BufferMethod<T> = T extends (...args: infer A) => infer R
  ? (...args: { [K in keyof A]: BufferValue<A[K], ArrayBufferLike> }) => BufferValue<R, ArrayBuffer>
  : T;
/** Native-only (a display clock and a render thread): absent on the web core and on older app builds. */
type NativeFrames = 'publishFrame' | 'renderStats' | 'hasFrameClock' | 'startFrames' | 'stopFrames';
type BinarySpec = Omit<
  Spec,
  | 'componentCreate'
  | 'appRequest'
  | 'sqliteRequest'
  | 'hasImagePicker'
  | 'fileRequest'
  | 'audioControl'
  | 'audioVoiceStatus'
  | 'audioEncodeWav'
  | 'micPause'
  | 'deviceEnvironment'
  | 'safeAreaRequest'
  | 'authRequest'
  | 'assetRead'
  | 'iconRequest'
  | 'speechRequest'
  | 'storageRead'
  | 'storageWrite'
  | 'geometrySolid'
  | 'geometryOptimize'
  | 'modelSize'
  | 'modelBake'
  | 'textureSize'
  | 'worldgenTerrain'
  | 'worldgenMesh'
  | 'worldgenTilt'
  | 'worldgenMove'
  | NativeFrames
>;

/** The same runtime ABI on JSI and WASM, with precise TypeScript buffer and tuple contracts. */
export type EngineBridge = {
  [K in keyof BinarySpec]: BufferMethod<BinarySpec[K]>;
} & {
  componentCreate?: Spec['componentCreate'];
  /** Direct browser frame and event paths, outside the React Native codegen contract. */
  componentPresent?(document: number, width: number, height: number, pixelWidth: number, pixelHeight: number): boolean;
  documentEvent?(document: number): string | null;
  appRequest?: Spec['appRequest'];
  sqliteRequest?: Spec['sqliteRequest'];
  hasImagePicker?: Spec['hasImagePicker'];
  fileRequest?: Spec['fileRequest'];
  audioControl?: Spec['audioControl'];
  audioVoiceStatus?(voice: number): ArrayBuffer;
  audioEncodeWav?(sound: number): ArrayBuffer;
  micPause?: Spec['micPause'];
  deviceEnvironment?: Spec['deviceEnvironment'];
  safeAreaRequest?: Spec['safeAreaRequest'];
  authRequest?: Spec['authRequest'];
  assetRead?(uri: string): Promise<ArrayBuffer>;
  iconRequest?(data: ArrayBufferLike, command: string): Promise<string>;
  speechRequest?: Spec['speechRequest'];
  storageRead(handle: number, key: string): { value?: string | number | boolean | ArrayBuffer };
  storageWrite(handle: number, key: string, value: { value: string | number | boolean | ArrayBuffer }): void;
  geometrySolid(recipe: string): NativeGeometry;
  geometryOptimize(vertices: ArrayBufferLike, indices: ArrayBufferLike, ratio: number, error: number, lockBorders: boolean): NativeGeometry;
  modelSize(mesh: number): [x: number, y: number, z: number];
  modelBake(mesh: number, spec: string): [] | [texture: number, x: number, y: number, extent: number];
  textureSize(texture: number): [width: number, height: number];
  worldgenTerrain(world: number, material: number): NativeGeometry;
  worldgenMesh(recipe: string): NativeGeometry;
  worldgenTilt(world: number, x: number, z: number, yaw: number): [x: number, y: number, z: number, w: number];
  worldgenMove(world: number, x: number, z: number, dx: number, dz: number, radius: number, bodies: ArrayBufferLike): [x: number, z: number];
} & {
  [K in NativeFrames]?: BufferMethod<Spec[K]>;
};
