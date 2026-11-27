import { type SQLiteConnection, sqliteResult, type WorkerReply, type WorkerRequest } from './protocol';

export async function openConnection(name?: string): Promise<SQLiteConnection> {
  if (typeof window === 'undefined' || typeof Worker !== 'function') throw new Error('SQLite requires a browser with dedicated workers');
  if (name !== undefined && !globalThis.isSecureContext) throw new Error('Named SQLite databases require a secure browser context with OPFS');

  const worker = new Worker(new URL('./sqlite-worker.js', import.meta.url), { type: 'module' });
  const pending = new Map<number, { resolve(value: string): void; reject(error: Error): void }>();
  let nextId = 0;
  let failure: Error | undefined;

  function stop(error: Error) {
    if (failure) return;
    failure = error;
    worker.terminate();
    for (const entry of pending.values()) entry.reject(error);
    pending.clear();
  }

  worker.onmessage = ({ data }: MessageEvent<WorkerReply>) => {
    const entry = pending.get(data.id);
    pending.delete(data.id);
    entry?.resolve(data.response);
  };
  worker.onerror = (event) => stop(new Error(event.message || 'SQLite worker failed'));
  worker.onmessageerror = () => stop(new Error('SQLite worker delivered an unreadable response'));

  function send(request: WorkerRequest): Promise<string> {
    if (failure) return Promise.reject(failure);
    return new Promise((resolve, reject) => {
      pending.set(request.id, { resolve, reject });
      try {
        worker.postMessage(request);
      } catch (error) {
        stop(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  try {
    const handle = sqliteResult<number>(await send({ id: ++nextId, op: 'open', name }));
    return {
      handle,
      send: (command) => send({ id: ++nextId, op: 'request', command }),
      dispose: () => stop(new Error('SQLite connection is closed'))
    };
  } catch (error) {
    stop(new Error('SQLite connection could not open'));
    throw error;
  }
}
