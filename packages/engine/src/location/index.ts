import { permissions } from '../permissions/index';
import { isAvailable, subscribe } from './platform';
import { LocationError, type LocationOptions, type LocationPosition, type LocationWatchOptions } from './types';

export { LocationError } from './types';
export type { LocationErrorCode, LocationOptions, LocationPosition, LocationWatchOptions } from './types';

function watchPosition(onPosition: (position: LocationPosition) => void, options: LocationWatchOptions = {}): () => void {
  const { highAccuracy = false, timeoutMs = 15000, signal, onError } = options;
  if (typeof highAccuracy !== 'boolean') throw new TypeError('highAccuracy must be a boolean');
  if (!Number.isFinite(timeoutMs) || timeoutMs < 0 || timeoutMs > 2147483647) {
    throw new RangeError('timeoutMs must be between 0 and 2147483647');
  }

  let stopped = false;
  let release: (() => void) | undefined;
  const timer = signal?.aborted ? undefined : setTimeout(() => fail(new LocationError('timeout')), timeoutMs);

  function stop() {
    if (stopped) return;
    stopped = true;
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
    release?.();
  }

  function fail(error: LocationError) {
    if (stopped) return;
    stop();
    onError?.(error);
  }

  function abort() {
    fail(new LocationError('aborted', signal?.reason));
  }

  if (signal?.aborted) {
    queueMicrotask(abort);
    return stop;
  }
  signal?.addEventListener('abort', abort, { once: true });
  try {
    release = subscribe(highAccuracy, (result) => {
      queueMicrotask(() => {
        if (stopped) return;
        if ('error' in result) {
          fail(new LocationError(result.error));
        } else {
          clearTimeout(timer);
          onPosition(result.position);
        }
      });
    });
  } catch (error) {
    queueMicrotask(() => fail(new LocationError('unavailable', error)));
  }
  if (stopped) release?.();
  return stop;
}

export const location = {
  /** Reports whether the platform provider and engine feature are available. */
  isAvailable,
  getPermission: (accuracy: 'precise' | 'approximate' = 'precise') => permissions.check(accuracy === 'approximate' ? 'location-coarse' : 'location'),
  requestPermission: (accuracy: 'precise' | 'approximate' = 'precise') =>
    permissions.request(accuracy === 'approximate' ? 'location-coarse' : 'location'),

  getCurrentPosition(options?: LocationOptions): Promise<LocationPosition> {
    return new Promise((resolve, reject) => {
      const stop = watchPosition(
        (position) => {
          stop();
          resolve(position);
        },
        { ...options, onError: reject }
      );
    });
  },

  /** Delivers the first foreground fix and subsequent updates. Call the returned function to unsubscribe. */
  subscribe: watchPosition,

  /** Alias for subscribe. */
  watchPosition
};
