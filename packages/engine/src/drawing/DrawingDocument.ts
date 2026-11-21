import type { Texture } from '../games/assets/texture';
import NativeEngine from '../native/NativeNayanEngine';

export type DrawingBrush = 'NORMAL' | 'MARKER' | 'PENCIL' | 'CALLIGRAPHY' | 'WATERCOLOR' | 'NEON' | 'CRAYON' | 'SPRINKLING';
export type DrawingShape =
  | 'line'
  | 'arrow'
  | 'rectangle'
  | 'square'
  | 'rounded-rectangle'
  | 'circle'
  | 'ellipse'
  | 'triangle'
  | 'right-triangle'
  | 'diamond'
  | 'pentagon'
  | 'hexagon'
  | 'octagon'
  | 'star'
  | 'heart'
  | 'trapezoid'
  | 'parallelogram'
  | 'cross'
  | 'speech-bubble'
  | 'cloud';
export interface DrawingShapePreview {
  kind: DrawingShape;
  name: string;
  path: string;
  filledPath: string;
  canFill: boolean;
}
export type DrawingTool = 'brush' | 'fill' | 'picker' | DrawingShape;
export type DrawingSymmetry = 'none' | 'vertical' | 'horizontal' | 'both';
export interface DrawingLayer {
  id: number;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
}
export interface DrawingProject {
  version: 2;
  width: number;
  height: number;
  activeLayer: number;
  layers: DrawingLayer[];
  paths: SavedDrawingPath[];
}
export interface DrawingBrushOptions {
  brushType: DrawingBrush;
  color: string;
  width: number;
  opacity: number;
  isEraser?: boolean;
  pressure?: boolean;
  smoothing?: number;
  tool?: DrawingTool;
  symmetry?: DrawingSymmetry;
  filled?: boolean;
  tolerance?: number;
}
export interface DrawingState {
  controls: DrawingControls;
  count: number;
  canUndo: boolean;
  canRedo: boolean;
  revision: number;
  width: number;
  height: number;
  pixelWidth: number;
  pixelHeight: number;
  zoom: number;
  layers: DrawingLayer[];
  activeLayer: number;
  editable: boolean;
  isDrawing: boolean;
  tool: DrawingTool | null;
  pickedColor: string | null;
  error: string | null;
}
/** Native document settings; React may display this snapshot but never owns the tool state. */
export interface DrawingControls {
  tool: 'brush' | 'eraser' | 'move' | 'shape';
  brushType: DrawingBrush;
  color: string;
  width: number;
  opacity: number;
  shape: DrawingShape;
  filled: boolean;
  pressure: boolean;
  smoothing: number;
}
export interface DrawingSnapshot {
  base64: string;
  width: number;
  height: number;
}
/** A committed stroke's geometry in document coordinates, for colliders, tracing and scoring. */
export interface DrawingStroke {
  /** Position in the document's stroke list; pass `index + 1` as `from` to read only newer strokes. */
  index: number;
  layerId: number;
  color: string;
  /** Painted width in document units, including the brush's width factor. */
  width: number;
  opacity: number;
  isEraser: boolean;
  brushType: string;
  /** `fill`: `outline` is the painted shape. `stroke`: `outline` is the centreline. */
  style: 'fill' | 'stroke';
  /** [x, y, width, height] of the painted outline. */
  bounds: [number, number, number, number];
  /**
   * Smoothed gesture centrelines as flat [x0, y0, x1, y1, ...] arrays: one per symmetry copy, for
   * brush strokes drawn this session. Empty for loaded strokes, fills and shapes; use `outline`.
   */
  lines: number[][];
  /** Flattened contours of the painted path as flat [x0, y0, ...] arrays. */
  outline: { points: number[]; closed: boolean }[];
}
/** The composited ink under a document point (straight alpha; transparent paper is alpha 0). */
export interface DrawingSample {
  color: string;
  alpha: number;
}
export interface DrawingCoverageOptions {
  /** Document rectangle to measure; defaults to the whole paper. */
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  /** Minimum ink alpha (0..1) that counts as painted. Default 0.5. */
  minAlpha?: number;
}
export interface SavedDrawingPath {
  path: string;
  color: string;
  width: number | string;
  opacity?: number;
  style?: 'fill' | 'stroke';
  isEraser?: boolean;
  brushType?: string;
  touchPoints?: unknown[] | null;
  [key: string]: unknown;
}

/**
 * A native art document. Touches and live rendering never subscribe to React state.
 *
 * Games use the same document without `DrawingCanvas`: bind `texture()` to any entity, feed
 * `input(..., 'document')` from the game's own touches or world hits, and read `strokes()`,
 * `sample()` and `coverage()` for colliders and scoring. Create one document per game screen and
 * `clear()` it on replay; `dispose()` it on unmount (this also frees its texture).
 */
export class DrawingDocument {
  readonly id: number;
  readonly width: number;
  readonly height: number;
  private disposed = false;
  private boundTexture: Texture | null = null;
  constructor(width: number, height: number, pixelRatio = 2) {
    if (!NativeEngine || typeof NativeEngine.drawingCreate !== 'function') {
      throw new Error('Drawing requires a native app rebuild with the updated Nayan Game Engine.');
    }
    NativeEngine.renderWarmUp?.();
    const id = NativeEngine.drawingCreate(width, height, pixelRatio);
    if (id === -2) throw new Error('Drawing was disabled in this engine build.');
    if (id < 0) throw new Error('Unable to create drawing: invalid dimensions or memory limit.');
    this.id = id;
    this.width = width;
    this.height = height;
  }
  get isDisposed() {
    return this.disposed;
  }
  private call<T>(command: object): T {
    if (this.disposed) throw new Error('Drawing document has been disposed');
    const result = JSON.parse(NativeEngine!.drawingCommand(this.id, JSON.stringify(command))) as { ok: boolean; value: T; error?: string };
    if (!result.ok) throw new Error(result.error || 'Drawing operation failed');
    return result.value;
  }
  setBrush(options: DrawingBrushOptions) {
    return this.call<null>({ op: 'brush', ...options });
  }
  updateControls(options: Partial<DrawingControls> & { reset?: boolean }) {
    return this.call<DrawingState>({ op: 'controls', ...options });
  }
  /** Atomic import: errors leave the current artwork intact, including unknown legacy metadata. */
  load(paths: string | readonly SavedDrawingPath[] | DrawingProject) {
    return this.call<DrawingState>({ op: 'load', paths });
  }
  get state() {
    return this.call<DrawingState>({ op: 'state' });
  }
  exportPaths(): string {
    return JSON.stringify(this.call<SavedDrawingPath[]>({ op: 'paths' }));
  }
  /** Rust checks idleness and revision atomically; autosave never finishes a live stroke. */
  setEditingEnabled(enabled: boolean) {
    return this.call<DrawingState>({ op: 'editing', enabled });
  }
  captureDraft(afterRevision = -1): { project: string; revision: number; width: number; height: number } | null {
    return this.call({ op: 'draft', afterRevision });
  }
  /** Browser change stream. Native canvases deliver changes directly from their display clock. */
  readChange(): DrawingState | null {
    if (NativeEngine?.documentEvent) {
      const event = NativeEngine.documentEvent(this.id);
      return event === null ? null : (JSON.parse(event) as DrawingState);
    }
    return this.call({ op: 'event' });
  }
  exportSVG(): string {
    return this.call<string>({ op: 'svg' });
  }
  /** Full editable project: preserves layer order, visibility, locks and original SVG metadata. */
  exportProject(): string {
    return JSON.stringify(this.call<DrawingProject>({ op: 'project' }));
  }
  layer(action: 'add' | 'duplicate' | 'select' | 'update' | 'move' | 'delete' | 'clear', options: Partial<DrawingLayer> & { index?: number } = {}) {
    return this.call<DrawingState>({ op: 'layer', action, ...options });
  }
  fill(x: number, y: number, tolerance = 0.08) {
    return this.call<DrawingState>({ op: 'fill', x, y, tolerance });
  }
  shapeCatalog(): DrawingShapePreview[] {
    return this.call({ op: 'shapes' });
  }
  addShape(kind: DrawingShape, x: number, y: number, endX: number, endY: number, filled = false) {
    return this.call<DrawingState>({ op: 'shape', kind, x, y, endX, endY, filled });
  }
  snapshot(): DrawingSnapshot {
    return this.call<DrawingSnapshot>({ op: 'png' });
  }
  undo() {
    return this.call<DrawingState>({ op: 'undo' });
  }
  redo() {
    return this.call<DrawingState>({ op: 'redo' });
  }
  clear() {
    return this.call<DrawingState>({ op: 'clear' });
  }
  invalidateView() {
    return this.call<DrawingState>({ op: 'invalidateView' });
  }
  resetView() {
    return this.call<DrawingState>({ op: 'resetView' });
  }
  /** Fit the full artwork or fill the viewport width without changing saved dimensions. */
  setViewFit(fit: 'contain' | 'width') {
    return this.call<DrawingState>({ op: 'viewFit', fit });
  }
  finish() {
    return this.call<DrawingState>({ op: 'finish' });
  }
  cancel() {
    return this.call<DrawingState>({ op: 'cancel' });
  }
  /**
   * Feeds one pointer sample: 0 begin, 1 move, 2 end, 3 cancel. `view` coordinates are relative to
   * a `DrawingCanvas` and follow its zoom/pan (browser pointer sampling; native canvases feed
   * touches straight into the Rust core). `document` coordinates skip the view mapping, for games
   * that convert their own touches or world hits (e.g. a raycast's texture UV × document size).
   */
  input(phase: 0 | 1 | 2 | 3, x: number, y: number, pressure = 1, space: 'view' | 'document' = 'view') {
    this.call<null>({ op: 'touch', phase, x, y, pressure, space });
  }
  /**
   * A live texture of the artwork (transparent paper, straight alpha), usable as any entity's
   * `texture`. In-progress strokes appear immediately; only changed rows are uploaded each frame.
   * Created once per document and freed by `dispose()`. Its pixels are not readable through
   * texture APIs; use `sample()`, `coverage()` or `snapshot()`.
   */
  texture(): Texture {
    if (!this.boundTexture) this.boundTexture = Object.freeze(this.call<Texture>({ op: 'texture' }));
    return this.boundTexture;
  }
  /** Committed strokes from index `from`, flattened to `tolerance` document units (default 0.5). */
  strokes(options: { from?: number; tolerance?: number } = {}): DrawingStroke[] {
    return this.call<DrawingStroke[]>({ op: 'strokes', ...options });
  }
  /** The ink under a document point, or null off the paper. Includes an in-progress stroke. */
  sample(x: number, y: number): DrawingSample | null {
    return this.call<DrawingSample | null>({ op: 'sample', x, y });
  }
  /** Fraction (0..1) of a document rectangle covered by ink, for colouring and scratch-off scoring. */
  coverage(options: DrawingCoverageOptions = {}): number {
    return this.call<number>({ op: 'coverage', ...options });
  }
  transform(dx: number, dy: number, scale = 1) {
    return this.call<DrawingState>({ op: 'transform', dx, dy, scale });
  }
  /** Browser presentation; iOS and Android use native display clocks with automatic suspension. */
  present(width: number, height: number, background = '#ffffff', pixelRatio = 1) {
    return this.call<boolean>({
      op: 'render',
      surface: this.id,
      width,
      height,
      background,
      pixelWidth: Math.round(width * pixelRatio),
      pixelHeight: Math.round(height * pixelRatio)
    });
  }
  dispose() {
    if (this.disposed) return;
    NativeEngine!.drawingDestroy(this.id);
    this.disposed = true;
    this.boundTexture = null;
  }
}
