import { afterEach, expect, mock, test } from 'bun:test';
const command = mock((_id: number, _text: string) => JSON.stringify({ ok: true, value: { count: 1 } }));
const create = mock(() => 500001);
const destroy = mock(() => {});
mock.module('../../native/NativeNayanEngine', () => ({ default: { drawingCreate: create, drawingCommand: command, drawingDestroy: destroy } }));
const { DrawingDocument } = await import('../DrawingDocument');
afterEach(() => {
  command.mockReset();
  command.mockImplementation(() => JSON.stringify({ ok: true, value: { count: 1 } }));
  create.mockClear();
  destroy.mockClear();
});
test('legacy SVG and all metadata reach native import without rewriting curves', () => {
  const doc = new DrawingDocument(390, 844, 2);
  const input = '[{"path":"M1 2Q3 4 5 6","width":"4","color":"navy","brushType":"CALLIGRAPHY","touchPoints":[{"x":2,"y":3}],"extra":"kept"}]';
  doc.load(input);
  expect(JSON.parse(command.mock.calls[0]![1])).toEqual({ op: 'load', paths: input });
  doc.dispose();
});
test('native failures surface rather than dropping paths or losing the document', () => {
  const doc = new DrawingDocument(320, 640);
  command.mockReturnValueOnce(JSON.stringify({ ok: false, error: 'Invalid SVG drawing path' }));
  expect(() => doc.load('[{}]')).toThrow('Invalid SVG drawing path');
  expect(() => doc.state).not.toThrow();
  doc.dispose();
});
test('snapshot exports document pixels and metadata with one native call', () => {
  const doc = new DrawingDocument(320, 640);
  command.mockReturnValueOnce(JSON.stringify({ ok: true, value: { base64: 'png-data', width: 640, height: 1280 } }));
  expect(doc.snapshot()).toEqual({ base64: 'png-data', width: 640, height: 1280 });
  expect(JSON.parse(command.mock.calls[0]![1])).toEqual({ op: 'png' });
  doc.dispose();
});
test('disposal is idempotent and prevents use of released native memory', () => {
  const doc = new DrawingDocument(320, 640);
  doc.dispose();
  doc.dispose();
  expect(destroy).toHaveBeenCalledTimes(1);
  expect(() => doc.undo()).toThrow('disposed');
  expect(command).not.toHaveBeenCalled();
});
test('undo redo clear reset pressure and sampling use the shared native document', () => {
  const doc = new DrawingDocument(320, 640);
  doc.setBrush({ brushType: 'PENCIL', color: '#123456', width: 2.5, opacity: 0.25, pressure: true, smoothing: 0.4 });
  doc.input(0, 12, 34, 0.3);
  doc.input(1, 14, 35, 0.5);
  doc.input(2, 16, 37, 0.2);
  doc.undo();
  doc.redo();
  doc.clear();
  doc.resetView();
  doc.cancel();
  const values = command.mock.calls.map((call) => JSON.parse(call[1]));
  expect(values[0]).toMatchObject({ op: 'brush', pressure: true, smoothing: 0.4 });
  expect(values[1]).toEqual({ op: 'touch', phase: 0, x: 12, y: 34, pressure: 0.3, space: 'view' });
  expect(values.slice(4).map((v) => v.op)).toEqual(['undo', 'redo', 'clear', 'resetView', 'cancel']);
  doc.dispose();
});
test('editable layers, shapes, fill, and vector exports use Rust commands', () => {
  const doc = new DrawingDocument(320, 640);
  doc.layer('add');
  doc.layer('update', { id: 1, name: 'Sketch', opacity: 0.5 });
  doc.addShape('ellipse', 10, 20, 100, 120, true);
  doc.fill(50, 60, 0.12);
  doc.exportProject();
  doc.exportSVG();
  expect(command.mock.calls.map((call) => JSON.parse(call[1]))).toEqual([
    { op: 'layer', action: 'add' },
    { op: 'layer', action: 'update', id: 1, name: 'Sketch', opacity: 0.5 },
    { op: 'shape', kind: 'ellipse', x: 10, y: 20, endX: 100, endY: 120, filled: true },
    { op: 'fill', x: 50, y: 60, tolerance: 0.12 },
    { op: 'project' },
    { op: 'svg' }
  ]);
  doc.dispose();
});

test('shape catalog previews come from the Rust command API', () => {
  const doc = new DrawingDocument(128, 128);
  const shapes = [{ kind: 'heart' as const, name: 'Heart', path: 'M0 0L1 1Z', filledPath: 'M0 0L1 1Z', canFill: true }];
  command.mockReturnValueOnce(JSON.stringify({ ok: true, value: shapes }));
  expect(doc.shapeCatalog()).toEqual(shapes);
  expect(JSON.parse(command.mock.calls[0]![1])).toEqual({ op: 'shapes' });
  doc.dispose();
});

test('games bind one live texture, feed document-space input and read geometry and coverage', () => {
  const doc = new DrawingDocument(256, 256, 1);
  command.mockReturnValueOnce(JSON.stringify({ ok: true, value: { id: 7, width: 256, height: 256 } }));
  const texture = doc.texture();
  expect(texture).toEqual({ id: 7, width: 256, height: 256 });
  expect(doc.texture()).toBe(texture);
  doc.input(0, 40, 50, 1, 'document');
  doc.strokes({ from: 2, tolerance: 1 });
  doc.sample(10, 20);
  doc.coverage({ x: 0, y: 0, width: 128, height: 64, minAlpha: 0.25 });
  expect(command.mock.calls.map((call) => JSON.parse(call[1]))).toEqual([
    { op: 'texture' },
    { op: 'touch', phase: 0, x: 40, y: 50, pressure: 1, space: 'document' },
    { op: 'strokes', from: 2, tolerance: 1 },
    { op: 'sample', x: 10, y: 20 },
    { op: 'coverage', x: 0, y: 0, width: 128, height: 64, minAlpha: 0.25 }
  ]);
  doc.dispose();
  expect(() => doc.texture()).toThrow('disposed');
});

test('every editing, draft, view and presentation call maps to one native command', () => {
  const doc = new DrawingDocument(200, 100, 2);
  doc.updateControls({ tool: 'shape', shape: 'star', reset: true });
  doc.exportPaths();
  doc.setEditingEnabled(false);
  doc.captureDraft(7);
  doc.captureDraft();
  doc.readChange();
  void doc.state;
  doc.invalidateView();
  doc.setViewFit('width');
  doc.finish();
  doc.transform(4, -2, 1.5);
  doc.present(320, 240, '#101010', 2);
  expect(command.mock.calls.map((call) => JSON.parse(call[1]))).toEqual([
    { op: 'controls', tool: 'shape', shape: 'star', reset: true },
    { op: 'paths' },
    { op: 'editing', enabled: false },
    { op: 'draft', afterRevision: 7 },
    { op: 'draft', afterRevision: -1 },
    { op: 'event' },
    { op: 'state' },
    { op: 'invalidateView' },
    { op: 'viewFit', fit: 'width' },
    { op: 'finish' },
    { op: 'transform', dx: 4, dy: -2, scale: 1.5 },
    { op: 'render', surface: 500001, width: 320, height: 240, background: '#101010', pixelWidth: 640, pixelHeight: 480 }
  ]);
  expect(doc.isDisposed).toBe(false);
  doc.dispose();
  expect(doc.isDisposed).toBe(true);
});

test('invalid dimensions surface the native rejection', () => {
  create.mockReturnValueOnce(-1);
  expect(() => new DrawingDocument(0, 0)).toThrow('invalid dimensions');
});
