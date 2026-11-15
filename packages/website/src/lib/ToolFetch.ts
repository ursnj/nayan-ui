// Each tool API starts one request per second for everyone (src/app/api/helpers.ts): requests wait
// their turn on the server, and only when a tool's line is too long does it answer 429 with
// Retry-After. Tool requests from a page go through here: one at a time, and a 429 is retried
// after the time the server asks for, so a batch of files simply takes a little longer.

const MAX_RETRIES = 5;

let queue: Promise<unknown> = Promise.resolve();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function send(input: string, init?: RequestInit): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(input, init);
    if (res.status !== 429 || attempt >= MAX_RETRIES) return res;
    const retryAfter = Number(res.headers.get("Retry-After"));
    await sleep((Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 1) * 1000);
  }
}

/** `fetch` for the tool APIs: one request at a time, retrying when a tool is busy. */
export function toolFetch(input: string, init?: RequestInit): Promise<Response> {
  const result = queue.then(
    () => send(input, init),
    () => send(input, init),
  );
  queue = result.catch(() => undefined);
  return result;
}
