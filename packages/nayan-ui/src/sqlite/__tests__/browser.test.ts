import { afterEach, beforeEach, expect, test } from 'bun:test';
import { openConnection } from '../platform.web';
import type { WorkerReply, WorkerRequest } from '../protocol';

class TestWorker {
  static instances: TestWorker[] = [];
  readonly requests: WorkerRequest[] = [];
  onmessage?: (event: MessageEvent<WorkerReply>) => void;
  onmessageerror?: () => void;
  onerror?: (event: ErrorEvent) => void;
  terminated = 0;
  postError?: Error;

  constructor(
    readonly url: URL,
    readonly options: WorkerOptions
  ) {
    TestWorker.instances.push(this);
  }

  postMessage(request: WorkerRequest) {
    if (this.postError) throw this.postError;
    this.requests.push(request);
  }

  reply(id: number, result: object) {
    this.onmessage?.({ data: { id, response: JSON.stringify(result) } } as MessageEvent<WorkerReply>);
  }

  terminate() {
    this.terminated += 1;
  }
}

const globals = ['window', 'Worker', 'isSecureContext'] as const;
let descriptors: (PropertyDescriptor | undefined)[];
function installBrowser(secure = true) {
  for (const [index, value] of [{}, TestWorker, secure].entries()) Object.defineProperty(globalThis, globals[index]!, { configurable: true, value });
}
beforeEach(() => {
  descriptors = globals.map((name) => Object.getOwnPropertyDescriptor(globalThis, name));
  TestWorker.instances.length = 0;
});
afterEach(() => {
  for (const [index, name] of globals.entries()) {
    const descriptor = descriptors[index];
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else Reflect.deleteProperty(globalThis, name);
  }
});

test('SQLite creates a module worker and correlates concurrent replies by request ID', async () => {
  installBrowser();
  const opened = openConnection('notes');
  const worker = TestWorker.instances[0]!;
  expect(worker.url.pathname).toEndWith('/sqlite-worker.js');
  expect(worker.options).toEqual({ type: 'module' });
  expect(worker.requests).toEqual([{ op: 'open', id: 1, name: 'notes' }]);
  worker.reply(1, { ok: true, value: 3 });
  const connection = await opened;
  expect(connection.handle).toBe(3);
  const first = connection.send('first');
  const second = connection.send('second');
  expect(worker.requests.slice(1)).toEqual([
    { op: 'request', id: 2, command: 'first' },
    { op: 'request', id: 3, command: 'second' }
  ]);
  worker.reply(3, { ok: true, value: 'second' });
  worker.reply(2, { ok: true, value: 'first' });
  expect(JSON.parse(await first)).toEqual({ ok: true, value: 'first' });
  expect(JSON.parse(await second)).toEqual({ ok: true, value: 'second' });
  connection.dispose?.();
  connection.dispose?.();
  expect(worker.terminated).toBe(1);
  await expect(connection.send('late')).rejects.toThrow('closed');
});

test('worker failure rejects pending requests and discards late replies', async () => {
  installBrowser();
  const opened = openConnection();
  const worker = TestWorker.instances[0]!;
  worker.reply(1, { ok: true, value: 4 });
  const connection = await opened;
  const pending = [connection.send('one'), connection.send('two')];
  const failures = Promise.allSettled(pending);
  worker.onmessageerror?.();
  worker.reply(2, { ok: true, value: 'late' });
  worker.onerror?.({ message: 'duplicate failure' } as ErrorEvent);
  for (const result of await failures)
    expect(result).toMatchObject({
      status: 'rejected',
      reason: expect.objectContaining({ message: 'SQLite worker delivered an unreadable response' })
    });
  expect(worker.terminated).toBe(1);
  await expect(connection.send('late')).rejects.toThrow('unreadable response');
});

test('failed initialization and postMessage exceptions terminate their workers', async () => {
  installBrowser();
  const opening = openConnection();
  const worker = TestWorker.instances[0]!;
  worker.reply(1, { ok: false, error: 'OPFS denied' });
  await expect(opening).rejects.toThrow('OPFS denied');
  expect(worker.terminated).toBe(1);

  const second = openConnection();
  const another = TestWorker.instances[1]!;
  another.reply(1, { ok: true, value: 5 });
  const connection = await second;
  another.postError = new Error('post failed');
  await expect(connection.send('query')).rejects.toThrow('post failed');
  expect(another.terminated).toBe(1);
});

test('SSR and insecure persistent storage are rejected before creating a worker', async () => {
  expect(typeof window).toBe('undefined');
  await expect(openConnection()).rejects.toThrow('dedicated workers');
  installBrowser(false);
  await expect(openConnection('notes')).rejects.toThrow('secure browser context');
  expect(TestWorker.instances).toHaveLength(0);
});
