import { auth_request } from '../../native/core/build/web/engine_core.js';
import { prepareWasm } from '../native/wasm.web';

export async function requestAuth(command: string): Promise<string> {
  await prepareWasm();
  return auth_request(command);
}
