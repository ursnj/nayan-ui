import { access, contactsRequest, isAvailable } from './platform';
import type { Contact, ContactFields, ContactPage, ContactPatch, ContactQuery } from './types';

export type { Contact, ContactEmail, ContactFields, ContactPage, ContactPatch, ContactPhone, ContactQuery, ContactsAccess } from './types';

export const contacts = {
  isAvailable,
  getPermissions: () => access(false, false),
  /** Ask from a user action. Pass write: true before creating, editing, or deleting device contacts. */
  requestPermissions: ({ write = false } = {}) => access(true, write),
  list: (options: ContactQuery = {}) => contactsRequest<ContactPage>('list', { options }),
  get: (id: string) => contactsRequest<Contact | null>('get', { id }),
  create: (fields: ContactFields) => contactsRequest<Contact>('create', { fields }),
  update: (id: string, fields: ContactPatch) => contactsRequest<Contact | null>('update', { id, fields }),
  remove: (id: string) => contactsRequest<boolean>('remove', { id })
};
