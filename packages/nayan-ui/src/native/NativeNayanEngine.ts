import type { EngineBridge } from './EngineBridge';
import NativeModule from './spec/NativeNayanEngine';

// The native JSI implementation provides the buffers described by EngineBridge.
export default NativeModule as EngineBridge | null;
export type { Spec } from './spec/NativeNayanEngine';
