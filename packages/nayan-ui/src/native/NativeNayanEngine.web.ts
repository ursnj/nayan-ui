import {
  attach_canvas,
  can_warm_asset_record,
  install_asset_storage,
  read_saved_asset,
  restore_asset_record
} from '../../native/core/build/web/engine_core.js';
import { installAudioOutput } from '../audio/output.web';
import { IndexedDbCache } from '../assets/IndexedDbCache.web';
import { installMicrophoneInput } from '../microphone/input.web';
import { createBrowserEngine, type WasmCore } from './BrowserEngine';
import type { EngineBridge } from './EngineBridge';
import { prepareWasm } from './wasm.web';
let storage: IndexedDbCache | undefined;
let core: WasmCore;
let pending: Promise<void> | undefined;
let attaching = Promise.resolve();

export function prepareEngine(): Promise<void> {
  return (pending ??= (async () => {
    core = (await prepareWasm()) as unknown as WasmCore;
    try {
      storage = await IndexedDbCache.open();
      install_asset_storage(storage);
      await storage.warm(can_warm_asset_record, restore_asset_record);
    } catch {
      /* IndexedDB denial is a cache miss, not a failed engine initialization. */
    }
    const ready = createBrowserEngine(core);
    ready.audioIsRunning = typeof core.engine_web_audio_render === 'function' ? installAudioOutput(core, ready) : () => false;
    if (ready.micPermission() !== -2) installMicrophoneInput(core, ready);
    Object.assign(browser, ready);
  })().catch((error) => {
    pending = undefined;
    throw error;
  }));
}

export async function readSavedAsset(key: string): Promise<ArrayBuffer | null> {
  await prepareEngine();
  const bytes = await read_saved_asset(key);
  return bytes.length ? (bytes.buffer as ArrayBuffer) : null;
}
export function flushAssetStorage(): Promise<void> {
  return storage ? storage.flush() : Promise.reject(new Error('IndexedDB unavailable'));
}
export function clearedAssetStorage(): Promise<void> {
  return storage ? storage.cleared() : Promise.reject(new Error('IndexedDB unavailable'));
}

export function attachCanvas(id: number, canvas: HTMLCanvasElement): Promise<void> {
  const attach = attaching
    .catch(() => {})
    .then(async () => {
      await prepareEngine();
      await attach_canvas(id, canvas);
    });
  attaching = attach;
  return attach;
}
export function detachCanvas(id: number) {
  const detach = core?.engine_render_detach as ((id: number) => void) | undefined;
  detach?.(id);
}

// SSR-safe: importing binds nothing. Until warm-up every method throws; prepareEngine() then copies
// the real methods onto this same object, so calls go straight to them (no per-access trap).
const browser = /* @__PURE__ */ createUnpreparedEngine();
function createUnpreparedEngine(): EngineBridge {
  const bridge = {} as EngineBridge;
  const unready = () => {
    throw new Error('Engine: await warmUpEngine() before creating worlds or procedural meshes on the web');
  };
  // createBrowserEngine touches nothing at creation: its keys list every bridge method.
  for (const key of Object.keys(createBrowserEngine({} as WasmCore))) (bridge as unknown as Record<string, unknown>)[key] = unready;
  bridge.audioControl = () => false;
  bridge.audioVoiceStatus = () => new ArrayBuffer(0);
  bridge.audioIsRunning = () => false;
  bridge.micPermission = () => -2;
  bridge.micPause = () => false;
  return bridge;
}
export default browser;
