import { stopMediaStream } from '../native/mediaStream.web';
import type { WasmCore } from '../native/BrowserEngine';
// The page's microphone for the core's recording (`microphone`): asks with getUserMedia, then a
// worklet node posts mono input blocks that are copied into WASM memory and pushed to the core.
// Echo cancellation keeps the game's own sounds (a character repeating you) out of the recording.
import type { EngineBridge } from '../native/EngineBridge';
import { audioWorkletUrl } from '../audio/worklet.web';

const BLOCK = 2048;
const MIC_FAILED = -1;

export function installMicrophoneInput(core: WasmCore, bridge: EngineBridge) {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return;
  let permission: 1 | 0 | -1 = 0;
  let stream: MediaStream | null = null;
  let context: AudioContext | null = null;
  let failed = false;
  /** Bumped by every start and stop, so a slow start that was stopped meanwhile closes itself. */
  let session = 0;
  const startCore = bridge.micStart;
  const stopCore = bridge.micStop;
  const stateCore = bridge.micState;
  const allocate = core.engine_web_alloc as (size: number) => number;
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

  const open = async (): Promise<MediaStream> => {
    stream ??= await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 }
    });
    permission = 1;
    return stream;
  };
  const close = () => {
    stopMediaStream(stream); // turns the browser's recording indicator off
    stream = null;
    void context?.close().catch(() => {});
    context = null;
  };

  bridge.micPermission = () => permission;
  bridge.micRequestPermission = async () => {
    try {
      await open();
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
    if (!startCore(maxSeconds)) return false;
    void (async () => {
      const input = await open();
      const audio = new AudioContext();
      context = audio;
      await audio.audioWorklet.addModule(audioWorkletUrl());
      if (current !== session) return audio.close();
      const node = new AudioWorkletNode(audio, 'nayan-microphone', { numberOfInputs: 1, numberOfOutputs: 1 });
      const muted = audio.createGain();
      muted.gain.value = 0; // keeps the node pulled without playing the input back
      audio.createMediaStreamSource(input).connect(node).connect(muted).connect(audio.destination);
      pointer ||= allocate(BLOCK * 4);
      node.port.onmessage = ({ data }: MessageEvent<Float32Array>) => {
        if (current !== session) return;
        new Float32Array(core.memory.buffer, pointer, data.length).set(data);
        push(pointer, data.length, audio.sampleRate);
      };
      await audio.resume();
    })().catch(() => {
      if (current !== session) return;
      failed = true;
      if (permission === 0) permission = -1;
      stopCore();
      close();
    });
    return true;
  };
  bridge.micStop = () => {
    session++;
    failed = false;
    stopCore();
    close();
  };
  bridge.micState = () => (failed ? MIC_FAILED : stateCore());
}
