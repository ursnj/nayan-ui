import { contacts_request } from '../../native/core/build/web/engine_core.js';
import { prepareWasm } from '../native/wasm.web';
import type { Contact, ContactsAccess } from './types';

let opening: Promise<IDBDatabase> | undefined;

function open(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || typeof indexedDB === 'undefined') return Promise.reject(new Error('Browser contacts storage is unavailable'));
  return (opening ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('nayan-ui-contacts', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('addressBook');
    request.onerror = () => reject(new Error('Could not open browser contacts storage'));
    request.onsuccess = () => {
      request.result.onversionchange = () => {
        request.result.close();
        opening = undefined;
      };
      resolve(request.result);
    };
  }).catch((error) => {
    opening = undefined;
    throw error;
  }));
}

export async function isAvailable(): Promise<boolean> {
  try {
    await open();
    await prepareWasm();
    const result = JSON.parse(contacts_request('{"action":"contacts.list"}', '[]')) as { ok: boolean };
    return result.ok;
  } catch {
    return false;
  }
}

export async function access(_request?: boolean, _write?: boolean): Promise<ContactsAccess> {
  const status = (await isAvailable()) ? 'granted' : 'unavailable';
  return { source: 'app', read: { status, canAskAgain: false }, write: { status, canAskAgain: false } };
}

export async function contactsRequest<T>(action: string, data: Record<string, unknown> = {}): Promise<T> {
  const database = await open();
  await prepareWasm();
  const command = JSON.stringify({ action: `contacts.${action}`, ...data });
  const writing = action === 'create' || action === 'update' || action === 'remove';
  return new Promise<T>((resolve, reject) => {
    const transaction = database.transaction('addressBook', writing ? 'readwrite' : 'readonly');
    const store = transaction.objectStore('addressBook');
    const read = store.get('contacts');
    let value: T;
    transaction.onabort = () => reject(new Error('Browser contacts transaction failed'));
    transaction.oncomplete = () => resolve(value);
    read.onsuccess = () => {
      try {
        const result = JSON.parse(contacts_request(command, JSON.stringify(read.result ?? []))) as
          { ok: true; value: { value: T; rows?: Contact[] } } | { ok: false; error: string };
        if (!result.ok) throw new Error(result.error);
        value = result.value.value;
        if (writing && result.value.rows) store.put(result.value.rows, 'contacts');
      } catch (error) {
        reject(error);
        transaction.abort();
      }
    };
  });
}
