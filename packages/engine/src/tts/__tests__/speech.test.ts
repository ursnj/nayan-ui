import { expect, mock, test } from 'bun:test';

const native = { speechRequest: mock(async (_command: string) => JSON.stringify({ value: null })) };
mock.module('../../native/NativeNayanEngine', () => ({ default: native }));
const { speech } = await import('../speech');

test('speech queues system commands, preserves locale/voice options and does not retain previous options', async () => {
  expect(speech.supported).toBe(true);
  await speech.speak('Hello', { language: 'hi-IN', voice: 'installed', pitch: 1.4, rate: 0.8, volume: 0 });
  expect(JSON.parse(native.speechRequest.mock.calls.at(-1)![0])).toEqual({
    action: 'speak',
    text: 'Hello',
    language: 'hi-IN',
    voice: 'installed',
    pitch: 1.4,
    rate: 0.8,
    volume: 0
  });
  await speech.speak('Next');
  expect(JSON.parse(native.speechRequest.mock.calls.at(-1)![0])).toEqual({ action: 'speak', text: 'Next' });
  const count = native.speechRequest.mock.calls.length;
  await speech.speak('  ');
  for (const options of [{ rate: NaN }, { rate: 0 }, { pitch: Infinity }, { volume: -1 }, { volume: 2 }]) {
    await expect(speech.speak('Invalid', options)).rejects.toBeInstanceOf(RangeError);
  }
  expect(native.speechRequest.mock.calls.length).toBe(count);
});

test('JavaScript callers cannot replace the speech command and invalid voice/language types are rejected', async () => {
  await speech.speak('Actual text', { action: 'stop', text: 'Overridden text' } as never);
  expect(JSON.parse(native.speechRequest.mock.calls.at(-1)![0])).toEqual({ action: 'speak', text: 'Actual text' });
  for (const options of [{ language: 123 }, { voice: null }]) {
    await expect(speech.speak('Hello', options as never)).rejects.toBeInstanceOf(TypeError);
  }
});

test('control methods and discovery return platform results and propagate initialization errors', async () => {
  for (const [method, action] of [
    [speech.stop, 'stop'],
    [speech.pause, 'pause'],
    [speech.resume, 'resume']
  ] as const) {
    await method();
    expect(JSON.parse(native.speechRequest.mock.calls.at(-1)![0])).toEqual({ action });
  }
  native.speechRequest.mockImplementation(async () => JSON.stringify({ value: true }));
  expect(await speech.isSpeakingAsync()).toBe(true);
  const voices = [{ identifier: 'voice-id', name: 'Voice', language: 'en-US', quality: 'Default' as const }];
  native.speechRequest.mockImplementation(async () => JSON.stringify({ value: voices }));
  expect(await speech.getAvailableVoicesAsync()).toEqual(voices);
  native.speechRequest.mockImplementation(async () => JSON.stringify({ error: 'System speech failed' }));
  await expect(speech.speak('Hello')).rejects.toThrow('System speech failed');
  const previous = native.speechRequest;
  Object.assign(native, { speechRequest: undefined });
  expect(speech.supported).toBe(false);
  await expect(speech.speak('Hello')).rejects.toThrow('unavailable');
  native.speechRequest = previous;
});
