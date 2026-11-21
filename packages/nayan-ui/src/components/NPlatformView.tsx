'use client';
import { createContext, type ReactNode, useContext, useEffect, useId, useMemo } from 'react';
import { ContextBridge, useSurfaceContextValues } from './contextBridge';
import { NView } from './NView';
import { ComponentRenderContext, ComponentThemeContext } from './ThemeContext';
import type { ComponentProps } from './types';

export const ComponentAttachmentContext = createContext<((id: string, children: ReactNode | null) => void) | null>(null);

/** Browser/OS-owned content, positioned and clipped using Rust layout bounds. */
export function NPlatformView({ children, id, ...props }: ComponentProps) {
  const generated = useId();
  const key = id ?? generated;
  const register = useContext(ComponentAttachmentContext);
  const rendering = useContext(ComponentRenderContext);
  const theme = useContext(ComponentThemeContext);
  const values = useSurfaceContextValues(theme?.contexts);
  const content = useMemo(() => <ContextBridge values={values}>{children}</ContextBridge>, [values, children]);
  useEffect(() => {
    if (!rendering) return;
    if (!register) throw new Error('NPlatformView requires a ComponentsRoot');
    register(key, content);
    return () => register(key, null);
  }, [register, key, content, rendering]);
  return rendering ? <NView {...props} id={key} /> : children;
}
