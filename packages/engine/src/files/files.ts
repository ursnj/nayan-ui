import { openFileDirectory, temporaryFiles } from './filesPlatform';
import { type FileDirectory, MAX_FILE_BYTES, type TemporaryFileOptions } from './types';
export const MAX_TEMP_FILE_BYTES = MAX_FILE_BYTES;

function fileName(name: string): string {
  if (
    typeof name !== 'string' ||
    !name ||
    name.length > 160 ||
    /[/\\\x00-\x1f\x7f]/.test(name) ||
    name === '.' ||
    name === '..' ||
    name.startsWith('.nayan-')
  )
    throw new TypeError('Expected a plain filename');
  return name;
}

/** App-private files and engine-owned temporary files. */
export const files = {
  /** Opens a persistent directory, independent of the temporary file cache. */
  async openDirectory(namespace = 'default'): Promise<FileDirectory> {
    if (typeof namespace !== 'string' || !/^[a-z0-9][a-z0-9_-]{0,79}$/.test(namespace))
      throw new TypeError('File namespace must use 1–80 lowercase letters, digits, underscores or hyphens');
    const directory = await openFileDirectory(namespace);
    return {
      async write(name, bytes) {
        if (!(bytes instanceof ArrayBuffer) && !ArrayBuffer.isView(bytes)) throw new TypeError('Expected an ArrayBuffer or a view');
        if (bytes.byteLength > MAX_FILE_BYTES) throw new RangeError('File exceeds 64 MiB');
        await directory.write(fileName(name), bytes);
      },
      async writeText(name, text) {
        if (typeof text !== 'string') throw new TypeError('Expected a text string');
        if (text.length > MAX_FILE_BYTES) throw new RangeError('File exceeds 64 MiB');
        await directory.writeText(fileName(name), text);
      },
      async read(name) {
        return directory.read(fileName(name));
      },
      async readText(name) {
        return directory.readText(fileName(name));
      },
      async stat(name) {
        return directory.stat(fileName(name));
      },
      async list() {
        return (await directory.list()).sort((a, b) => (a.name < b.name ? -1 : a.name === b.name ? 0 : 1));
      },
      async remove(name) {
        return directory.remove(fileName(name));
      }
    };
  },

  async writeTemporary(base64: string, options: TemporaryFileOptions = {}): Promise<string> {
    if (typeof base64 !== 'string' || base64.length % 4 !== 0) throw new TypeError('Temporary file data must be padded base64');
    const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
    if ((base64.length / 4) * 3 - padding > MAX_TEMP_FILE_BYTES) throw new RangeError('Temporary file exceeds 64 MiB');
    const fileName = options.fileName ?? 'temporary.bin';
    if (typeof fileName !== 'string' || !fileName || fileName.length > 160 || /[/\\\0]/.test(fileName) || fileName === '.' || fileName === '..')
      throw new TypeError('Temporary fileName must be a plain filename');
    if (options.mimeType !== undefined && typeof options.mimeType !== 'string') throw new TypeError('Temporary mimeType must be a string');
    return temporaryFiles.write(base64, fileName, options.mimeType ?? 'application/octet-stream');
  },
  /** Idempotent for missing files. Native paths are scoped to engine temp files; browsers revoke only owned URLs. */
  async removeTemporary(uri: string): Promise<void> {
    if (typeof uri !== 'string' || !uri || uri.includes('\0')) throw new TypeError('A temporary file URI is required');
    await temporaryFiles.remove(uri);
  }
};
