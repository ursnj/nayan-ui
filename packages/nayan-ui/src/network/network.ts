import { observeNetwork } from './networkPlatform';
import type { NetworkListener, NetworkWaitOptions, OnlineState } from './types';

let state: OnlineState = null;
let ready = false;
let revision = 0;
let generation = 0;
let stop: (() => void) | undefined;
const listeners = new Set<NetworkListener>();

export const getOnlineSnapshot = (): OnlineState => state;
export const getServerOnlineSnapshot = (): OnlineState => null;

function subscribe(listener: NetworkListener): () => void {
  // Each subscription owns its registration, including when the same callback is reused.
  const entry: NetworkListener = (value) => listener(value);
  listeners.add(entry);
  const previousRevision = revision;
  if (listeners.size === 1) {
    const current = ++generation;
    try {
      stop = observeNetwork((value) => {
        if (current !== generation) return;
        if (ready && state === value) return;
        ready = true;
        state = value;
        revision++;
        for (const changed of [...listeners]) if (listeners.has(changed)) changed(state);
      });
    } catch (error) {
      listeners.delete(entry);
      generation++;
      ready = false;
      state = null;
      throw error;
    }
  }
  if (previousRevision === revision) listener(state);
  let active = true;
  return () => {
    if (!active) return;
    active = false;
    listeners.delete(entry);
    if (listeners.size) return;
    generation++;
    const cleanup = stop;
    stop = undefined;
    ready = false;
    state = null;
    cleanup?.();
  };
}

function waitForReport(matches: (value: OnlineState) => boolean, timeoutMs: number, signal?: AbortSignal): Promise<OnlineState> {
  return new Promise((resolve, reject) => {
    let unsubscribe: (() => void) | undefined;
    let settled = false;
    const cleanup = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener('abort', canceled);
      unsubscribe?.();
    };
    const finish = (value: OnlineState) => {
      cleanup();
      resolve(value);
    };
    const canceled = () => {
      cleanup();
      reject(signal?.reason ?? Object.assign(new Error('Network wait aborted'), { name: 'AbortError' }));
    };
    const timer = setTimeout(() => finish(null), timeoutMs);
    if (signal?.aborted) {
      canceled();
      return;
    }
    signal?.addEventListener('abort', canceled, { once: true });
    try {
      unsubscribe = subscribe((value) => {
        if (ready && matches(value)) finish(value);
      });
      if (settled) unsubscribe();
    } catch (error) {
      cleanup();
      reject(error);
    }
  });
}

/** Shared, event-driven connection status. No polling, network requests or engine warm-up. */
export const network = {
  fetch: () => waitForReport(() => true, 5000),
  subscribe,
  /** Resolves true on a reported connection or false at the deadline. Aborts reject. */
  async waitForOnline({ timeoutMs = 30_000, signal }: NetworkWaitOptions = {}): Promise<boolean> {
    if (!Number.isInteger(timeoutMs) || timeoutMs < 0 || timeoutMs > 0x7fffffff) throw new RangeError('Network timeout is out of range');
    return (await waitForReport((value) => value === true, timeoutMs, signal)) === true;
  }
};
