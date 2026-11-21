import { check, openSettings, request } from './platform';
import type { Permission, PermissionResult } from './types';

export { permissionNames } from './types';
export type { AndroidPermission, Permission, PermissionResult, PermissionStatus } from './types';

const pending = new Map<Permission, Promise<PermissionResult>>();

function requestPermission(permission: Permission): Promise<PermissionResult> {
  const existing = pending.get(permission);
  if (existing) return existing;
  const result = request(permission).finally(() => pending.delete(permission));
  pending.set(permission, result);
  return result;
}

export const permissions = {
  /** Reads the current permission without prompting. */
  check,
  /** Opens the app's settings or a supported permission-specific screen. */
  openSettings,

  /** Requests access. Call from a user action in the foreground. */
  request: requestPermission,

  async checkMany(names: readonly Permission[]): Promise<Map<Permission, PermissionResult>> {
    return new Map(await Promise.all([...new Set(names)].map(async (name) => [name, await check(name)] as const)));
  },

  /** Request permissions in order, with one prompt at a time. Call from a user action. */
  async requestMany(names: readonly Permission[]): Promise<Map<Permission, PermissionResult>> {
    const results = new Map<Permission, PermissionResult>();
    for (const name of new Set(names)) results.set(name, await requestPermission(name));
    return results;
  }
};
