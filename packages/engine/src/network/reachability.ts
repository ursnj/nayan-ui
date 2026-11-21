import type { ReachabilityOptions } from './types';

function canceled() {
  return Object.assign(new Error('Reachability check canceled'), { code: 'ERR_CANCELED' });
}

/** Explicit opt-in endpoint check, independent of passive connection monitoring. */
export async function checkReachability(options: ReachabilityOptions): Promise<boolean> {
  let url: URL;
  try {
    url = new URL(options.url);
  } catch {
    throw new TypeError('Reachability requires an absolute HTTP(S) URL');
  }
  if (!['https:', 'http:'].includes(url.protocol)) throw new TypeError('Reachability requires an absolute HTTP(S) URL');
  if (
    options.expectedStatus !== undefined &&
    (!Number.isInteger(options.expectedStatus) || options.expectedStatus < 100 || options.expectedStatus > 599)
  )
    throw new RangeError('Reachability expectedStatus must be an HTTP status');
  const timeout = options.timeout ?? 5000;
  if (!Number.isInteger(timeout) || timeout < 0 || timeout > 0x7fffffff) throw new RangeError('Reachability timeout is out of range');
  const headers = new Headers(options.headers);
  const { signal } = options;
  if (signal?.aborted) throw canceled();
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  const timer = timeout ? setTimeout(abort, timeout) : undefined;
  try {
    const response = await fetch(url.href, {
      method: options.method ?? 'HEAD',
      signal: controller.signal,
      headers,
      cache: 'no-store',
      credentials: 'omit'
    });
    void response.body?.cancel().catch(() => {});
    return options.expectedStatus === undefined ? response.status >= 200 && response.status < 300 : response.status === options.expectedStatus;
  } catch {
    if (signal?.aborted) throw canceled();
    return false;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}
