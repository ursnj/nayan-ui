import type { IconOutline } from '../iconImage';
import { lucidePaths } from './lucide';

export type { NIconName } from './lucide';

const outlines = new Map<string, IconOutline>();

/** Static engine-owned Lucide paths, resolved without fonts, asset reads or native calls. */
export function lucideIcon(name: string): IconOutline | undefined {
  const normalized = name
    .replace(/Icon$/, '')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .replace(/([a-z\d])([A-Z])/g, '$1-$2')
    .replace(/([a-zA-Z])(\d)/g, '$1-$2')
    .toLowerCase();
  const key = Object.hasOwn(lucidePaths, name) ? name : normalized;
  if (!Object.hasOwn(lucidePaths, key)) return undefined;
  let outline = outlines.get(key);
  if (!outline) {
    outline = { paths: lucidePaths[key as keyof typeof lucidePaths], viewBox: 24 };
    outlines.set(key, outline);
  }
  return outline;
}
