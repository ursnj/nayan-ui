// `useState` for what a game shows while its frame loop runs (score, timer, lives, phase, the result).
// React runs ordinary state updates as normal-priority tasks; when every frame takes its whole slot
// (a busy, slower device) those wait until they expire, about 5 s, so the scoreboard and the
// game-over card lagged by seconds. An external store's updates render on React's synchronous lane
// instead, straight after the task that made them. Changes are published at most every
// `minInterval` ms (the latest value always lands), so a score changing every frame doesn't
// re-render every frame.
import { useRef, useSyncExternalStore } from 'react';

type SetState<T> = (next: T | ((previous: T) => T)) => void;

/** Updates at most this often by default (ms): the scoreboard still reads as live. */
const MIN_INTERVAL = 100;

type Store<T> = { get: () => T; subscribe: (listener: () => void) => () => void; set: SetState<T> };

function createStore<T>(initial: T, minInterval: number): Store<T> {
  let shown = initial;
  let latest = initial;
  let last = -Infinity;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const listeners = new Set<() => void>();
  const publish = () => {
    timer = null;
    last = Date.now();
    if (Object.is(shown, latest)) return;
    shown = latest;
    for (const listener of listeners) listener();
  };
  return {
    get: () => shown,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
        if (!listeners.size && timer) {
          clearTimeout(timer);
          timer = null;
        }
      };
    },
    set: (next) => {
      latest = typeof next === 'function' ? (next as (previous: T) => T)(latest) : next;
      if (timer) return;
      const wait = minInterval - (Date.now() - last);
      if (wait <= 0) publish();
      else timer = setTimeout(publish, wait);
    }
  };
}

/** Like `useState`, but its updates show at once even while the frame loop keeps the JS thread busy (see above). */
export function useLiveState<T>(initial: T | (() => T), minInterval = MIN_INTERVAL): [T, SetState<T>] {
  const store = useRef<Store<T> | null>(null);
  if (!store.current) store.current = createStore(typeof initial === 'function' ? (initial as () => T)() : initial, minInterval);
  const value = useSyncExternalStore(store.current.subscribe, store.current.get);
  return [value, store.current.set];
}
