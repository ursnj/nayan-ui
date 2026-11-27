import { expect, test } from 'bun:test';
import { IDBFactory } from 'fake-indexeddb';
import { initSync } from '../../../native/core/build/web/engine_core.js';
import { access, contactsRequest } from '../platform.web';
import type { Contact, ContactPage } from '../types';

test('browser CRUD persists the private address book and serializes concurrent writes', async () => {
  const module = await Bun.file(new URL('../../../native/core/build/web/engine_core_bg.wasm', import.meta.url)).arrayBuffer();
  initSync({ module });
  const globals = ['window', 'indexedDB'] as const;
  const original = globals.map((name) => Object.getOwnPropertyDescriptor(globalThis, name));
  Object.defineProperties(globalThis, {
    window: { configurable: true, value: {} },
    indexedDB: { configurable: true, value: new IDBFactory() }
  });
  try {
    expect(await access()).toMatchObject({ source: 'app', read: { status: 'granted' }, write: { status: 'granted' } });
    const [ada, grace] = await Promise.all([
      contactsRequest<Contact>('create', { fields: { givenName: 'Ada', phones: [{ number: '+1 555-1234' }] } }),
      contactsRequest<Contact>('create', { fields: { givenName: 'Grace' } })
    ]);
    expect(ada.id).not.toBe(grace.id);
    expect((await contactsRequest<ContactPage>('list', { options: { search: '5551234' } })).data).toEqual([ada]);
    expect((await contactsRequest<ContactPage>('list', { options: { limit: 1 } })).hasNextPage).toBe(true);
    expect(await contactsRequest<Contact>('update', { id: ada.id, fields: { givenName: null, company: 'Science' } })).toEqual({
      id: ada.id,
      company: 'Science',
      phones: ada.phones,
      emails: []
    });
    await expect(contactsRequest('update', { id: ada.id, fields: { emails: [null] } })).rejects.toThrow('Invalid contact email');
    expect(await contactsRequest('get', { id: grace.id })).toEqual(grace);
    expect(await contactsRequest('remove', { id: grace.id })).toBe(true);
    expect(await contactsRequest('remove', { id: grace.id })).toBe(false);
    expect(await contactsRequest('get', { id: grace.id })).toBeNull();
    expect((await contactsRequest<ContactPage>('list')).total).toBe(1);
  } finally {
    globals.forEach((name, index) => {
      const descriptor = original[index];
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else Reflect.deleteProperty(globalThis, name);
    });
  }
});
