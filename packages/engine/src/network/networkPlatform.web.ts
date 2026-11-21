import type { NetworkListener } from './types';

/** Connection availability only; browsers cannot guarantee that a server is reachable. */
export function observeNetwork(changed: NetworkListener): () => void {
  if (typeof window === 'undefined') {
    changed(null);
    return () => {};
  }
  const update = () => changed(typeof navigator.onLine === 'boolean' ? navigator.onLine : null);
  window.addEventListener('online', update);
  window.addEventListener('offline', update);
  update();
  return () => {
    window.removeEventListener('online', update);
    window.removeEventListener('offline', update);
  };
}
