import { expect, test } from 'bun:test';
import { createTestCore } from '../../native/__tests__/core';
const core = await createTestCore();
function command(id: number, value: object) {
  const result = JSON.parse(core.drawingCommand(id, JSON.stringify(value)));
  if (!result.ok) throw new Error(result.error);
  return result.value;
}
test('JSI-compatible WASM drawing ABI preserves old SVG, metadata, transparent exports and undo', () => {
  const id = core.drawingCreate(80, 100, 1);
  try {
    const paths = [{ path: 'M10 10h60v80h-60z', color: 'navy', width: '2', style: 'fill', opacity: 0.5, extra: { retained: true } }];
    command(id, { op: 'load', paths: JSON.stringify(paths) });
    expect(command(id, { op: 'paths' })).toEqual(paths);
    const png = command(id, { op: 'png' });
    expect(png).toMatchObject({ width: 80, height: 100 });
    expect([...Buffer.from(png.base64, 'base64').subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
    command(id, { op: 'clear' });
    expect(command(id, { op: 'state' }).count).toBe(0);
    command(id, { op: 'undo' });
    expect(command(id, { op: 'paths' })).toEqual(paths);
    expect(() => command(id, { op: 'load', paths: '[{"path":"invalid"}]' })).toThrow();
    expect(command(id, { op: 'paths' })).toEqual(paths);
  } finally {
    core.drawingDestroy(id);
  }
  expect(() => command(id, { op: 'state' })).toThrow('disposed');
});
test('native drawing buffers are released across repeated opens and closes', () => {
  for (let i = 0; i < 100; i++) {
    const id = core.drawingCreate(32, 32, 1);
    command(id, { op: 'brush', color: '#ff5566', width: 3 });
    command(id, { op: 'touch', phase: 0, x: 5, y: 5, pressure: 1 });
    command(id, { op: 'touch', phase: 2, x: 25, y: 25, pressure: 1 });
    expect(command(id, { op: 'state' }).count).toBe(1);
    core.drawingDestroy(id);
    expect(() => command(id, { op: 'state' })).toThrow('disposed');
  }
});
test('layered projects and advanced native tools roundtrip through the published WASM ABI', () => {
  const id = core.drawingCreate(128, 128, 1);
  const restored = core.drawingCreate(128, 128, 1);
  try {
    command(id, { op: 'brush', color: '#1266ff', tool: 'rectangle', filled: true });
    command(id, { op: 'touch', phase: 0, x: 20, y: 20 });
    command(id, { op: 'touch', phase: 2, x: 100, y: 100 });
    command(id, { op: 'layer', action: 'add' });
    command(id, { op: 'brush', color: '#ff8844', tool: 'fill' });
    command(id, { op: 'touch', phase: 0, x: 64, y: 64 });
    const project = command(id, { op: 'project' });
    expect(project.version).toBe(2);
    expect(project.layers.length).toBe(2);
    command(restored, { op: 'load', paths: JSON.stringify(project) });
    expect(command(restored, { op: 'png' })).toEqual(command(id, { op: 'png' }));
    expect(command(restored, { op: 'project' })).toEqual(project);
    expect(command(id, { op: 'svg' })).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
    command(id, { op: 'layer', action: 'update', locked: true });
    expect(() => command(id, { op: 'fill', x: 3, y: 3 })).toThrow('unlocked');
  } finally {
    core.drawingDestroy(id);
    core.drawingDestroy(restored);
  }
});
test('Rust idle checkpoints never finish active input and state events skip repeated samples', () => {
  const id = core.drawingCreate(128, 128, 1);
  try {
    expect(command(id, { op: 'event' }).isDrawing).toBe(false);
    expect(command(id, { op: 'event' })).toBeNull();
    command(id, { op: 'touch', phase: 0, x: 20, y: 20 });
    expect(command(id, { op: 'event' }).isDrawing).toBe(true);
    for (let i = 0; i < 10; i++) {
      command(id, { op: 'touch', phase: 1, x: 20 + i, y: 30 });
      expect(command(id, { op: 'event' })).toBeNull();
    }
    expect(command(id, { op: 'draft', afterRevision: -1 })).toBeNull();
    expect(command(id, { op: 'state' }).isDrawing).toBe(true);
    command(id, { op: 'touch', phase: 2, x: 80, y: 80 });
    const checkpoint = command(id, { op: 'draft', afterRevision: -1 });
    expect(JSON.parse(checkpoint.project).paths.length).toBe(1);
    expect(command(id, { op: 'draft', afterRevision: checkpoint.revision })).toBeNull();
  } finally {
    core.drawingDestroy(id);
  }
});

test('native catalog and expanded shapes cross the WASM bridge with editable SVG previews', () => {
  const id = core.drawingCreate(128, 128, 1);
  try {
    const catalog = command(id, { op: 'shapes' });
    expect(catalog.length).toBe(20);
    expect(catalog.find((shape: { kind: string }) => shape.kind === 'heart').filledPath).toBeTruthy();
    command(id, { op: 'brush', tool: 'star', color: '#ffb000', width: 3, filled: true });
    command(id, { op: 'touch', phase: 0, x: 15, y: 15 });
    command(id, { op: 'touch', phase: 2, x: 100, y: 100 });
    expect(command(id, { op: 'state' }).count).toBe(1);
    const paths = command(id, { op: 'paths' });
    expect(paths[0].style).toBe('fill');
    expect(paths[0].path).toContain('Z');
  } finally {
    core.drawingDestroy(id);
  }
});
