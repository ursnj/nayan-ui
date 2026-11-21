export interface LocationPosition {
  latitude: number;
  longitude: number;
  /** Horizontal uncertainty in meters. */
  accuracy: number;
  /** Milliseconds since the Unix epoch. */
  timestamp: number;
  /** Meters above the provider's reference surface. */
  altitude: number | null;
  /** Vertical uncertainty in meters. */
  altitudeAccuracy: number | null;
  /** Direction of travel in degrees clockwise from true north. */
  heading: number | null;
  /** Meters per second. */
  speed: number | null;
}

export type LocationErrorCode = 'permission-denied' | 'unavailable' | 'timeout' | 'aborted';

const messages: Record<LocationErrorCode, string> = {
  'permission-denied': 'Location permission is required',
  'unavailable': 'Location is unavailable',
  'timeout': 'Timed out waiting for a location fix',
  'aborted': 'Location tracking ended'
};

export class LocationError extends Error {
  constructor(
    readonly code: LocationErrorCode,
    cause?: unknown
  ) {
    super(messages[code], { cause });
    this.name = 'LocationError';
  }
}

export interface LocationOptions {
  /** Ask the OS for a more accurate fix when available. Default: false. */
  highAccuracy?: boolean;
  /** Deadline for the first fix in milliseconds. Default: 15000. */
  timeoutMs?: number;
  signal?: AbortSignal;
}

export interface LocationWatchOptions extends LocationOptions {
  /** Called once for a terminal error or cancellation through the signal. */
  onError?: (error: LocationError) => void;
}

export type LocationResult = { position: LocationPosition } | { error: LocationErrorCode };
export type LocationReceiver = (result: LocationResult) => void;
