import NativeEngine from './NativeNayanEngine';

/** Prepare the shared engine runtime. Native initialization is owned by React Native. */
export async function prepareCore(): Promise<void> {
  if (!NativeEngine) throw new Error('Engine core requires a React Native app build with NayanEngine linked');
}
