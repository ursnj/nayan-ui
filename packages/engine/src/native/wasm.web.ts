import initialize from '../../native/core/build/web/engine_core.js';

let pending: ReturnType<typeof initialize> | undefined;

/** Share the WASM instance without initializing rendering, storage or audio devices. */
export function prepareWasm(): ReturnType<typeof initialize> {
  return (pending ??= initialize().catch((error) => {
    pending = undefined;
    throw error;
  }));
}
