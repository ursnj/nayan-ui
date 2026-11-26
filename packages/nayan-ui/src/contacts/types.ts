import type { PermissionResult } from '../permissions/types';

export interface ContactPhone {
  number: string;
  label?: string;
}

export interface ContactEmail {
  email: string;
  label?: string;
}

export interface ContactFields {
  givenName?: string;
  middleName?: string;
  familyName?: string;
  company?: string;
  jobTitle?: string;
  phones?: ContactPhone[];
  emails?: ContactEmail[];
}

export interface Contact extends ContactFields {
  /** Opaque ID scoped to the current address book. */
  id: string;
  phones: ContactPhone[];
  emails: ContactEmail[];
}

/** Omit a field to preserve it. Use null to clear text or [] to clear phones or emails. */
export type ContactPatch = { [Field in Exclude<keyof ContactFields, 'phones' | 'emails'>]?: string | null } & Pick<
  ContactFields,
  'phones' | 'emails'
>;

export interface ContactQuery {
  search?: string;
  offset?: number;
  limit?: number;
}

export interface ContactPage {
  data: Contact[];
  total: number;
  hasNextPage: boolean;
}

export interface ContactsAccess {
  source: 'device' | 'app';
  read: PermissionResult;
  write: PermissionResult;
}
