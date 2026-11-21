import NativeEngine from '../native/NativeNayanEngine';

function request(action: string, text = ''): Promise<string> {
  if (typeof NativeEngine?.clipboardRequest !== 'function')
    return Promise.reject(new Error('Engine clipboard requires a native app rebuild with clipboard support'));
  return NativeEngine.clipboardRequest(action, text);
}

export const clipboardPlatform = {
  isAvailable(): boolean {
    return typeof NativeEngine?.clipboardRequest === 'function';
  },
  async hasString(): Promise<boolean> {
    return (await request('hasString')) === 'true';
  },
  async clear(): Promise<void> {
    await request('clear');
  },
  async setHTML(html: string, text: string): Promise<void> {
    await request('setHTML', JSON.stringify({ html, text }));
  },
  getHTML(): Promise<string> {
    return request('getHTML');
  },
  async setString(text: string): Promise<void> {
    await request('set', text);
  },
  getString(): Promise<string> {
    return request('get');
  }
};
