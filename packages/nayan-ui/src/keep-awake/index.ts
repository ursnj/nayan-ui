'use client';
import { useEffect, useId } from 'react';
import { keepAwake } from './keepAwake';
export { keepAwake } from './keepAwake';
/** Scoped to this hook instance; pass false when a retained navigation screen loses focus. */
export function useKeepAwake(active = true, onError?: (error: unknown) => void): void {
  const id = useId();
  useEffect(() => {
    if (!active) return;
    const tag = `react:${id}`;
    void keepAwake.activate(tag).catch((error) => {
      if (onError) onError(error);
      else console.warn('Keep awake failed:', error);
    });
    return () => {
      void keepAwake.deactivate(tag).catch((error) => {
        if (onError) onError(error);
      });
    };
  }, [active, id, onError]);
}
