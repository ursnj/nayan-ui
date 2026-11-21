import type { SharingOptions } from './types';

const MAX_FILE = 64 * 1024 * 1024;
function browser(): Navigator {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function')
    throw new Error('Sharing is unavailable. Use a supported browser over HTTPS or localhost');
  return navigator;
}
async function readFile(options: SharingOptions): Promise<File> {
  const uri = new URL(options.uri!, typeof location !== 'undefined' ? location.href : undefined);
  if (!['https:', 'http:', 'blob:'].includes(uri.protocol)) throw new Error('Browser sharing requires a File or an HTTP(S)/blob URL');
  const response = await fetch(uri);
  if (!response.ok) throw new Error(`Could not load the shared file (${response.status})`);
  if (Number(response.headers.get('content-length')) > MAX_FILE) {
    await response.body?.cancel();
    throw new Error('Shared file exceeds 64 MiB');
  }
  const reader = response.body?.getReader();
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  let length = 0;
  if (reader) {
    try {
      while (true) {
        const part = await reader.read();
        if (part.done) break;
        length += part.value.byteLength;
        if (length > MAX_FILE) {
          await reader.cancel();
          throw new Error('Shared file exceeds 64 MiB');
        }
        chunks.push(new Uint8Array(part.value));
      }
    } finally {
      reader.releaseLock();
    }
  } else {
    const blob = await response.blob();
    if (blob.size > MAX_FILE) throw new Error('Shared file exceeds 64 MiB');
    return new File([blob], options.fileName ?? uri.pathname.split('/').pop() ?? 'shared', { type: options.mimeType ?? blob.type });
  }
  return new File(chunks, options.fileName ?? decodeURIComponent(uri.pathname.split('/').pop() || 'shared'), {
    type: options.mimeType ?? response.headers.get('content-type') ?? 'application/octet-stream'
  });
}
export const sharingPlatform = {
  async isAvailable(): Promise<boolean> {
    return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  },
  async share(options: SharingOptions): Promise<void> {
    const nav = browser();
    const file = options.file ?? (options.uri ? await readFile(options) : undefined);
    if (file && (!(file instanceof File) || file.size > MAX_FILE)) throw new Error('Share a browser File up to 64 MiB');
    const payload: ShareData = {
      title: options.title,
      text: options.text,
      ...(options.url ? { url: options.url } : {}),
      ...(file ? { files: [file] } : {})
    };
    if (file && (!nav.canShare || !nav.canShare({ files: [file] }))) throw new Error('This browser cannot share this file');
    try {
      await nav.share(payload);
    } catch (error) {
      if (!error || typeof error !== 'object' || !('name' in error) || error.name !== 'AbortError') throw error;
    }
  }
};
