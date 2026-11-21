import type { ViewStyle } from '../../games/render/host';

/** Surface transport shared by Rust drawing and UI; no editable-art model is required by UI. */
export interface DocumentSurface<Change> {
  readonly id: number;
  readonly isDisposed: boolean;
  input(phase: 0 | 1 | 2 | 3, x: number, y: number, pressure?: number): unknown;
  cancel(): unknown;
  transform(dx: number, dy: number, scale?: number): unknown;
  /** Restore UI hover targeting before a batched wheel event, including after pointer release. */
  pointer?(x: number, y: number): void;
  invalidateView(): unknown;
  readChange(): Change | null;
  present(width: number, height: number, background: string, pixelRatio?: number): unknown;
  undo?(): unknown;
  redo?(): unknown;
}
export interface DocumentSurfaceProps<Change> {
  document: DocumentSurface<Change>;
  mode?: 'draw' | 'move' | 'view' | 'components';
  background?: string;
  active?: boolean;
  onChange?: (state: Change) => void;
  onError?: (error: Error) => void;
  style?: ViewStyle;
}
