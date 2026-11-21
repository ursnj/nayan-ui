import { useEffect, useState } from 'react';
import type { AssetSource } from '../../assets/types';

export interface NThemeFonts {
  regular: AssetSource;
  bold?: AssetSource;
}
export interface ThemeFontData {
  regular: string;
  bold?: string;
}
const loaded = new Map<string, Promise<ThemeFontData>>();
const base64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  let text = '';
  for (let i = 0; i < bytes.length; i += 8192) text += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(text);
};
export function useThemeFonts(fonts?: NThemeFonts, inherited?: ThemeFontData) {
  const [value, setValue] = useState<{ key: string; data: ThemeFontData }>();
  const regularSource = fonts?.regular;
  const boldSource = fonts?.bold;
  const key = regularSource !== undefined && JSON.stringify([regularSource, boldSource]);
  useEffect(() => {
    if (regularSource === undefined || !key) return;
    let alive = true;
    let promise = loaded.get(key);
    if (!promise) {
      promise = import('../../assets').then(async ({ assets }) => {
        const [regular, bold] = await Promise.all([assets.load(regularSource), boldSource === undefined ? undefined : assets.load(boldSource)]);
        if (regular.bytes.byteLength > 6 * 1024 * 1024 || (bold?.bytes.byteLength ?? 0) > 6 * 1024 * 1024) throw new Error('UI font exceeds 6 MiB');
        return { regular: base64(regular.bytes), bold: bold && base64(bold.bytes) };
      });
      loaded.set(key, promise);
      void promise.catch(() => loaded.delete(key));
    }
    void promise
      .then((data) => {
        if (alive) setValue({ key, data });
      })
      .catch((error) => console.error('NTheme fonts:', error));
    return () => {
      alive = false;
    };
  }, [key, regularSource, boldSource]);
  return !fonts ? inherited : value && value.key === key ? value.data : inherited;
}
