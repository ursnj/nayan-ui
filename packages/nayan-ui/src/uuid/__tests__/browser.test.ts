import { afterEach, expect, mock, test } from 'bun:test';
import { prepareUuid, uuid } from '../uuid.web';

const cryptoDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'crypto')!;
afterEach(() => Object.defineProperty(globalThis, 'crypto', cryptoDescriptor));

test('browser UUID uses the platform implementation when available', async () => {
  const randomUUID = mock(() => '12345678-1234-4abc-8abc-1234567890ab');
  const getRandomValues = mock(() => new Uint8Array(16));
  Object.defineProperty(globalThis, 'crypto', { configurable: true, value: { randomUUID, getRandomValues } });
  await prepareUuid();
  expect(uuid()).toBe('12345678-1234-4abc-8abc-1234567890ab');
  expect(randomUUID).toHaveBeenCalledTimes(1);
  expect(getRandomValues).not.toHaveBeenCalled();
});

test('browser UUID sets version and variant bits in secure fallback bytes', () => {
  const getRandomValues = mock((bytes: Uint8Array) => bytes.fill(0xff));
  Object.defineProperty(globalThis, 'crypto', { configurable: true, value: { getRandomValues } });
  expect(uuid()).toBe('ffffffff-ffff-4fff-bfff-ffffffffffff');
  expect(getRandomValues).toHaveBeenCalledTimes(1);
  expect(getRandomValues.mock.calls[0]![0]).toHaveLength(16);
});

test('browser UUID rejects environments without secure randomness', async () => {
  Object.defineProperty(globalThis, 'crypto', { configurable: true, value: undefined });
  await expect(prepareUuid()).rejects.toThrow('secure random generation is unavailable');
  expect(uuid).toThrow('secure random generation is unavailable');
});
