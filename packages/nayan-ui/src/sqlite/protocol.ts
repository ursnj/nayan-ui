import type { SQLiteValue } from './types';

export interface SQLiteConnection {
  handle: number;
  send(command: string): Promise<string>;
  dispose?(): void;
}

export type WorkerRequest = { id: number } & ({ op: 'open'; name?: string } | { op: 'request'; command: string });
export type WorkerReply = { id: number; response: string };

type WireValue = null | string | number | { integer: string } | { blob: number[] } | { real: 'Infinity' | '-Infinity' };

export function encodeValue(value: SQLiteValue): WireValue {
  if (value instanceof Uint8Array) return { blob: Array.from(value) };
  if (typeof value === 'bigint') return { integer: value.toString() };
  if (value === null || typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value) && (!Number.isInteger(value) || Number.isSafeInteger(value))) return value;
  throw new TypeError('Expected a SQLite value. Use bigint for integers outside the JavaScript safe range.');
}

export function decodeValue(value: WireValue): SQLiteValue {
  if (value === null || typeof value !== 'object') return value;
  if ('integer' in value) return BigInt(value.integer);
  if ('blob' in value) return Uint8Array.from(value.blob);
  return Number(value.real);
}

export function sqliteResult<T>(response: string): T {
  const result = JSON.parse(response) as { ok: true; value: T } | { ok: false; error: string };
  if (!result.ok) throw new Error(result.error);
  return result.value;
}
