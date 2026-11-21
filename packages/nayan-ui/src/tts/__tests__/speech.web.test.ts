import { expect, mock, test } from 'bun:test';
import { readFile } from 'node:fs/promises';
import initialize from '../../../native/core/build/web/engine_core.js';
mock.module('../../native/wasm.web', () => ({
  prepareWasm: async () => {
    await initialize({ module_or_path: await readFile(new URL('../../../native/core/build/web/engine_core_bg.wasm', import.meta.url)) });
  }
}));
const { speechPlatform } = await import('../speechPlatform.web');

test('Rust WASM speech uses browser synthesis, validates options and preserves the system queue', async () => {
  const keys = ['window', 'Window', 'SpeechSynthesisUtterance', 'speechSynthesis'];
  const previous = keys.map((key) => Object.getOwnPropertyDescriptor(globalThis, key));
  const queued: Record<string, unknown>[] = [];
  let stopped = false;
  let paused = false;
  const voice = { voiceURI: 'local-voice', name: 'Local', lang: 'en-US' };
  let voices = [voice];
  const synth = {
    getVoices: () => voices,
    speak: (utterance: Record<string, unknown>) => queued.push(utterance),
    cancel: () => {
      stopped = true;
      queued.length = 0;
    },
    pause: () => {
      paused = true;
    },
    resume: () => {
      paused = false;
    },
    get speaking() {
      return queued.length > 0;
    },
    get paused() {
      return paused;
    }
  };
  try {
    Reflect.deleteProperty(globalThis, 'window');
    expect(speechPlatform.supported).toBe(false);
    class Utterance {
      constructor(public text: string) {}
    }
    Object.defineProperty(globalThis, 'window', { configurable: true, value: globalThis });
    Object.defineProperty(globalThis, 'speechSynthesis', { configurable: true, value: synth });
    class Window {
      static [Symbol.hasInstance](instance: unknown) {
        return instance === globalThis;
      }
    }
    Object.defineProperty(globalThis, 'Window', { configurable: true, value: Window });
    Object.defineProperty(globalThis, 'SpeechSynthesisUtterance', { configurable: true, value: Utterance });
    expect(speechPlatform.supported).toBe(true);
    const request = async (options: Record<string, unknown>) => {
      const result = JSON.parse(await speechPlatform.request(JSON.stringify(options)));
      if (result.error) throw new Error(result.error);
      return result.value;
    };
    await request({ action: 'speak', text: 'First', voice: 'local-voice', volume: 0, rate: 0.7 });
    await request({ action: 'speak', text: 'Second' });
    expect(queued[0]).toMatchObject({ text: 'First', voice, volume: 0, pitch: 1 });
    expect(queued[0]!.rate).toBeCloseTo(0.7);
    expect(queued[1]).toMatchObject({ text: 'Second', volume: 1, rate: 1, pitch: 1 });
    await request({ action: 'pause' });
    expect(paused).toBe(true);
    expect(await request({ action: 'isSpeaking' })).toBe(true);
    await request({ action: 'resume' });
    expect(paused).toBe(false);
    expect(await request({ action: 'voices' })).toEqual([{ identifier: 'local-voice', name: 'Local', language: 'en-US', quality: 'Default' }]);
    await expect(request({ action: 'speak', text: 'Bad voice', voice: 'missing' })).rejects.toThrow('Unknown speech voice');
    await expect(request({ action: 'speak', text: 'Invalid rate', rate: 0 })).rejects.toThrow('Speech rate');
    voices = [];
    setTimeout(() => {
      voices = [voice];
    }, 10);
    expect(await request({ action: 'voices' })).toHaveLength(1);
    await request({ action: 'pause' });
    expect(paused).toBe(true);
    await request({ action: 'stop' });
    expect(paused).toBe(false);
    // A paused global synthesizer can have no utterances at all.
    await request({ action: 'pause' });
    expect(await request({ action: 'isSpeaking' })).toBe(false);
    await request({ action: 'stop' });
    await request({ action: 'speak', text: 'After stopping a paused run' });
    expect(paused).toBe(false);
    expect(queued.at(-1)).toMatchObject({ text: 'After stopping a paused run' });
    await request({ action: 'stop' });
    expect(stopped).toBe(true);
    expect(await request({ action: 'isSpeaking' })).toBe(false);
  } finally {
    for (const [index, key] of keys.entries()) {
      if (previous[index]) Object.defineProperty(globalThis, key, previous[index]!);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});
