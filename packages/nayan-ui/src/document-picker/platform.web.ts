import type { DocumentPickerAsset, DocumentPickerOptions, DocumentPickerResult } from './types';

const owned = new Set<string>();
let busy = false;

const available = () => typeof document !== 'undefined' && !!document.body;

export async function isAvailable(): Promise<boolean> {
  return available();
}

function mimeTypes(type: DocumentPickerOptions['type']): string[] {
  const types = typeof type === 'string' ? [type] : type === undefined ? ['*/*'] : type;
  if (
    !Array.isArray(types) ||
    !types.length ||
    Array.from(types).some((mime) => typeof mime !== 'string' || !/^(?:\*\/\*|[\w!#$&^.+-]+\/(?:\*|[\w!#$&^.+-]+))$/i.test(mime))
  ) {
    throw new TypeError('Document type must be a MIME type or a nonempty array of MIME types');
  }
  return [...new Set(types.map((mime) => mime.toLowerCase()))];
}

function select(accept: string, multiple: boolean): Promise<FileList | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.multiple = multiple;
    input.hidden = true;
    function finish(files: FileList | null) {
      input.onchange = input.oncancel = null;
      input.remove();
      resolve(files?.length ? files : null);
    }
    input.onchange = () => finish(input.files);
    input.oncancel = () => finish(null);
    document.body.append(input);
    try {
      input.click();
    } catch (error) {
      input.remove();
      reject(error);
    }
  });
}

function dataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Could not read the selected document'));
    reader.onabort = () => reject(new Error('Reading the selected document was canceled'));
    reader.readAsDataURL(file);
  });
}

export async function getDocumentAsync(options: DocumentPickerOptions = {}): Promise<DocumentPickerResult> {
  if (!available()) return { canceled: true, assets: null };
  if (busy) throw new Error('A document picker is already open');
  if (!options || typeof options !== 'object' || Array.isArray(options)) throw new TypeError('Document picker options must be an object');
  const types = mimeTypes(options.type);
  for (const key of ['multiple', 'copyToCacheDirectory', 'base64'] as const) {
    if (options[key] !== undefined && typeof options[key] !== 'boolean') throw new TypeError(`Document picker ${key} must be a boolean`);
  }
  busy = true;
  const assets: DocumentPickerAsset[] = [];
  try {
    // Open synchronously with the caller's browser user activation.
    const output = await select(types.includes('*/*') ? '' : types.join(','), options.multiple ?? false);
    if (!output) return { canceled: true, assets: null, output: null };
    if (!options.multiple && output.length > 1) throw new Error('The document picker returned multiple files');
    for (const file of Array.from(output)) {
      const base64 = options.base64 ? await dataUrl(file) : undefined;
      const uri = URL.createObjectURL(file);
      owned.add(uri);
      assets.push({ uri, name: file.name, mimeType: file.type || undefined, size: file.size, lastModified: file.lastModified, file, base64 });
    }
    return { canceled: false, assets, output };
  } catch (error) {
    for (const { uri } of assets) await release(uri);
    throw error;
  } finally {
    busy = false;
  }
}

export async function release(uri: string): Promise<void> {
  if (typeof uri !== 'string' || !uri.startsWith('blob:')) throw new TypeError('A document blob URI is required');
  if (owned.delete(uri)) URL.revokeObjectURL(uri);
}
