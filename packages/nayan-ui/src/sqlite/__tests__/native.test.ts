import { expect, mock, test } from 'bun:test';

interface Command {
  op: string;
  name?: string;
  handle?: number;
  statement?: { sql: string; params: unknown[] };
  statements?: { sql: string; params: unknown[] }[];
}

const ok = (value: unknown) => JSON.stringify({ ok: true, value });
const sqliteRequest = mock(async (_raw: string) => ok(1));
const native: { sqliteRequest?: typeof sqliteRequest } = { sqliteRequest };
mock.module('../../native/NativeNayanEngine', () => ({ default: native }));
const { sqlite } = await import('../index');

test('SQLite binds typed parameters and decodes ordered rows without losing integer precision', async () => {
  const integer = 9007199254740993n;
  const blob = Uint8Array.of(0, 255);
  const run = { changes: 1, lastInsertRowId: '9' };
  sqliteRequest
    .mockResolvedValueOnce(ok(17))
    .mockResolvedValueOnce(ok(run))
    .mockResolvedValueOnce(ok([run]))
    .mockResolvedValueOnce(
      ok({
        columns: ['value', 'bytes', 'unknown', 'approx', 'label', 'unbounded'],
        rows: [[{ integer: integer.toString() }, { blob: [0, 255] }, null, 1.25, 'hello', { real: '-Infinity' }]]
      })
    )
    .mockResolvedValueOnce(ok(null));

  const db = await sqlite.open(':memory:');
  expect(await db.run('INSERT INTO t VALUES (?, ?)', [integer, blob])).toEqual(run);
  expect(await db.batch([{ sql: 'DELETE FROM t' }])).toEqual([run]);
  expect(await db.query('SELECT * FROM t')).toEqual({
    columns: ['value', 'bytes', 'unknown', 'approx', 'label', 'unbounded'],
    rows: [[integer, blob, null, 1.25, 'hello', -Infinity]]
  });
  await db.close();

  expect(sqliteRequest.mock.calls.map(([raw]) => JSON.parse(raw) as Command)).toEqual([
    { op: 'open' },
    { op: 'run', handle: 17, statement: { sql: 'INSERT INTO t VALUES (?, ?)', params: [{ integer: integer.toString() }, { blob: [0, 255] }] } },
    { op: 'batch', handle: 17, statements: [{ sql: 'DELETE FROM t', params: [] }] },
    { op: 'query', handle: 17, statement: { sql: 'SELECT * FROM t', params: [] } },
    { op: 'close', handle: 17 }
  ]);
});

test('invalid values stay off the bridge and a failing close still closes the handle to callers', async () => {
  sqliteRequest.mockClear();
  const close = Promise.withResolvers<string>();
  sqliteRequest.mockResolvedValueOnce(ok(8)).mockImplementationOnce(() => close.promise);
  const db = await sqlite.open('notes');
  expect(JSON.parse(sqliteRequest.mock.calls[0]![0])).toEqual({ op: 'open', name: 'notes' });

  for (const invalid of [Infinity, NaN, Number.MAX_SAFE_INTEGER + 1]) await expect(db.run('SELECT ?', [invalid])).rejects.toThrow('Use bigint');

  const firstClose = db.close();
  expect(db.close()).toBe(firstClose);
  await expect(db.query('SELECT 1')).rejects.toThrow('connection is closed');
  close.resolve(JSON.stringify({ ok: false, error: 'close failed' }));
  await expect(firstClose).rejects.toThrow('close failed');
  expect(sqliteRequest).toHaveBeenCalledTimes(2);
});

test('SQLite reports the native rebuild requirement when the bridge is missing', async () => {
  native.sqliteRequest = undefined;
  try {
    await expect(sqlite.open()).rejects.toThrow('native app rebuild');
  } finally {
    native.sqliteRequest = sqliteRequest;
  }
});

test('scoped databases return first rows and close when a callback fails', async () => {
  sqliteRequest.mockClear();
  sqliteRequest
    .mockResolvedValueOnce(ok(23))
    .mockResolvedValueOnce(ok({ columns: ['x'], rows: [[9]] }))
    .mockResolvedValueOnce(ok(null));
  expect(await sqlite.withDatabase('drafts', (db) => db.get('SELECT 9'))).toEqual([9]);
  sqliteRequest.mockResolvedValueOnce(ok(24)).mockResolvedValueOnce(ok(null));
  await expect(
    sqlite.withDatabase(undefined, () => {
      throw new Error('callback failed');
    })
  ).rejects.toThrow('callback failed');
  expect(sqliteRequest.mock.calls.map(([raw]) => JSON.parse(raw).op)).toEqual(['open', 'query', 'close', 'open', 'close']);
});
