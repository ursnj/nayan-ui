export type SQLiteValue = null | string | number | bigint | Uint8Array;

export interface SQLiteStatement {
  sql: string;
  params?: readonly SQLiteValue[];
}

export interface SQLiteRunResult {
  /** Rows directly affected by the statement. */
  changes: number;
}

export interface SQLiteQueryResult {
  columns: string[];
  /** Cells in column order, preserving duplicate column names. */
  rows: SQLiteValue[][];
}

export interface SQLiteDatabase {
  /** Execute one statement that returns no rows. Bind positional values with placeholders. */
  run(sql: string, params?: readonly SQLiteValue[]): Promise<SQLiteRunResult>;
  /** Read rows from a single read-only statement. */
  query(sql: string, params?: readonly SQLiteValue[]): Promise<SQLiteQueryResult>;
  /** Read the first row in column order. Use LIMIT 1 when the query may match many rows. */
  get(sql: string, params?: readonly SQLiteValue[]): Promise<SQLiteValue[] | undefined>;
  /** Execute statements in a single transaction. An error rolls back the entire batch. */
  batch(statements: readonly SQLiteStatement[]): Promise<SQLiteRunResult[]>;
  close(): Promise<void>;
}
