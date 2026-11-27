import type { WasmCore } from '../native/BrowserEngine';
import type { EngineBridge } from '../native/EngineBridge';
import { audioWorkletUrl } from './worklet.web';

/** The Rust mixer remains the source of all audio, including native collision feedback. */
export function installAudioOutput(core: WasmCore, bridge?: Pick<EngineBridge, 'audioPlay'>) {
  if (typeof window === 'undefined') return () => false;
  let context: AudioContext | undefined;
  let pending: Promise<void> | undefined;
  const start = () => {
    if (pending) {
      if (context && context.state !== 'running' && context.state !== 'closed') void context.resume().catch(() => {});
      return;
    }
    let release: (() => void) | undefined;
    pending = (async () => {
      context = new AudioContext({ sampleRate: 48000 });
      const resumed = context.resume().then(
        () => true,
        () => false
      );
      await context.audioWorklet.addModule(audioWorkletUrl());
      const output = new AudioWorkletNode(context, 'nayan-mixer', {
        numberOfInputs: 0,
        numberOfOutputs: 1,
        outputChannelCount: [2]
      });
      const allocate = core.engine_web_alloc as (size: number) => number;
      const free = core.engine_web_free as (pointer: number, size: number) => void;
      const render = core.engine_web_audio_render as (ptr: number, floats: number) => void;
      const floats = 2048;
      const pointer = allocate(floats * 4);
      const current = context;
      const visibility = () => {
        void (document.hidden ? current.suspend() : current.resume()).catch(() => {});
      };
      release = () => {
        document.removeEventListener('visibilitychange', visibility);
        output.port.onmessage = null;
        output.disconnect();
        free(pointer, floats * 4);
      };
      let pcm = new Float32Array(core.memory.buffer, pointer, floats);
      const send = (returned?: ArrayBuffer) => {
        render(pointer, floats);
        if (pcm.buffer !== core.memory.buffer) pcm = new Float32Array(core.memory.buffer, pointer, floats);
        const samples = returned?.byteLength === floats * 4 ? new Float32Array(returned) : new Float32Array(floats);
        samples.set(pcm);
        output.port.postMessage(samples, [samples.buffer]);
      };
      output.port.onmessage = ({ data }) => send(data instanceof ArrayBuffer ? data : undefined);
      send();
      send();
      send();
      output.connect(context.destination);
      document.addEventListener('visibilitychange', visibility);
      if (!(await resumed)) throw new Error('Browser audio could not start');
    })().catch(() => {
      release?.();
      void context?.close().catch(() => {});
      context = undefined;
      pending = undefined; // retry on the next gesture if audio is unavailable or blocked
    });
  };
  window.addEventListener('pointerdown', start, { capture: true });
  window.addEventListener('keydown', start, { capture: true });
  if (bridge) {
    const play = bridge.audioPlay;
    bridge.audioPlay = (...options) => {
      const voice = play(...options);
      if (voice > 0) start();
      return voice;
    };
  }
  return () => context?.state === 'running';
}
