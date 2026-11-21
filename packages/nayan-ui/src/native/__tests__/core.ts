import { readFile } from 'node:fs/promises';
import { createBrowserEngine, type WasmCore } from '../BrowserEngine';

/** Real Rust decoders/simulation without a GPU, network or mobile application. */
export async function createTestCore() {
  const { default: initialize } = await import('../../../native/core/build/web/engine_core.js');
  const core = await initialize({
    module_or_path: await readFile(new URL('../../../native/core/build/web/engine_core_bg.wasm', import.meta.url))
  });
  const engine = createBrowserEngine(core as unknown as WasmCore);
  engine.generateBuiltinMeshes();
  return engine;
}
