import { stopMediaStream } from '../native/mediaStream.web';
import type { WasmCore } from '../native/BrowserEngine';
// The page's microphone for the core's recording (`microphone`): asks with getUserMedia, then a
// worklet node posts mono input blocks that are copied into WASM memory and pushed to the core.
// Echo cancellation keeps the game's own sounds (a character repeating you) out of the recording.
import type { EngineBridge } from '../native/EngineBridge';
import { audioWorkletUrl } from '../audio/worklet.web';

const BLOCK = 2048;
const MIC_FAILED = -1;
const MIC_STARTING = 1;

export function installMicrophoneInput(core: WasmCore, bridge: EngineBridge) {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia || typeof AudioWorkletNode === 'undefined') {
    bridge.micPermission = () => -2;
    bridge.micStart = () => false;
    return;
  }
  let permission: 1 | 0 | -1 = 0;
  let stream: MediaStream | null = null;
  let context: AudioContext | null = null;
  let node: AudioWorkletNode | null = null;
  let failed = false;
  let starting = false;
  let segment = 0;
  /** Bumped by every start and stop, so a slow start that was stopped meanwhile closes itself. */
  let session = 0;
  const startCore = bridge.micStart;
  const stopCore = bridge.micStop;
  const stateCore = bridge.micState;
  const pauseCore = bridge.micPause;
  const allocate = core.engine_web_alloc as (size: number) => number;
  const free = core.engine_web_free as (pointer: number, size: number) => void;
  const push = core.engine_audio_mic_push as (pointer: number, count: number, rate: number) => void;
  let pointer = 0;

  // A page that was allowed before doesn't prompt again: report it as granted up front.
  void navigator.permissions
    ?.query({ name: 'microphone' as PermissionName })
    .then((status) => {
      const read = () => {
        permission = status.state === 'granted' ? 1 : status.state === 'denied' ? -1 : 0;
      };
      read();
      status.onchange = read;
    })
    .catch(() => {});

  const open = () =>
    navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 }
    });
  const close = () => {
    if (node) {
      node.port.onmessage = null;
      node.disconnect();
      node = null;
    }
    if (pointer) {
      free(pointer, BLOCK * 4);
      pointer = 0;
    }
    stopMediaStream(stream); // turns the browser's recording indicator off
    stream = null;
    void context?.close().catch(() => {});
    context = null;
  };

  bridge.micPermission = () => permission;
  bridge.micRequestPermission = async () => {
    if (stream?.active) return true;
    try {
      stopMediaStream(await open());
      permission = 1;
      return true;
    } catch {
      permission = -1;
      return false;
    }
  };
  bridge.micStart = (maxSeconds) => {
    session++;
    const current = session;
    close();
    failed = false;
    starting = false;
    if (!startCore(maxSeconds)) return false;
    starting = true;
    segment = 0;
    void (async () => {
      const input = await open();
      if (current !== session) {
        stopMediaStream(input);
        return;
      }
      stream = input;
      permission = 1;
      const audio = new AudioContext();
      context = audio;
      await audio.audioWorklet.addModule(audioWorkletUrl());
      if (current !== session) return;
      node = new AudioWorkletNode(audio, 'nayan-microphone', { numberOfInputs: 1, numberOfOutputs: 1 });
      const muted = audio.createGain();
      muted.gain.value = 0; // keeps the node pulled without playing the input back
      audio.createMediaStreamSource(input).connect(node).connect(muted).connect(audio.destination);
      pointer ||= allocate(BLOCK * 4);
      node.port.onmessage = ({ data }: MessageEvent<{ samples: Float32Array; segment: number }>) => {
        if (current !== session || data.segment !== segment || !pointer) return;
        new Float32Array(core.memory.buffer, pointer, data.samples.length).set(data.samples);
        push(pointer, data.samples.length, audio.sampleRate);
      };
      await audio.resume();
      if (current === session) starting = false;
    })().catch(() => {
      if (current !== session) return;
      starting = false;
      failed = true;
      if (permission === 0) permission = -1;
      stopCore();
      close();
    });
    return true;
  };
  bridge.micPause = (paused) => {
    if (!node || starting || !pauseCore?.(paused)) return false;
    node.port.postMessage({ paused, segment: ++segment });
    return true;
  };
  bridge.micStop = () => {
    session++;
    failed = false;
    starting = false;
    stopCore();
    close();
  };
  bridge.micState = () => (failed ? MIC_FAILED : starting ? MIC_STARTING : stateCore());
}
