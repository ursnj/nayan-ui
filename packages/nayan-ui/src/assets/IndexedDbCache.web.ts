// Browser I/O only. Rust owns cache keys, record validation, geometry and the warm-memory budget.
const DATABASE = 'nayan-engine-assets-v1';
interface GeometryRecord {
  bytes: number;
  writtenAt: number;
}
function complete(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error ?? new Error('Asset storage transaction aborted'));
    transaction.onerror = () => reject(transaction.error ?? new Error('Asset storage transaction failed'));
  });
}
function result<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Asset storage request failed'));
  });
}
export class IndexedDbCache {
  private tail: Promise<void> = Promise.resolve();
  private pending = new Set<Promise<void>>();
  private generation = 0;
  private clearOperation: Promise<void> = Promise.resolve();
  private constructor(private readonly database: IDBDatabase) {
    database.onversionchange = () => database.close();
  }
  static open(): Promise<IndexedDbCache> {
    return new Promise((resolve, reject) => {
      let settled = false;
      let request: IDBOpenDBRequest;
      try {
        request = indexedDB.open(DATABASE, 1);
      } catch (error) {
        reject(error);
        return;
      }
      request.onupgradeneeded = () => {
        try {
          const db = request.result;
          db.createObjectStore('records');
          db.createObjectStore('geometry').createIndex('writtenAt', 'writtenAt');
        } catch {
          request.transaction?.abort();
        }
      };
      request.onsuccess = () => {
        if (settled) {
          request.result.close();
          return;
        }
        settled = true;
        resolve(new IndexedDbCache(request.result));
      };
      request.onerror = () => {
        settled = true;
        reject(request.error ?? new Error('Asset database unavailable'));
      };
      request.onblocked = () => {
        settled = true;
        reject(new Error('Another tab blocked the asset database upgrade'));
      };
    });
  }
  private enqueue(operation: () => Promise<void>): Promise<void> {
    const task = this.tail.then(operation);
    this.pending.add(task);
    this.tail = task.catch(() => {}); // A failed write must not prevent a later clear/write.
    void task.then(
      () => this.pending.delete(task),
      () => this.pending.delete(task)
    );
    return task;
  }
  /** The Uint8Array is an owned copy made by Rust, never a view into growable WASM memory. */
  write(name: string, bytes: Uint8Array, geometry: boolean): Promise<void> {
    const epoch = this.generation;
    return this.enqueue(async () => {
      if (epoch !== this.generation) return;
      const transaction = this.database.transaction(['records', 'geometry'], 'readwrite');
      const saved = complete(transaction);
      try {
        transaction.objectStore('records').put(bytes, name);
        if (geometry)
          transaction.objectStore('geometry').put(
            {
              bytes: bytes.byteLength,
              writtenAt: Date.now()
            } satisfies GeometryRecord,
            name
          );
      } catch (error) {
        transaction.abort();
        await saved.catch(() => {});
        throw error;
      }
      await saved;
    });
  }
  async read(name: string): Promise<Uint8Array | undefined> {
    await this.tail;
    const transaction = this.database.transaction('records', 'readonly');
    const finished = complete(transaction);
    const value = await Promise.all([result(transaction.objectStore('records').get(name)), finished]);
    const bytes: unknown = value[0];
    return bytes instanceof Uint8Array ? bytes : undefined;
  }
  remove(name: string): Promise<void> {
    return this.enqueue(async () => {
      const transaction = this.database.transaction(['records', 'geometry'], 'readwrite');
      const finished = complete(transaction);
      transaction.objectStore('records').delete(name);
      transaction.objectStore('geometry').delete(name);
      await finished;
    });
  }
  clear(): Promise<void> {
    this.generation++; // Cancel queued pre-clear writes; an active transaction finishes before clear.
    this.clearOperation = this.enqueue(async () => {
      const transaction = this.database.transaction(['records', 'geometry'], 'readwrite');
      const finished = complete(transaction);
      transaction.objectStore('records').clear();
      transaction.objectStore('geometry').clear();
      await finished;
    });
    return this.clearOperation;
  }
  flush(): Promise<void> {
    return Promise.all([...this.pending]).then(() => undefined);
  }
  cleared(): Promise<void> {
    return this.clearOperation;
  }

  /** Read recent geometry only. Large source files remain in IndexedDB until requested by a loader. */
  warm(canFit: (size: number) => boolean, restore: (name: string, bytes: Uint8Array) => boolean): Promise<void> {
    const transaction = this.database.transaction(['records', 'geometry'], 'readonly');
    const finished = complete(transaction);
    const cursor = transaction.objectStore('geometry').index('writtenAt').openCursor(null, 'prev');
    let scanned = 0;
    cursor.onsuccess = () => {
      const current = cursor.result;
      if (!current || !canFit(0) || ++scanned > 4096) return;
      const metadata = current.value as GeometryRecord | null;
      if (
        typeof current.primaryKey === 'string' &&
        metadata !== null &&
        typeof metadata === 'object' &&
        Number.isSafeInteger(metadata.bytes) &&
        metadata.bytes > 0 &&
        canFit(metadata.bytes)
      ) {
        const name = current.primaryKey;
        const record = transaction.objectStore('records').get(name);
        record.onsuccess = () => {
          if (record.result instanceof Uint8Array && record.result.byteLength === metadata.bytes && canFit(record.result.byteLength))
            restore(name, record.result);
        };
      }
      current.continue();
    };
    return finished;
  }
}
