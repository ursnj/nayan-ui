'use client';
import { createContext, type ReactNode, useContext, useEffect, useId, useMemo } from 'react';
import { ContextBridge, useSurfaceContextValues } from './contextBridge';
import { NView } from './NView';
import { ComponentRenderContext, ComponentThemeContext, PlatformRenderContext } from './ThemeContext';
import type { ComponentProps } from './types';

export const ComponentAttachmentContext = createContext<((id: string, children: ReactNode | null) => void) | null>(null);

/** Browser/OS-owned content, positioned and clipped using Rust layout bounds. */
export function NPlatformView(props: ComponentProps) {
  if (useContext(ComponentRenderContext)) return <PlatformAttachment {...props} />;
  return <PlatformRenderContext.Provider value>{props.children}</PlatformRenderContext.Provider>;
}

function PlatformAttachment({ children, id, ...props }: ComponentProps) {
  const generated = useId();
  const key = id ?? generated;
  const register = useContext(ComponentAttachmentContext);
  const theme = useContext(ComponentThemeContext);
  const values = useSurfaceContextValues(theme?.contexts);
  const content = useMemo(
    () => (
      <ContextBridge values={values}>
        <PlatformRenderContext.Provider value>{children}</PlatformRenderContext.Provider>
      </ContextBridge>
    ),
    [values, children]
  );
  useEffect(() => {
    if (!register) throw new Error('NPlatformView requires a ComponentsRoot');
    register(key, content);
    return () => register(key, null);
  }, [register, key, content]);
  return <NView {...props} id={key} />;
}
