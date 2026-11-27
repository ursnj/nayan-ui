export interface SharingOptions {
  /** Webpage URL, shared as a link rather than downloaded as a file. */
  url?: string;
  /** Local file/content URI, native bundled resource name, or HTTP(S) file URL. */
  uri?: string;
  /** Preloaded browser File; avoids fetching after a Safari user gesture. */
  file?: File;
  text?: string;
  title?: string;
  mimeType?: string;
  fileName?: string;
  /** iOS popover anchor in the presenting view's points; defaults to its center. */
  anchor?: { x: number; y: number; width: number; height: number };
}
