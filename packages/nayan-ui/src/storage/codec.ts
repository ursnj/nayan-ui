import type { StorageValue } from './types';

const encoder = new TextEncoder();
const decoder = new TextDecoder();
export function encode(value: StorageValue): ArrayBuffer {
  if (value instanceof ArrayBuffer) {
    const bytes = new Uint8Array(value.byteLength + 1);
    bytes[0] = 4;
    bytes.set(new Uint8Array(value), 1);
    return bytes.buffer;
  }
  if (typeof value === 'string') {
    const text = encoder.encode(value);
    const bytes = new Uint8Array(text.length + 1);
    bytes[0] = 1;
    bytes.set(text, 1);
    return bytes.buffer;
  }
  if (typeof value === 'number') {
    const bytes = new ArrayBuffer(9);
    new Uint8Array(bytes)[0] = 2;
    new DataView(bytes).setFloat64(1, value, true);
    return bytes;
  }
  if (typeof value === 'boolean') return new Uint8Array([3, Number(value)]).buffer;
  throw new Error('Engine storage: expected a string, number or boolean');
}
export function decode(bytes: ArrayBuffer): StorageValue | undefined {
  if (!bytes.byteLength) return undefined;
  const tag = new Uint8Array(bytes)[0];
  if (tag === 4) return bytes.slice(1);
  if (tag === 1) return decoder.decode(new Uint8Array(bytes, 1));
  if (tag === 2 && bytes.byteLength === 9) return new DataView(bytes).getFloat64(1, true);
  if (tag === 3 && bytes.byteLength === 2) return new Uint8Array(bytes)[1] !== 0;
  throw new Error('Engine storage: invalid value encoding');
}
