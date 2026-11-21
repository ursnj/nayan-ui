import NativeEngine from '../native/NativeNayanEngine';
import { prepareEngine } from '../native/prepare';
import type { NPatternRecipe } from './NPattern';

const images = new Map<string, Promise<string>>();

/** Bounded, shared image cache; identical screen/blur copies share the same native worker. */
export function patternImage(recipe: NPatternRecipe, width: number, height: number, density: number): Promise<string> {
  const command = JSON.stringify({ action: 'patternImage', recipe, width, height, density });
  const hit = images.get(command);
  if (hit) {
    images.delete(command);
    images.set(command, hit);
    return hit;
  }
  const request = Promise.resolve()
    .then(async () => {
      await prepareEngine();
      if (typeof NativeEngine?.iconRequest !== 'function') throw new Error('Rebuild the engine and app with pattern image support');
      const result = JSON.parse(await NativeEngine.iconRequest(new ArrayBuffer(0), command)) as { ok: boolean; value: string; error?: string };
      if (!result.ok) throw new Error(result.error || 'Pattern rendering failed');
      return result.value;
    })
    .catch((error) => {
      if (images.get(command) === request) images.delete(command);
      throw error;
    });
  images.set(command, request);
  while (images.size > 8) images.delete(images.keys().next().value!);
  return request;
}
