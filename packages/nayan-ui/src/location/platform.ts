import { appServicesAvailable, requestAppService } from '../native/appServices';
import type { LocationReceiver, LocationResult } from './types';

let nextId = 0;

export async function isAvailable(): Promise<boolean> {
  return appServicesAvailable() && (await requestAppService<boolean>({ action: 'location.available' }).catch(() => false));
}

export function subscribe(highAccuracy: boolean, receive: LocationReceiver): () => void {
  const id = String(++nextId);
  let stopped = false;

  async function read() {
    while (!stopped) {
      const result = await requestAppService<LocationResult>({ action: 'location.next', id, highAccuracy }).catch((): LocationResult => ({
        error: 'unavailable'
      }));
      if (stopped) return;
      receive(result);
      if ('error' in result) return;
      // Give one-shot callers a chance to release the subscription before requesting another fix.
      await Promise.resolve();
    }
  }

  void read();
  return () => {
    stopped = true;
    void requestAppService({ action: 'location.stop', id }).catch(() => {});
  };
}
