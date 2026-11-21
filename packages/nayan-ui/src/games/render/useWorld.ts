import { type DependencyList, useEffect, useRef, useState } from 'react';
import { isEngineAvailable, World } from '../world/World';
import { warmUpEngine } from './meshes';

/** What `useWorld`'s setup may return: a cleanup, run just before the world is disposed. */
export type WorldSetup = (world: World) => void | (() => void);

/**
 * A `World` owned by a component: the engine is warmed up (needed on the web, cheap on mobile), the
 * world is created with `capacity` entity slots and handed to `setup` to fill, and it is disposed on
 * unmount. A change in `deps` replaces it with a fresh one. Returns null until it's ready (one frame),
 * and while the engine is unavailable (Expo Go) or failed to start (`onError`, console by default).
 *
 * ```tsx
 * const world = useWorld(100, (w) => {
 *   w.spawn({ mesh: 'plane', scale: [20, 1, 20], color: '#4C9A4C', physics: 'fixed' });
 *   w.spawn({ mesh: 'sphere', position: [0, 4, 0], color: '#3399FF', physics: 'dynamic' });
 * });
 * return world && <GameView source={world} style={{ flex: 1 }} />;
 * ```
 */
export function useWorld(capacity: number, setup?: WorldSetup, deps: DependencyList = [], onError?: (error: Error) => void): World | null {
  const [world, setWorld] = useState<World | null>(null);
  // The latest callbacks, so passing inline functions doesn't recreate the world each render.
  const latest = useRef({ setup, onError });
  latest.current = { setup, onError };

  useEffect(() => {
    let active = true;
    let created: World | null = null;
    let cleanup: void | (() => void);
    const report = (error: unknown) => {
      const e = error instanceof Error ? error : new Error(String(error));
      (latest.current.onError ?? ((x: Error) => console.error(`useWorld: ${x.message}`)))(e);
    };
    if (!isEngineAvailable) {
      report(new Error('the native engine is not linked into this build (a development build is needed, not Expo Go)'));
      return;
    }
    warmUpEngine().then(() => {
      if (!active) return;
      try {
        created = new World(capacity);
        cleanup = latest.current.setup?.(created);
        setWorld(created);
      } catch (error) {
        created?.dispose();
        created = null;
        report(error);
      }
    }, report);
    return () => {
      active = false;
      setWorld(null);
      if (!created) return;
      try {
        cleanup?.();
      } finally {
        created.dispose();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capacity, ...deps]);

  return world;
}
