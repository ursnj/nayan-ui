export type StoragePrimitive = string | number | boolean;
export type StorageValue = StoragePrimitive | ArrayBuffer;
/** Plain JSON data. Dates, functions, undefined and cyclic objects are not JSON values. */
export type StorageJSON = null | boolean | number | string | readonly StorageJSON[] | { readonly [key: string]: StorageJSON };
export type StorageEncryptionType = 'AES-128' | 'AES-256';
export interface StorageConfiguration {
  id?: string;
  /** App-managed, high-entropy secret for native encryption. Supply the same key on every open. */
  encryptionKey?: string;
  /** Defaults to AES-128 for new encrypted stores. Existing encrypted stores remember their type. */
  encryptionType?: StorageEncryptionType;
}
export interface StorageBackend {
  listen?(changed: (keys: string[]) => void): () => void;
  read(key: string): StorageValue | undefined;
  write(key: string, value: StorageValue): void;
  command<T>(op: string, options?: Record<string, unknown>): T;
}
