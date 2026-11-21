import { speech_request } from '../../native/core/build/web/engine_core.js';
import { prepareWasm } from '../native/wasm.web';

// The browser API is checked without initializing WASM, including during server rendering.
export const speechPlatform = {
  get supported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  },
  async request(command: string): Promise<string> {
    await prepareWasm();
    return speech_request(command);
  }
};
