import { prepareWasm } from './wasm.web';

/** Initialize the Rust runtime without opening a renderer, cache or audio device. */
export async function prepareCore(): Promise<void> {
  await prepareWasm();
}
