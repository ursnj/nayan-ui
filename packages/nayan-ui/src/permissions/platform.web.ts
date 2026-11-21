import { stopMediaStream } from '../native/mediaStream.web';
import { permission_result } from '../../native/core/build/web/engine_core.js';
import { prepareWasm } from '../native/wasm.web';
import { type Permission, permissionNames, type PermissionResult } from './types';

const known = new Set<string>(permissionNames);
const unavailable: Readonly<PermissionResult> = { status: 'unavailable', canAskAgain: false };
const dispatch = {
  'camera': 'camera',
  'microphone': 'microphone',
  'location': 'geolocation',
  'location-coarse': 'geolocation',
  'motion': 'accelerometer',
  'clipboard-read': 'clipboard-read',
  'clipboard-write': 'clipboard-write',
  'persistent-storage': 'persistent-storage'
} as const;

function validate(permission: Permission | undefined) {
  if (permission !== undefined && !known.has(permission) && !/^android:[A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)+$/.test(permission)) {
    throw new Error('Unknown permission');
  }
}

async function permissionState(name: string): Promise<PermissionState | undefined> {
  try {
    return (await navigator.permissions?.query({ name: name as PermissionName }))?.state;
  } catch {
    return undefined;
  }
}

async function result(observation: string): Promise<PermissionResult> {
  await prepareWasm();
  return JSON.parse(permission_result(observation)) as PermissionResult;
}

async function query(name: string): Promise<PermissionResult> {
  const state = await permissionState(name);
  return result(state === 'denied' ? 'blocked' : (state ?? 'unknown'));
}

function motionRequest() {
  if (typeof DeviceMotionEvent === 'undefined') return;
  const motion = DeviceMotionEvent as typeof DeviceMotionEvent & { requestPermission?: () => Promise<'granted' | 'denied'> };
  return motion.requestPermission?.bind(motion);
}

export async function check(permission: Permission): Promise<PermissionResult> {
  validate(permission);
  if (typeof window === 'undefined' || !window.isSecureContext) return { ...unavailable };

  switch (permission) {
    case 'camera':
    case 'microphone':
      return typeof navigator.mediaDevices?.getUserMedia === 'function' ? query(dispatch[permission]) : { ...unavailable };
    case 'notifications': {
      if (typeof Notification === 'undefined') return { ...unavailable };
      const state = (await permissionState('notifications')) ?? Notification.permission;
      return result(state === 'default' ? 'prompt' : state === 'denied' ? 'blocked' : state);
    }
    case 'location':
    case 'location-coarse':
      return navigator.geolocation ? query(dispatch[permission]) : { ...unavailable };
    case 'motion':
      return typeof DeviceMotionEvent !== 'undefined' ? query(dispatch.motion) : { ...unavailable };
    case 'clipboard-read':
    case 'clipboard-write':
      return navigator.clipboard ? query(dispatch[permission]) : { ...unavailable };
    case 'persistent-storage':
      if (typeof navigator.storage?.persisted !== 'function') return { ...unavailable };
      return (await navigator.storage.persisted()) ? result('granted') : query(dispatch[permission]);
    default:
      return { ...unavailable };
  }
}

async function requestMedia(permission: 'camera' | 'microphone'): Promise<PermissionResult> {
  const media = navigator.mediaDevices;
  if (typeof media?.getUserMedia !== 'function') return { ...unavailable };
  try {
    const stream = await media.getUserMedia(permission === 'camera' ? { video: true } : { audio: true });
    stopMediaStream(stream);
    return result('granted');
  } catch (error) {
    const name = (error as DOMException | undefined)?.name;
    if (name === 'NotFoundError') return result('unavailable');
    if (name !== 'NotAllowedError') throw error;
    const state = await permissionState(permission);
    return result(state === 'denied' ? 'blocked' : state === 'prompt' ? 'retryable-denial' : 'denied');
  }
}

async function requestLocation(): Promise<PermissionResult> {
  if (!navigator.geolocation) return { ...unavailable };
  try {
    await new Promise<void>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(() => resolve(), reject, { timeout: 10000 });
    });
    return result('granted');
  } catch (error) {
    const state = await permissionState('geolocation');
    if (state === 'granted') return result('granted');
    if ((error as GeolocationPositionError | undefined)?.code !== 1) throw error;
    return result(state === 'denied' ? 'blocked' : state === 'prompt' ? 'retryable-denial' : 'denied');
  }
}

export async function request(permission: Permission): Promise<PermissionResult> {
  validate(permission);
  if (typeof window === 'undefined' || !window.isSecureContext) return { ...unavailable };

  // Start browser operations in the caller's gesture, before preparing Rust/WASM.
  switch (permission) {
    case 'camera':
    case 'microphone':
      return requestMedia(permission);
    case 'notifications': {
      if (typeof Notification === 'undefined' || typeof Notification.requestPermission !== 'function') return { ...unavailable };
      const answer = await Notification.requestPermission();
      return result(answer === 'default' ? 'prompt' : answer === 'denied' ? 'blocked' : 'granted');
    }
    case 'location':
    case 'location-coarse':
      return requestLocation();
    case 'motion': {
      const prompt = motionRequest();
      return prompt ? result((await prompt()) === 'granted' ? 'granted' : 'blocked') : check(permission);
    }
    case 'persistent-storage':
      return typeof navigator.storage?.persist === 'function'
        ? result((await navigator.storage.persist()) ? 'granted' : 'denied')
        : check(permission);
    default:
      return check(permission);
  }
}

export async function openSettings(permission?: Permission): Promise<boolean> {
  validate(permission);
  return false;
}
