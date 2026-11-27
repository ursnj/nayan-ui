import { useContext } from 'react';
import { ComponentRenderContext, PlatformRenderContext } from './ThemeContext';

/** Visual controls belong to the app's existing renderer. */
export function useComponentRenderer(kind: string, allowPlatform = false): boolean {
  const rendering = useContext(ComponentRenderContext);
  const platform = useContext(PlatformRenderContext);
  if (rendering) return true;
  if (allowPlatform && platform) return false;
  throw new Error(`${kind} requires an NTheme screen`);
}
