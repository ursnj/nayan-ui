import { imageAssetSource } from '../assets/source';
import NativeEngine from '../native/NativeNayanEngine';
import type { DocumentSurface } from '../native/surface/types';
import type { ComponentListPlan, ComponentListScroll } from './runtime';
import type { ComponentNode, ComponentSnapshot } from './types';

/** Internal lifetime/transport. Rust owns widget data; platform editors own the live text buffer. */
type ComponentSurfaceChange = { ui?: ComponentSnapshot };

export class ComponentDocument implements DocumentSurface<ComponentSurfaceChange> {
  readonly id: number;
  private disposed = false;
  private origin = { x: 0, y: 0 };
  private treeCommand = '';
  private controlledInputs = new Set<string>();
  private controlledEdits = false;
  private treeValues = new Map<string, unknown>();
  private inputEchoes = new Map<string, unknown>();

  setSurfaceOrigin(x: number, y: number) {
    this.origin = { x, y };
  }

  /** Query Rust scroll ancestry once when a presentation considers taking a drag. */
  canStartSheetDrag(pageX: number, pageY: number): boolean {
    return this.call<{ allowed: boolean }>({ op: 'components', action: 'sheetDrag', x: pageX - this.origin.x, y: pageY - this.origin.y }).allowed;
  }

  async captureNode(id: string, uri: string, screen: { width: number; height: number }) {
    const bounds = this.call<{ rect: number[] }>({ op: 'components', action: 'bounds', id }).rect;
    const { loadUIImage } = await import('./imageLoader');
    const texture = await loadUIImage({ uri }, 'none', () => this.disposed);
    if (texture == null) throw new Error('UI surface has been disposed');
    // The command consumes the decoded image even if the surface was disposed while decoding.
    const result = JSON.parse(
      NativeEngine!.drawingCommand(this.id, JSON.stringify({ op: 'componentCropImage', texture, rect: bounds, origin: this.origin, screen }))
    );
    if (!result.ok) throw new Error(result.error);
    return result.value as { base64: string; width: number; height: number };
  }

  private readonly imageLoads = new Set<number>();
  private imageJobs: NonNullable<ComponentSnapshot['imageRequests']> = [];
  private imageRevision = -1;

  constructor() {
    if (!NativeEngine || typeof NativeEngine.drawingCreate !== 'function') throw new Error('UI requires a native app rebuilt with the Nayan engine.');
    NativeEngine.renderWarmUp?.();
    this.id = NativeEngine.componentCreate?.() ?? NativeEngine.drawingCreate(1, 1, 1);
    if (this.id === -2) throw new Error('UI requires an engine build with the ui Rust feature.');
    if (this.id < 0) throw new Error('Unable to create UI surface');
    try {
      this.request({ action: 'tree', nodes: [] });
    } catch (error) {
      NativeEngine.drawingDestroy(this.id);
      this.disposed = true;
      throw error;
    }
  }

  get isDisposed() {
    return this.disposed;
  }

  get hasPendingControlledEdit() {
    return this.controlledEdits;
  }

  private call<T>(command: Record<string, unknown> | string): T {
    if (this.disposed) throw new Error('UI has been disposed');
    const result = JSON.parse(NativeEngine!.drawingCommand(this.id, typeof command === 'string' ? command : JSON.stringify(command))) as {
      ok: boolean;
      error?: string;
      value: T;
    };
    if (!result.ok)
      throw new Error(
        result.error === 'Unknown drawing command'
          ? 'UI requires an engine build with the ui Rust feature; rebuild the core and host app.'
          : result.error || 'Engine UI command failed'
      );
    return result.value;
  }

  request(command: Record<string, unknown>) {
    const snapshot = this.call<ComponentSnapshot>({ op: 'components', ...command });
    this.readResources(snapshot);
    return snapshot;
  }

  /** Input is consumed by the next Rust frame; it needs no copy of the accessibility tree. */
  dispatch(command: Record<string, unknown>): void {
    this.call({ op: 'components', ...command, snapshot: false });
  }

  selectKey(key: string, id?: string): boolean {
    return this.call<{ handled: boolean }>({ op: 'components', action: 'key', key, id, selectOnly: true }).handled;
  }

  selectText(command: {
    phase: 'start' | 'move' | 'end' | 'word' | 'block' | 'all' | 'copy' | 'clear' | 'touchStart' | 'touchMove' | 'touchEnd' | 'menu';
    x?: number;
    y?: number;
    extend?: boolean;
  }) {
    return this.call<{ handled: boolean; text: string; revision: number }>({ op: 'components', action: 'textSelection', ...command });
  }

  planList(id: string, props: Record<string, unknown>): ComponentListPlan {
    try {
      return this.call<ComponentListPlan>({ op: 'components', action: 'listPlan', id, props });
    } catch (error) {
      throw new RangeError(error instanceof Error ? error.message : String(error), { cause: error });
    }
  }

  scrollList(id: string, command: ComponentListScroll): void {
    try {
      this.request({ action: 'listScroll', id, ...command });
    } catch (error) {
      throw new RangeError(error instanceof Error ? error.message : String(error), { cause: error });
    }
  }

  edit(id: string, value: string | number, platform = false, selection?: { start: number; end: number }) {
    if (this.controlledInputs.has(id)) this.controlledEdits = true;
    const update = this.request({ action: 'value', id, value, platform, selection, acknowledge: true, compact: true });
    if (platform && this.controlledInputs.has(id)) this.inputEchoes.set(id, update.nodes.find((node) => node.id === id)?.value ?? value);
    return update;
  }

  setTree(nodes: ComponentNode[]) {
    const controlled = new Set<string>();
    const values = new Map<string, unknown>();
    const normalize = (nodes: ComponentNode[]): ComponentNode[] =>
      nodes.map((node) => {
        if (['NInput', 'NTextarea', 'NSearchField', 'NInputOtp'].includes(node.kind) && node.props.value !== undefined) {
          controlled.add(node.id);
          values.set(node.id, node.props.value);
        }
        return {
          ...node,
          props:
            node.kind === 'NImage'
              ? {
                  ...node.props,
                  source: imageAssetSource(node.props.source ?? node.props.src),
                  placeholder: imageAssetSource(node.props.placeholder),
                  fallbackSource: imageAssetSource(node.props.fallbackSource)
                }
              : node.props,
          children: normalize(node.children)
        };
      });
    const normalized = normalize(nodes);
    const serialize = (nodes: ComponentNode[]) => JSON.stringify({ op: 'components', action: 'tree', nodes, snapshot: false });
    const command = serialize(normalized);
    if (command === this.treeCommand && !this.controlledEdits) return;
    // React's controlled echo already lives in Rust. Skip a full tree parse/layout invalidation
    // when it is the only change; transformed/rejected values and other UI updates still commit.
    const acknowledged = this.inputEchoes.size > 0 && [...this.inputEchoes].every(([id, value]) => !controlled.has(id) || values.get(id) === value);
    const withoutEchoes = (nodes: ComponentNode[]): ComponentNode[] =>
      nodes.map((node) => ({
        ...node,
        props:
          values.has(node.id) && this.inputEchoes.has(node.id) && this.treeValues.has(node.id)
            ? { ...node.props, value: this.treeValues.get(node.id) }
            : node.props,
        children: withoutEchoes(node.children)
      }));
    if (!acknowledged || serialize(withoutEchoes(normalized)) !== this.treeCommand) this.call(command);
    this.treeCommand = command;
    this.controlledInputs = controlled;
    this.treeValues = values;
    this.controlledEdits = false;
    this.inputEchoes.clear();
  }

  /** I/O tokens only; Rust owns loading, caching, stale-result checks and callbacks. */
  readResources(snapshot: ComponentSnapshot) {
    if (snapshot.partial) return;
    if (snapshot.revision < this.imageRevision) return;
    this.imageRevision = snapshot.revision;
    this.imageJobs = snapshot.imageRequests ?? [];
    this.pumpImages();
  }

  private pumpImages() {
    for (const job of this.imageJobs) {
      if (this.disposed || this.imageLoads.size >= 4) break;
      if (this.imageLoads.has(job.request)) continue;
      this.imageLoads.add(job.request);
      void import('./imageLoader')
        .then(({ loadUIImage }) =>
          loadUIImage(
            job.source,
            job.cachePolicy,
            () => this.disposed || !this.imageJobs.some((current) => current.request === job.request),
            job.decode
          )
        )
        .then(
          (texture) => {
            if (texture == null) return;
            this.imageResult(job.request, texture);
          },
          (cause: unknown) => this.imageResult(job.request, -1, cause instanceof Error ? cause.message : String(cause))
        )
        .finally(() => {
          this.imageLoads.delete(job.request);
          this.pumpImages();
        });
    }
  }

  private imageResult(request: number, texture: number, error?: string) {
    // Always deliver completion, even after unmount: Rust releases the temporary texture
    // before checking document lifetime, so background decoding cannot leak it.
    const response = JSON.parse(NativeEngine!.drawingCommand(this.id, JSON.stringify({ op: 'componentImage', request, texture, error }))) as {
      ok: boolean;
      value?: ComponentSnapshot;
    };
    if (!this.disposed && response.ok && response.value) this.readResources(response.value);
  }

  input(phase: 0 | 1 | 2 | 3, x: number, y: number) {
    this.call({ op: 'touch', phase, x, y });
  }

  cancel() {
    this.request({ action: 'cancel' });
  }

  transform(x: number, y: number) {
    this.dispatch({ action: 'scroll', x, y });
  }

  pointer(x: number, y: number) {
    this.dispatch({ action: 'pointer', x, y });
  }

  invalidateView() {
    this.call({ op: 'invalidateView' });
  }

  readChange() {
    type Change = ComponentSurfaceChange & { components?: ComponentSnapshot };
    let change: Change | null;
    if (NativeEngine?.documentEvent) {
      const event = NativeEngine.documentEvent(this.id);
      change = event === null ? null : (JSON.parse(event) as Change);
    } else {
      change = this.call<Change | null>({ op: 'event' });
    }
    if (change?.components) return { ui: change.components };
    return change;
  }

  present(width: number, height: number, background: string, pixelRatio = 1) {
    const pixelWidth = Math.round(width * pixelRatio);
    const pixelHeight = Math.round(height * pixelRatio);
    if (NativeEngine?.componentPresent) {
      NativeEngine.componentPresent(this.id, width, height, pixelWidth, pixelHeight);
      return;
    }
    this.call({
      op: 'render',
      surface: this.id,
      width,
      height,
      background,
      pixelWidth,
      pixelHeight
    });
  }

  dispose() {
    if (this.disposed) return;
    NativeEngine!.drawingDestroy(this.id);
    this.disposed = true;
  }
}
