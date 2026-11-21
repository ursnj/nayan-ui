import { use } from 'react';
import { ComponentRenderContext, PlatformRenderContext } from './ThemeContext';

export function useComponentRenderer(kind: string): boolean {
  if (use(ComponentRenderContext)) return true;
  if (!use(PlatformRenderContext)) throw new Error(`${kind} requires an app-level NPage or ComponentsRoot`);
  return false;
}
