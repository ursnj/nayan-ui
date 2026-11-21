export type StoragePrimitive = string | number | boolean;
export type StorageValue = StoragePrimitive | ArrayBuffer;
/** Plain JSON data. Dates, functions, undefined and cyclic objects are not JSON values. */
export type StorageJSON = null | boolean | number | string | readonly StorageJSON[] | { readonly [key: string]: StorageJSON };
export interface StorageConfiguration {
  id?: string;
}
export interface StorageBackend {
  listen?(changed: (keys: string[]) => void): () => void;
  read(key: string): StorageValue | undefined;
  write(key: string, value: StorageValue): void;
  command<T>(op: string, options?: Record<string, unknown>): T;
}
