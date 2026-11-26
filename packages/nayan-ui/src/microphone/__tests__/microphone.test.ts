import { expect, mock, test } from 'bun:test';
import type { EngineBridge } from '../../native/EngineBridge';
import { installMicrophoneInput } from '../input.web';
import type { WasmCore } from '../../native/BrowserEngine';

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
  micPause: mock((paused: boolean) => {
    state = paused ? 3 : 2;
    return true;
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
  expect(microphone.pause()).toBe(true);
  expect(microphone.state).toBe('paused');
  expect(microphone.resume()).toBe(true);
  expect(microphone.state).toBe('listening');

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

  expect(microphone.finish()).toBeNull();
  expect(microphone.state).toBe('off');
});

test('browser permission probes and streams opened after stop are released', async () => {
  const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  const originalNode = Object.getOwnPropertyDescriptor(globalThis, 'AudioWorkletNode');
  const probeStopped = mock(() => {});
  const lateStopped = mock(() => {});
  const lateStream = Promise.withResolvers<unknown>();
  const getUserMedia = mock(() => lateStream.promise).mockResolvedValueOnce({ getTracks: () => [{ stop: probeStopped }] });
  Object.defineProperties(globalThis, {
    navigator: { configurable: true, value: { mediaDevices: { getUserMedia } } },
    AudioWorkletNode: { configurable: true, value: class {} }
  });
  try {
    const bridge = { micStart: () => true, micStop: () => {}, micState: () => 0 } as unknown as EngineBridge;
    installMicrophoneInput({} as WasmCore, bridge);
    expect(await bridge.micRequestPermission()).toBe(true);
    expect(probeStopped).toHaveBeenCalledTimes(1);
    expect(bridge.micStart(10)).toBe(true);
    expect(bridge.micState()).toBe(1);
    bridge.micStop();
    lateStream.resolve({ getTracks: () => [{ stop: lateStopped }] });
    await lateStream.promise;
    expect(lateStopped).toHaveBeenCalledTimes(1);
    expect(bridge.micState()).toBe(0);
  } finally {
    for (const [key, descriptor] of [['navigator', originalNavigator], ['AudioWorkletNode', originalNode]] as const) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});
