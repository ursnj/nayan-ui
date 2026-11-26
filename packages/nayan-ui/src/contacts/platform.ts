import { appServicesAvailable, requestAppService } from '../native/appServices';
import { permissions } from '../permissions/index';
import type { ContactsAccess } from './types';

export async function isAvailable(): Promise<boolean> {
  return appServicesAvailable() && (await requestAppService<boolean>({ action: 'contacts.available' }).catch(() => false));
}

export async function access(request: boolean, write: boolean): Promise<ContactsAccess> {
  if (!(await isAvailable())) {
    return { source: 'device', read: { status: 'unavailable', canAskAgain: false }, write: { status: 'unavailable', canAskAgain: false } };
  }
  const check = request ? permissions.request : permissions.check;
  const read = await check('contacts');
  const writePermission =
    request && write && (read.status === 'granted' || read.status === 'limited')
      ? await permissions.request('contacts-write')
      : await permissions.check('contacts-write');
  return { source: 'device', read, write: writePermission };
}

export async function contactsRequest<T>(action: string, data: Record<string, unknown> = {}): Promise<T> {
  const command = { action: `contacts.${action}`, ...data };
  if (action !== 'list') return requestAppService<T>(command);
  const result = await requestAppService<{ ok: true; value: T } | { ok: false; error: string }>(command);
  if (!result.ok) throw new Error(result.error);
  return result.value;
}
