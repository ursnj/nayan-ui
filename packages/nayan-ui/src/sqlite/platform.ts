import NativeEngine from '../native/NativeNayanEngine';
import { type SQLiteConnection, sqliteResult } from './protocol';

export async function openConnection(name?: string): Promise<SQLiteConnection> {
  if (typeof NativeEngine?.sqliteRequest !== 'function') throw new Error('SQLite requires a native app rebuild with NayanEngine linked');
  const engine = NativeEngine;
  const send = (command: string) => engine.sqliteRequest!(command);
  const handle = sqliteResult<number>(await send(JSON.stringify({ op: 'open', name })));
  return { handle, send };
}
