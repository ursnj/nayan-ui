import { clipboardPlatform } from './clipboardPlatform';

/** Text and HTML clipboard access. Call from a user action; platform access errors reject. */
export const clipboard = {
  /** API availability does not imply clipboard read permission. */
  isAvailable(): boolean {
    return clipboardPlatform.isAvailable();
  },
  /** Checks for nonempty text; reading may require permission or trigger an OS prompt. */
  async hasString(): Promise<boolean> {
    return clipboardPlatform.hasString();
  },
  /** Clears the native clipboard; browsers replace its content with empty text. */
  async clear(): Promise<void> {
    await clipboardPlatform.clear();
  },
  /** Supply a plain-text alternative for applications that cannot paste HTML. */
  async setHTML(html: string, text: string): Promise<void> {
    if (typeof html !== 'string' || typeof text !== 'string') throw new TypeError('Clipboard HTML and fallback text must be strings');
    await clipboardPlatform.setHTML(html, text);
  },
  /** Returns empty text when no HTML representation exists. Browsers may sanitize HTML. */
  async getHTML(): Promise<string> {
    return clipboardPlatform.getHTML();
  },
  async setString(text: string): Promise<void> {
    if (typeof text !== 'string') throw new TypeError('Clipboard text must be a string');
    await clipboardPlatform.setString(text);
  },
  async getString(): Promise<string> {
    return clipboardPlatform.getString();
  }
};
