import { openConnection } from './platform';
import { decodeValue, encodeValue, sqliteResult } from './protocol';
import type { SQLiteDatabase, SQLiteQueryResult, SQLiteRunResult, SQLiteStatement, SQLiteValue } from './types';

export type { SQLiteDatabase, SQLiteQueryResult, SQLiteRunResult, SQLiteStatement, SQLiteValue } from './types';

function statement(sql: string, params: readonly SQLiteValue[]) {
  return { sql, params: params.map(encodeValue) };
}

/** Open an app-private named database, or pass no name for an in-memory database. */
async function open(name?: string): Promise<SQLiteDatabase> {
  const connection = await openConnection(name === ':memory:' ? undefined : name);
  let closing: Promise<void> | undefined;

  async function request<T>(op: string, args: object): Promise<T> {
    if (closing) throw new Error('SQLite connection is closed');
    return sqliteResult<T>(await connection.send(JSON.stringify({ op, handle: connection.handle, ...args })));
  }

  async function query(sql: string, params: readonly SQLiteValue[] = []): Promise<SQLiteQueryResult> {
    const result = await request<{ columns: string[]; rows: Parameters<typeof decodeValue>[0][][] }>('query', {
      statement: statement(sql, params)
    });
    return { columns: result.columns, rows: result.rows.map((row) => row.map(decodeValue)) };
  }

  return {
    async run(sql, params = []) {
      return request<SQLiteRunResult>('run', { statement: statement(sql, params) });
    },
    query,
    async get(sql, params) {
      return (await query(sql, params)).rows[0];
    },
    async batch(statements: readonly SQLiteStatement[]) {
      return request<SQLiteRunResult[]>('batch', { statements: statements.map(({ sql, params = [] }) => statement(sql, params)) });
    },
    close() {
      closing ??= request<null>('close', {})
        .then(() => {})
        .finally(connection.dispose);
      return closing;
    }
  };
}

export const sqlite = {
  open,
  /** Closes the connection after the callback settles. Use batch for a transaction. */
  async withDatabase<T>(name: string | undefined, run: (database: SQLiteDatabase) => T | Promise<T>): Promise<T> {
    const database = await open(name);
    let result: T;
    try {
      result = await run(database);
    } catch (error) {
      try {
        await database.close();
      } catch (closeError) {
        throw new AggregateError([error, closeError], 'SQLite callback and close failed');
      }
      throw error;
    }
    await database.close();
    return result;
  }
};
