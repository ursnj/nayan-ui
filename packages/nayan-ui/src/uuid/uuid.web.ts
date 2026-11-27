/** Check for secure random generation. Browser UUIDs need no engine warm-up. */
export async function prepareUuid(): Promise<void> {
  if (typeof globalThis.crypto?.getRandomValues !== 'function') throw new Error('Engine: secure random generation is unavailable');
}

/** A lowercase, hyphenated UUID v4 using the browser's secure random generator. */
export function uuid(): string {
  const crypto = globalThis.crypto;
  if (typeof crypto?.randomUUID === 'function') return crypto.randomUUID();
  if (typeof crypto?.getRandomValues !== 'function') throw new Error('Engine: secure random generation is unavailable');
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
