import { expect, mock, spyOn, test } from 'bun:test';
import type { EngineBridge } from '../../native/EngineBridge';

let nextSound = 1;
const native = {
  audioLoad: mock(() => nextSound++),
  audioPlay: mock<EngineBridge['audioPlay']>(() => 7),
  audioStop: mock<EngineBridge['audioStop']>(() => {}),
  audioControl: mock<NonNullable<EngineBridge['audioControl']>>(() => true),
  audioSetMuted: mock<EngineBridge['audioSetMuted']>(() => {}),
  audioSetVolume: mock<EngineBridge['audioSetVolume']>(() => {}),
  audioIsRunning: () => true,
  hapticsSupported: () => true,
  hapticsPlay: mock<EngineBridge['hapticsPlay']>(() => {})
};
mock.module('../../native/NativeNayanEngine', () => ({ default: native }));
mock.module('../../assets/source', () => ({
  assetUri: (source: string) => source,
  loadAssetBytes: async (source: string) => ({
    uri: source,
    bytes: new ArrayBuffer(8)
  })
}));
const { audio } = await import('../audio');
const { haptics } = await import('../../haptics/haptics');

test('named sound banks share decodes, remain silent while loading and preserve voice options', async () => {
  const first = audio.load({ coin: 'coin.wav', hit: 'hit.wav' });
  const duplicate = audio.load({ reward: 'coin.wav' });
  expect(first.get('coin')).toBeUndefined();
  expect(first.play('coin')).toBeNull();
  await Promise.all([first.ready, duplicate.ready]);
  expect(native.audioLoad).toHaveBeenCalledTimes(2);
  expect(first.get('coin')).toBe(duplicate.get('reward'));
  const sound = first.get('coin')!;
  const voice = first.play('coin');
  expect(voice).toBe(7 as never);
  expect(native.audioPlay.mock.calls.at(-1)).toEqual([sound, 1, 0, 1, false]);
  first.play('coin', { volume: 0.2, pan: -0.5, pitch: 1.5, loop: true });
  expect(native.audioPlay.mock.calls.at(-1)).toEqual([sound, 0.2, -0.5, 1.5, true]);
  audio.stop(voice);
  audio.stop(null);
  audio.stop(undefined);
  expect(native.audioStop).toHaveBeenCalledTimes(1);
  native.audioPlay.mockReturnValueOnce(0);
  expect(audio.play(sound)).toBeNull();
});

test('a failed optional sound logs its cause, resolves ready and can be retried', async () => {
  const warning = spyOn(console, 'warn').mockImplementation(() => {});
  try {
    native.audioLoad.mockReturnValueOnce(-1);
    const failed = audio.load({ broken: 'retry.wav' });
    await failed.ready;
    expect(failed.get('broken')).toBeUndefined();
    expect(failed.play('broken')).toBeNull();
    expect(warning.mock.calls[0]![0]).toMatch(/retry\.wav: .*WAV/i);
    const retry = audio.load({ fixed: 'retry.wav' });
    await retry.ready;
    expect(retry.get('fixed')).toBeDefined();
  } finally {
    warning.mockRestore();
  }
});

test('master preferences forward current values and report output state', () => {
  expect(audio.muted).toBe(false);
  expect(audio.volume).toBe(1);
  audio.muted = true;
  audio.volume = 0.4;
  expect(audio.muted).toBe(true);
  expect(audio.volume).toBe(0.4);
  expect(native.audioSetMuted.mock.calls.at(-1)).toEqual([true]);
  expect(native.audioSetVolume.mock.calls.at(-1)).toEqual([0.4]);
  expect(audio.enabled).toBe(false);
  audio.enabled = true;
  expect(audio.muted).toBe(false);
  expect(native.audioSetMuted.mock.calls.at(-1)).toEqual([false]);
  expect(audio.running).toBe(true);
});

test('audio decodes explicit byte ranges and forwards validated voice controls', async () => {
  const sound = await audio.decodeWav(Uint8Array.of(1, 2, 3).subarray(1));
  const voice = audio.play(sound)!;
  expect(audio.canControlVoices).toBe(true);
  expect(audio.pause(voice)).toBe(true);
  expect(native.audioControl).toHaveBeenLastCalledWith(voice, 0, 1, 0);
  expect(audio.seek(voice, 1.25)).toBe(true);
  expect(native.audioControl).toHaveBeenLastCalledWith(voice, 1, 1.25, 0);
  expect(audio.setVoiceMix(voice, 0.3, -0.75)).toBe(true);
  expect(native.audioControl).toHaveBeenLastCalledWith(voice, 2, 0.3, -0.75);
  expect(audio.resume(voice)).toBe(true);
  expect(native.audioControl).toHaveBeenLastCalledWith(voice, 0, 0, 0);
  expect(audio.stopAll()).toBe(true);
  expect(native.audioControl).toHaveBeenLastCalledWith(0, 3, 0, 0);
  expect(() => audio.setVoiceMix(voice, 1, 2)).toThrow(RangeError);
  native.audioControl.mockReturnValueOnce(false);
  expect(() => audio.pause(voice)).toThrow('engine build');
});

test('haptic selection, impacts, notifications and custom sequences honor disabling', () => {
  expect(haptics.supported).toBe(true);
  haptics.impact();
  expect(native.hapticsPlay.mock.calls.at(-1)).toEqual([[0, 0.6, 0.5], true]);
  haptics.impact(0.2, 0.1);
  expect(native.hapticsPlay.mock.calls.at(-1)).toEqual([[0, 0.2, 0.1], true]);
  haptics.selection();
  expect(native.hapticsPlay.mock.calls.at(-1)).toEqual([[0, 0.35, 0.9], true]);
  for (const result of ['success', 'warning', 'error'] as const) {
    haptics.notify(result);
    const [taps, throttled] = native.hapticsPlay.mock.calls.at(-1)!;
    expect((taps as number[]).length).toBe(result === 'error' ? 9 : 6);
    expect(throttled).toBe(false);
  }
  haptics.play([{ time: 0.25, intensity: 0.3, sharpness: 0.8 }]);
  expect(native.hapticsPlay.mock.calls.at(-1)).toEqual([[0.25, 0.3, 0.8], false]);
  const calls = native.hapticsPlay.mock.calls.length;
  haptics.enabled = false;
  haptics.play([]);
  haptics.selection();
  haptics.notify('success');
  expect(native.hapticsPlay).toHaveBeenCalledTimes(calls);
});
