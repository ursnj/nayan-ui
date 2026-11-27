import { afterAll, expect, mock, test } from 'bun:test';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { installDom } from '../../__tests__/dom';
import type { WasmCore } from '../../native/BrowserEngine';
import { installAudioOutput } from '../output.web';

test('SSR installs no audio context', () => {
  const window = Object.getOwnPropertyDescriptor(globalThis, 'window')!;
  Reflect.deleteProperty(globalThis, 'window');
  try {
    expect(installAudioOutput({ memory: new WebAssembly.Memory({ initial: 1 }) })()).toBe(false);
  } finally {
    Object.defineProperty(globalThis, 'window', window);
  }
});

const dom = installDom();
let failResume = true;
const contexts: Context[] = [];
class Context {
  state = 'suspended';
  destination = {};
  audioWorklet = { addModule: mock(async (_url: URL) => {}) };
  resume = mock(async () => {
    if (failResume) {
      failResume = false;
      throw new Error('autoplay blocked');
    }
    this.state = 'running';
  });
  suspend = mock(async () => {
    this.state = 'suspended';
  });
  close = mock(async () => {
    this.state = 'closed';
  });
  constructor(public options: AudioContextOptions) {
    contexts.push(this);
  }
}
const nodes: Node[] = [];
class Node {
  port = {
    onmessage: null as null | ((event: { data: ArrayBuffer | null }) => void),
    postMessage: mock((_samples: Float32Array<ArrayBuffer>, _transfers: ArrayBuffer[]) => {})
  };
  connect = mock((_destination: unknown) => {});
  disconnect = mock(() => {});
  constructor(
    public context: Context,
    public name: string,
    public options: AudioWorkletNodeOptions
  ) {
    nodes.push(this);
  }
}
const savedContext = Object.getOwnPropertyDescriptor(globalThis, 'AudioContext'),
  savedNode = Object.getOwnPropertyDescriptor(globalThis, 'AudioWorkletNode');
Object.defineProperty(globalThis, 'AudioContext', {
  configurable: true,
  value: Context
});
Object.defineProperty(globalThis, 'AudioWorkletNode', {
  configurable: true,
  value: Node
});
afterAll(() => {
  for (const [name, saved] of [
    ['AudioContext', savedContext],
    ['AudioWorkletNode', savedNode]
  ] as const)
    if (saved) Object.defineProperty(globalThis, name, saved);
    else Reflect.deleteProperty(globalThis, name);
  dom.cleanup();
});
async function tick() {
  for (let i = 0; i < 10; i++) await Promise.resolve();
}

test('audio starts on a gesture, releases failed starts, retries and streams owned stereo blocks', async () => {
  const memory = new WebAssembly.Memory({ initial: 1 });
  const allocate = mock((_bytes: number) => 64),
    free = mock((_pointer: number, _bytes: number) => {});
  let rendered = 0;
  const render = mock((pointer: number, length: number) => new Float32Array(memory.buffer, pointer, length).fill(++rendered));
  const running = installAudioOutput({
    memory,
    engine_web_alloc: allocate,
    engine_web_free: free,
    engine_web_audio_render: render
  } as WasmCore);
  expect(contexts).toHaveLength(0);
  expect(running()).toBe(false);
  window.dispatchEvent(new Event('pointerdown'));
  await tick();
  expect(contexts[0]!.options.sampleRate).toBe(48000);
  expect(contexts[0]!.close).toHaveBeenCalledTimes(1);
  expect(running()).toBe(false);
  expect(free).toHaveBeenCalledWith(64, 8192);
  expect(nodes[0]!.disconnect).toHaveBeenCalledTimes(1);
  expect(nodes[0]!.port.onmessage).toBeNull();
  window.dispatchEvent(new Event('keydown'));
  await tick();
  expect(running()).toBe(true);
  expect(contexts).toHaveLength(2);
  const node = nodes[1]!;
  expect(node.name).toBe('nayan-mixer');
  expect(node.options.outputChannelCount).toEqual([2]);
  expect(node.port.postMessage).toHaveBeenCalledTimes(3);
  const first = node.port.postMessage.mock.calls[0]![0];
  const snapshot = first.slice();
  memory.grow(1);
  node.port.onmessage!({ data: null });
  expect(first).toEqual(snapshot);
  expect(node.port.postMessage.mock.calls.at(-1)![0][0]).toBe(rendered);
  node.port.onmessage!({ data: first.buffer });
  expect(node.port.postMessage.mock.calls.at(-1)![0].buffer).toBe(first.buffer);
  expect(first[0]).toBe(rendered);
  window.dispatchEvent(new Event('pointerdown'));
  await tick();
  expect(contexts).toHaveLength(2);
  expect(contexts[1]!.resume).toHaveBeenCalledTimes(1);
  Object.defineProperty(document, 'hidden', {
    configurable: true,
    value: true
  });
  document.dispatchEvent(new Event('visibilitychange'));
  await tick();
  expect(running()).toBe(false);
  expect(contexts[0]!.suspend).not.toHaveBeenCalled();
  Object.defineProperty(document, 'hidden', {
    configurable: true,
    value: false
  });
  document.dispatchEvent(new Event('visibilitychange'));
  await tick();
  expect(running()).toBe(true);
  expect(free).toHaveBeenCalledTimes(1);
});

test('audio worklet preserves stereo order across blocks, signals demand and silences underruns', async () => {
  type Worklet = new () => {
    port: {
      onmessage: (event: { data: Float32Array }) => void;
      postMessage: ReturnType<typeof mock>;
    };
    process: (inputs: unknown[], outputs: Float32Array[][]) => boolean;
  };
  class Processor {
    port = { postMessage: mock(() => {}), onmessage: null };
  }
  const processors: Record<string, Worklet> = {};
  runInNewContext(await readFile(new URL('../audio-worklet.js', import.meta.url), 'utf8'), {
    AudioWorkletProcessor: Processor,
    registerProcessor(name: string, constructor: Worklet) {
      processors[name] = constructor;
    }
  });
  expect(Object.keys(processors).sort()).toEqual(['nayan-microphone', 'nayan-mixer']);
  const Mixer = processors['nayan-mixer']!;
  const mixer = new Mixer();
  const output = [new Float32Array(3), new Float32Array(3)];
  const first = new Float32Array([1, 2, 3, 4]);
  mixer.port.onmessage({ data: first });
  mixer.port.onmessage({ data: new Float32Array([5, 6, 7, 8]) });
  expect(mixer.process([], [output])).toBe(true);
  expect([...output[0]!]).toEqual([1, 3, 5]);
  expect([...output[1]!]).toEqual([2, 4, 6]);
  expect(mixer.port.postMessage).toHaveBeenCalledTimes(1);
  expect(mixer.port.postMessage).toHaveBeenCalledWith(first.buffer, [first.buffer]);
  mixer.process([], [output]);
  expect([...output[0]!]).toEqual([7, 0, 0]);
  expect([...output[1]!]).toEqual([8, 0, 0]);
  expect(mixer.port.postMessage).toHaveBeenCalledTimes(2);
  for (let i = 0; i < 10; i++) mixer.port.onmessage({ data: new Float32Array([i + 1, i + 1]) });
  const many = [new Float32Array(10), new Float32Array(10)];
  mixer.process([], [many]);
  expect([...many[0]!]).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 0, 0]);
});

test('the microphone worklet mixes input to mono and posts it in 2048-sample batches', async () => {
  type Microphone = new () => {
    port: { postMessage: ReturnType<typeof mock>; onmessage(event: { data: { segment: number; paused: boolean } }): void };
    process: (inputs: Float32Array[][]) => boolean;
  };
  const processors: Record<string, Microphone> = {};
  class Processor {
    port = { postMessage: mock(() => {}), onmessage: null };
  }
  runInNewContext(await readFile(new URL('../audio-worklet.js', import.meta.url), 'utf8'), {
    AudioWorkletProcessor: Processor,
    registerProcessor(name: string, constructor: Microphone) {
      processors[name] = constructor;
    }
  });
  const microphone = new processors['nayan-microphone']!();
  // No input yet (the stream hasn't connected): nothing posted, still running
  expect(microphone.process([[]])).toBe(true);
  const left = new Float32Array(128).fill(0.5);
  const right = new Float32Array(128).fill(-0.1);
  for (let block = 0; block < 15; block++) microphone.process([[left, right]]);
  expect(microphone.port.postMessage).not.toHaveBeenCalled();
  microphone.process([[left, right]]); // the 16th block fills 2048 samples
  expect(microphone.port.postMessage).toHaveBeenCalledTimes(1);
  const [batch] = microphone.port.postMessage.mock.calls[0] as unknown as [{ samples: Float32Array; segment: number }];
  expect(batch.segment).toBe(0);
  expect(batch.samples.length).toBe(2048);
  expect(batch.samples[0]).toBeCloseTo(0.2, 6);
  expect(batch.samples[2047]).toBeCloseTo(0.2, 6);

  microphone.process([[left, right]]);
  microphone.port.onmessage({ data: { segment: 1, paused: true } });
  for (let block = 0; block < 16; block++) microphone.process([[left, right]]);
  expect(microphone.port.postMessage).toHaveBeenCalledTimes(1);
  microphone.port.onmessage({ data: { segment: 2, paused: false } });
  for (let block = 0; block < 15; block++) microphone.process([[left, right]]);
  expect(microphone.port.postMessage).toHaveBeenCalledTimes(1);
  microphone.process([[left, right]]);
  const [resumed] = microphone.port.postMessage.mock.calls[1] as unknown as [{ segment: number }];
  expect(resumed.segment).toBe(2);
});
