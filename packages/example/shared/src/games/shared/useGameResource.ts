import { useEffect, useRef } from 'react';

/** Keep native resources through React's effect replay; release them after a real unmount. */
export function useGameResource<T>(create: () => T, connect: (value: T) => () => void): T {
  const resource = useRef<{ value: T; users: number; cleanup?: () => void } | null>(null);
  resource.current ??= { value: create(), users: 0 };
  const current = resource.current;
  useEffect(() => {
    current.users++;
    current.cleanup ??= connect(current.value);
    return () => {
      current.users--;
      queueMicrotask(() => {
        if (current.users !== 0) return;
        current.cleanup?.();
        current.cleanup = undefined;
      });
    };
  }, [current]); // eslint-disable-line react-hooks/exhaustive-deps
  return current.value;
}
