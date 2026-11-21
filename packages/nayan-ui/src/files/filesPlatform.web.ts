import { type FileDirectory, type FileInfo, MAX_FILE_BYTES } from './types';

const owned = new Set<string>();
let retained = 0;
const sizes = new Map<string, number>();
export const temporaryFiles = {
  async write(base64: string, _fileName: string, mimeType: string): Promise<string> {
    if (typeof URL.createObjectURL !== 'function') throw new Error('Temporary files require object URL support');
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64)) throw new TypeError('Invalid base64 data');
    const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
    if (retained + (base64.length / 4) * 3 - padding > 256 * 1024 * 1024 || owned.size >= 1024)
      throw new Error('Temporary file cache is full; release unused files');
    // Decode in aligned chunks instead of retaining a second full-size binary string.
    const chunks: Uint8Array<ArrayBuffer>[] = [];
    let length = 0;
    for (let offset = 0; offset < base64.length; offset += 32768) {
      const part = atob(base64.slice(offset, offset + 32768));
      const bytes = new Uint8Array(part.length);
      for (let i = 0; i < part.length; i++) bytes[i] = part.charCodeAt(i);
      length += bytes.length;
      chunks.push(bytes);
    }
    if (retained + length > 256 * 1024 * 1024) throw new Error('Temporary file cache is full; release unused files');
    const uri = URL.createObjectURL(new Blob(chunks, { type: mimeType }));
    owned.add(uri);
    sizes.set(uri, length);
    retained += length;
    return uri;
  },
  async remove(uri: string): Promise<void> {
    if (owned.delete(uri)) {
      retained -= sizes.get(uri) ?? 0;
      sizes.delete(uri);
      URL.revokeObjectURL(uri);
    } else if (!uri.startsWith('blob:')) throw new Error('Only engine temporary object URLs can be removed');
  }
};

interface StoredFile {
  namespace: string;
  name: string;
  data: Blob;
  modifiedAt: number;
}

let opening: Promise<IDBDatabase> | undefined;
function database(): Promise<IDBDatabase> {
  if (!opening) {
    opening = new Promise<IDBDatabase>((resolve, reject) => {
      if (typeof indexedDB === 'undefined') throw new Error('Persistent files require IndexedDB');
      const open = indexedDB.open('nayan-files', 1);
      open.onupgradeneeded = () => {
        open.result.createObjectStore('files', { keyPath: ['namespace', 'name'] }).createIndex('namespace', 'namespace');
      };
      open.onerror = () => reject(open.error);
      open.onsuccess = () => {
        const db = open.result;
        db.onversionchange = () => {
          db.close();
          opening = undefined;
        };
        db.onclose = () => {
          opening = undefined;
        };
        resolve(db);
      };
    }).catch((error: unknown) => {
      opening = undefined;
      throw error;
    });
  }
  return opening;
}

async function operation<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('files', mode);
    const request = run(transaction.objectStore('files'));
    transaction.oncomplete = () => resolve(request.result);
    transaction.onabort = () => reject(transaction.error ?? new Error('File transaction was aborted'));
  });
}

function info(file: StoredFile): FileInfo {
  return { name: file.name, size: file.data.size, modifiedAt: file.modifiedAt };
}

export async function openFileDirectory(namespace: string): Promise<FileDirectory> {
  await database();
  const get = (name: string) => operation<StoredFile | undefined>('readonly', (store) => store.get([namespace, name]));
  const write = async (name: string, data: Blob) => {
    if (data.size > MAX_FILE_BYTES) throw new RangeError('File exceeds 64 MiB');
    await operation('readwrite', (store) => store.put({ namespace, name, data, modifiedAt: Date.now() } satisfies StoredFile));
  };
  return {
    write(name, bytes) {
      // Blob snapshots the caller's byte range before the transaction starts.
      const view = bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      const data = view.buffer instanceof ArrayBuffer ? (view as Uint8Array<ArrayBuffer>) : view.slice();
      return write(name, new Blob([data]));
    },
    writeText: (name, text) => write(name, new Blob([text])),
    async read(name) {
      return (await get(name))?.data.arrayBuffer();
    },
    async readText(name) {
      const file = await get(name);
      return file && new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(await file.data.arrayBuffer());
    },
    async stat(name) {
      const file = await get(name);
      return file && info(file);
    },
    async list() {
      return (await operation<StoredFile[]>('readonly', (store) => store.index('namespace').getAll(namespace))).map(info);
    },
    async remove(name) {
      const db = await database();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction('files', 'readwrite');
        const store = transaction.objectStore('files');
        const key = [namespace, name];
        const existing = store.getKey(key);
        store.delete(key);
        transaction.oncomplete = () => resolve(existing.result !== undefined);
        transaction.onabort = () => reject(transaction.error ?? new Error('File deletion was aborted'));
      });
    }
  };
}
