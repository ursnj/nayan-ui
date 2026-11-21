import { requestAppService } from '../native/appServices';
import type { Permission, PermissionResult } from './types';

let queue: Promise<unknown> = Promise.resolve();

export function check(permission: Permission): Promise<PermissionResult> {
  return requestAppService({ action: 'permissions.check', permission });
}

export function openSettings(permission?: Permission): Promise<boolean> {
  return requestAppService({ action: 'permissions.openSettings', permission });
}

export function request(permission: Permission): Promise<PermissionResult> {
  const result = queue.then(() => requestAppService<PermissionResult>({ action: 'permissions.request', permission }));
  queue = result.catch(() => {});
  return result;
}
