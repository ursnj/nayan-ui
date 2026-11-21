function browserClipboard(method: 'writeText' | 'readText' | 'write' | 'read'): Clipboard {
  if (typeof navigator === 'undefined' || typeof navigator.clipboard?.[method] !== 'function')
    throw new Error('Clipboard access is unavailable. Use a supported browser over HTTPS or localhost');
  return navigator.clipboard;
}

export const clipboardPlatform = {
  isAvailable(): boolean {
    return typeof navigator !== 'undefined' && typeof navigator.clipboard?.writeText === 'function';
  },
  async hasString(): Promise<boolean> {
    return (await browserClipboard('readText').readText()).length > 0;
  },
  async clear(): Promise<void> {
    await browserClipboard('writeText').writeText('');
  },
  async setHTML(html: string, text: string): Promise<void> {
    const clipboard = browserClipboard('write');
    if (typeof ClipboardItem === 'undefined') throw new Error('HTML clipboard access is unavailable');
    await clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([text], { type: 'text/plain' })
      })
    ]);
  },
  async getHTML(): Promise<string> {
    const items = await browserClipboard('read').read();
    for (const item of items) if (item.types.includes('text/html')) return (await item.getType('text/html')).text();
    return '';
  },
  async setString(text: string): Promise<void> {
    // Invoke immediately so Safari retains the originating click's user activation.
    await browserClipboard('writeText').writeText(text);
  },
  async getString(): Promise<string> {
    return browserClipboard('readText').readText();
  }
};
