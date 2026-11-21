import initialize, { sqlite_open, sqlite_request } from '../../native/core/build/web/engine_core.js';
import type { WorkerReply, WorkerRequest } from './protocol';

const worker = globalThis as unknown as {
  onmessage: (event: MessageEvent<WorkerRequest>) => void;
  postMessage(reply: WorkerReply): void;
};

worker.onmessage = async ({ data }) => {
  let response: string;
  try {
    if (data.op === 'open') {
      await initialize();
      response = JSON.stringify({ ok: true, value: await sqlite_open(data.name) });
    } else {
      response = sqlite_request(data.command);
    }
  } catch (error) {
    response = JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) });
  }
  worker.postMessage({ id: data.id, response });
};
