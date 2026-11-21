import { useContext } from 'react';
import { ComponentRenderContext } from './ThemeContext';

/** Visual controls belong to the app's existing renderer. */
export function useComponentRenderer(kind: string): boolean {
  if (!useContext(ComponentRenderContext)) throw new Error(`${kind} requires an app-level NPage or ComponentsRoot`);
  return true;
}
