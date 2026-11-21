import { expect, mock, test } from 'bun:test';
import type { EngineBridge } from '../../native/EngineBridge';

let state = 0;
const native = {
  micPermission: mock(() => 0),
  micRequestPermission: mock(() => Promise.resolve(true)),
  micStart: mock<EngineBridge['micStart']>(() => {
    state = 2;
    return true;
  }),
  micStop: mock(() => {
    state = 0;
  }),
  micState: () => state,
  micLevel: () => 0.62,
  micHeld: () => 1.4,
  micTake: mock<EngineBridge['micTake']>(() => 12),
  audioDuration: mock(() => 0.8),
  audioLevels: mock<EngineBridge['audioLevels']>(() => new Float32Array([0.1, 0.4, 0.2]).buffer),
  audioRelease: mock<EngineBridge['audioRelease']>(() => {})
};
mock.module('../../native/NativeNayanEngine', () => ({ default: native }));
mock.module('../../assets/source', () => ({
  assetUri: (source: string) => source,
  loadAssetBytes: async () => ({ uri: '', bytes: new ArrayBuffer(8) })
}));
const { microphone } = await import('../microphone');
const { audio } = await import('../../audio/audio');

test('the microphone asks once, listens, and turns a take into a releasable sound with its loudness', async () => {
  expect(microphone.supported).toBe(true);
  expect(microphone.permission).toBe('undetermined');
  native.micPermission.mockImplementation(() => -1);
  expect(microphone.permission).toBe('denied');
  expect(await microphone.requestPermission()).toBe(true);

  expect(microphone.state).toBe('off');
  expect(microphone.start()).toBe(true);
  expect(native.micStart.mock.calls.at(-1)).toEqual([10]);
  expect(microphone.state).toBe('listening');
  expect(microphone.level).toBe(0.62);
  expect(microphone.held).toBe(1.4);

  const take = microphone.take(1.2, { skipEnd: 0.6, levelsPerSecond: 20 })!;
  expect(native.micTake.mock.calls.at(-1)).toEqual([1.2, 0.6]);
  expect(native.audioLevels.mock.calls.at(-1)).toEqual([12, 20]);
  expect(take.sound).toBe(12 as never);
  expect(take.duration).toBe(0.8);
  expect([...take.levels].map((l) => +l.toFixed(2))).toEqual([0.1, 0.4, 0.2]);
  expect(take.levelsPerSecond).toBe(20);
  // Everything heard, by default
  microphone.take();
  expect(native.micTake.mock.calls.at(-1)).toEqual([3600, 0]);
  // Nothing heard: no recording
  native.micTake.mockImplementation(() => -1);
  expect(microphone.take()).toBeNull();

  audio.release(take.sound);
  expect(native.audioRelease.mock.calls.at(-1)).toEqual([12]);
  expect(audio.duration(take.sound)).toBe(0.8);
  expect(audio.levels(take.sound, 20).length).toBe(3);

  microphone.stop();
  expect(microphone.state).toBe('off');
});
