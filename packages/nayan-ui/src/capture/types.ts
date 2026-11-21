export interface CapturedImage {
  /** Engine-owned PNG file URI (native) or object URL (web). Release when finished. */
  uri: string;
  /** Image dimensions in pixels. */
  width: number;
  height: number;
  /** Pixels per native window point; browser media frames use pixel coordinates (1). */
  scale: number;
}
