import { use } from 'react';
import { ComponentRenderContext, PlatformRenderContext } from './ThemeContext';

export function useComponentRenderer(kind: string, _allowPlatform?: boolean): boolean {
  if (use(ComponentRenderContext)) return true;
  if (!use(PlatformRenderContext)) throw new Error(`${kind} requires an NTheme screen`);
  return false;
}
