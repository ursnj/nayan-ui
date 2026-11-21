import { afterAll, expect, test } from 'bun:test';
import { checkReachability } from '../reachability';
const methods: string[] = [];
const server = Bun.serve({
  port: 0,
  async fetch(request) {
    const path = new URL(request.url).pathname;
    methods.push(request.method);
    if (path === '/slow') await Bun.sleep(100);
    return new Response(null, { status: path === '/down' ? 503 : 204 });
  }
});
afterAll(() => server.stop(true));

test('reachability checks an explicit endpoint independently of connection state', async () => {
  expect(await checkReachability({ url: `${server.url}health`, expectedStatus: 204 })).toBe(true);
  expect(await checkReachability({ url: `${server.url}health`, expectedStatus: 200, method: 'GET' })).toBe(false);
  expect(await checkReachability({ url: `${server.url}down` })).toBe(false);
  expect(methods).toEqual(['HEAD', 'GET', 'HEAD']);
});

test('invalid endpoints and caller cancellation do not become a false offline status', async () => {
  await expect(checkReachability({ url: 'file:///tmp/health' })).rejects.toThrow('HTTP(S)');
  await expect(checkReachability({ url: `${server.url}`, expectedStatus: 0 })).rejects.toThrow('HTTP status');
  const controller = new AbortController();
  controller.abort();
  await expect(checkReachability({ url: `${server.url}health`, signal: controller.signal })).rejects.toMatchObject({ code: 'ERR_CANCELED' });
});

test('transport failure returns false and does not start a passive observer', async () => {
  const offline = Bun.serve({ port: 0, fetch: () => new Response(null) });
  const url = offline.url.href;
  offline.stop(true);
  expect(await checkReachability({ url, timeout: 250 })).toBe(false);
});

test('internal timeouts return false while cancellation during a request rejects', async () => {
  const url = `${server.url}slow`;
  expect(await checkReachability({ url, timeout: 5 })).toBe(false);
  const controller = new AbortController();
  const pending = checkReachability({ url, signal: controller.signal });
  controller.abort();
  await expect(pending).rejects.toMatchObject({ code: 'ERR_CANCELED' });
});
