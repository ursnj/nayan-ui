import * as core from '../../native/core/build/web/engine_core.js';
import { prepareWasm } from '../native/wasm.web';
import type { LocationReceiver, LocationResult } from './types';

function provider(): Geolocation | undefined {
  return typeof window !== 'undefined' && window.isSecureContext ? window.navigator.geolocation : undefined;
}

export async function isAvailable(): Promise<boolean> {
  if (!provider()) return false;
  try {
    await prepareWasm();
    return core.location_available();
  } catch {
    return false;
  }
}

export function subscribe(highAccuracy: boolean, receive: LocationReceiver): () => void {
  const geolocation = provider();
  let stopped = false;
  let id: number | undefined;

  async function start() {
    if (!geolocation || !(await isAvailable())) {
      if (!stopped) receive({ error: 'unavailable' });
      return;
    }
    if (stopped) return;
    id = geolocation.watchPosition(
      ({ coords, timestamp }) => {
        if (stopped) return;
        const { latitude, longitude, accuracy, altitude, altitudeAccuracy, heading, speed } = coords;
        receive(
          JSON.parse(
            core.location_position(
              JSON.stringify({
                latitude,
                longitude,
                accuracy,
                timestamp,
                altitude,
                altitudeAccuracy,
                heading,
                speed
              })
            )
          ) as LocationResult
        );
      },
      (error) => {
        if (!stopped) receive({ error: error.code === 1 ? 'permission-denied' : error.code === 3 ? 'timeout' : 'unavailable' });
      },
      { enableHighAccuracy: highAccuracy, maximumAge: 0 }
    );
    if (stopped) geolocation.clearWatch(id);
  }

  void start().catch(() => {
    if (!stopped) receive({ error: 'unavailable' });
  });
  return () => {
    stopped = true;
    if (id !== undefined) geolocation?.clearWatch(id);
  };
}
