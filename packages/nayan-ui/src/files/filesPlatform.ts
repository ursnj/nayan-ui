import NativeEngine from '../native/NativeNayanEngine';
import type { FileDirectory, FileInfo } from './types';

function request(action: string, value: string, fileName = ''): Promise<string> {
  if (typeof NativeEngine?.fileRequest !== 'function')
    return Promise.reject(new Error('Engine files require a native app rebuild with file support'));
  return NativeEngine.fileRequest(action, value, fileName);
}
export const temporaryFiles = {
  async write(base64: string, fileName: string, _mimeType: string): Promise<string> {
    const uri = await request('write', base64, fileName);
    if (!uri.startsWith('file:')) throw new Error('Native temporary file did not return a file URI');
    return uri;
  },
  async remove(uri: string): Promise<void> {
    await request('remove', uri);
  }
};

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function encodeBase64(input: ArrayBuffer | ArrayBufferView): string {
  const bytes = input instanceof ArrayBuffer ? new Uint8Array(input) : new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  const chunks: string[] = [];
  for (let start = 0; start < bytes.length; start += 12288) {
    let chunk = '';
    const end = Math.min(start + 12288, bytes.length);
    for (let i = start; i < end; i += 3) {
      const bits = (bytes[i]! << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
      chunk +=
        alphabet[bits >>> 18]! +
        alphabet[(bits >>> 12) & 63]! +
        (i + 1 < end ? alphabet[(bits >>> 6) & 63]! : '=') +
        (i + 2 < end ? alphabet[bits & 63]! : '=');
    }
    chunks.push(chunk);
  }
  return chunks.join('');
}

function decodeBase64(encoded: string): ArrayBuffer {
  const padding = encoded.endsWith('==') ? 2 : encoded.endsWith('=') ? 1 : 0;
  const bytes = new Uint8Array((encoded.length / 4) * 3 - padding);
  for (let i = 0, offset = 0; i < encoded.length; i += 4) {
    const bits =
      (alphabet.indexOf(encoded[i]!) << 18) |
      (alphabet.indexOf(encoded[i + 1]!) << 12) |
      (Math.max(0, alphabet.indexOf(encoded[i + 2]!)) << 6) |
      Math.max(0, alphabet.indexOf(encoded[i + 3]!));
    bytes[offset++] = bits >>> 16;
    if (offset < bytes.length) bytes[offset++] = bits >>> 8;
    if (offset < bytes.length) bytes[offset++] = bits;
  }
  return bytes.buffer;
}

export async function openFileDirectory(namespace: string): Promise<FileDirectory> {
  await request('storeOpen', '', namespace);
  const fileRequest = (action: string, name: string, value = '') => request(action, value, `${namespace}/${name}`);
  return {
    async write(name, bytes) {
      await fileRequest('storeWrite', name, encodeBase64(bytes));
    },
    async writeText(name, text) {
      await fileRequest('storeWriteText', name, text);
    },
    async read(name) {
      const result = await fileRequest('storeRead', name);
      return result ? decodeBase64(result.slice(1)) : undefined;
    },
    async readText(name) {
      const result = await fileRequest('storeReadText', name);
      return result ? result.slice(1) : undefined;
    },
    async stat(name) {
      return (JSON.parse(await fileRequest('storeStat', name)) as FileInfo | null) ?? undefined;
    },
    async list() {
      return JSON.parse(await request('storeList', '', namespace)) as FileInfo[];
    },
    async remove(name) {
      return (await fileRequest('storeRemove', name)) === 'true';
    }
  };
}
