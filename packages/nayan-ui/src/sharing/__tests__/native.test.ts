import { beforeEach, expect, mock, test } from 'bun:test';
const engine = { sharingRequest: mock(async (_request: string): Promise<void> => {}) };
mock.module('../../native/NativeNayanEngine', () => ({ default: engine }));
const { sharing } = await import('../sharing');
beforeEach(() => {
  engine.sharingRequest.mockReset().mockResolvedValue(undefined);
});

test('native requests carry files, actual message text and iPad anchor metadata', async () => {
  expect(await sharing.isAvailable()).toBe(true);
  const options = {
    uri: 'file:///cache/photo.png',
    text: 'Hello 🌏',
    title: 'Invite',
    mimeType: 'image/png',
    fileName: 'invite.png',
    anchor: { x: 10, y: 20, width: 30, height: 40 }
  };
  await sharing.share(options);
  expect(JSON.parse(engine.sharingRequest.mock.calls[0]![0])).toEqual(options);
});

test('native completion controls the promise; errors propagate', async () => {
  let finish!: () => void;
  engine.sharingRequest.mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      })
  );
  let settled = false;
  const pending = sharing.share({ text: 'Invite' }).then(() => {
    settled = true;
  });
  await Promise.resolve();
  expect(settled).toBe(false);
  finish();
  await pending;
  expect(settled).toBe(true);
  const busy = new Error('A share sheet is already open');
  engine.sharingRequest.mockRejectedValueOnce(busy);
  await expect(sharing.share({ text: 'Second invite' })).rejects.toBe(busy);
});

test('older builds report unavailable and require a rebuild on use', async () => {
  const request = engine.sharingRequest;
  Object.defineProperty(engine, 'sharingRequest', { configurable: true, value: undefined });
  try {
    expect(await sharing.isAvailable()).toBe(false);
    await expect(sharing.share({ text: 'Invite' })).rejects.toThrow('native app rebuild');
  } finally {
    Object.defineProperty(engine, 'sharingRequest', { configurable: true, value: request });
  }
});
