import { sharingPlatform } from './sharingPlatform';
import type { SharingOptions } from './types';

/** Outbound sharing only. Resolution means the share flow finished, including dismissal. */
export const sharing = {
  isAvailable(): Promise<boolean> {
    return sharingPlatform.isAvailable();
  },
  async share(options: SharingOptions): Promise<void> {
    if (!options || typeof options !== 'object') throw new TypeError('Sharing options are required');
    for (const key of ['uri', 'url', 'text', 'title', 'mimeType', 'fileName'] as const)
      if (options[key] !== undefined && typeof options[key] !== 'string') throw new TypeError(`Sharing ${key} must be a string`);
    if (!options.uri?.trim() && !options.url?.trim() && !options.text?.trim() && !options.file) throw new TypeError('Share a file or nonempty text');
    if (options.url !== undefined) {
      let url: URL;
      try {
        url = new URL(options.url);
      } catch {
        throw new TypeError('Sharing url must be an absolute HTTP(S) URL');
      }
      if (!['http:', 'https:'].includes(url.protocol)) throw new TypeError('Sharing url must be an absolute HTTP(S) URL');
    }
    if (options.uri && options.file) throw new TypeError('Provide either uri or file');
    if (options.uri !== undefined && (!options.uri.trim() || options.uri.includes('\0') || options.uri.length > 8192))
      throw new TypeError('Invalid sharing URI');
    if (
      options.fileName !== undefined &&
      (!options.fileName || options.fileName.length > 160 || /[/\\\0]/.test(options.fileName) || /^\.{1,2}$/.test(options.fileName))
    )
      throw new TypeError('Sharing fileName must be a plain filename');
    if (
      options.anchor &&
      (![options.anchor.x, options.anchor.y, options.anchor.width, options.anchor.height].every(Number.isFinite) ||
        options.anchor.width <= 0 ||
        options.anchor.height <= 0)
    )
      throw new TypeError('Sharing anchor must have finite coordinates and positive dimensions');
    // Call immediately: browser File sharing must retain the originating gesture.
    await sharingPlatform.share(options);
  }
};
