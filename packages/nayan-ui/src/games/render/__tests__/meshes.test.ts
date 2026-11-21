import { describe, expect, mock, test } from 'bun:test';

// Mock react-native so NativeEngine (TurboModuleRegistry) doesn't blow up outside RN.
mock.module('react-native', () => ({
  TurboModuleRegistry: { get: () => null },
  Image: { resolveAssetSource: () => null }
}));

const { Builder, VERTEX_FLOATS } = await import('../meshes');

describe('VERTEX_FLOATS', () => {
  test('is 11 (pos3 + normal3 + color3 + uv2)', () => {
    expect(VERTEX_FLOATS).toBe(11);
  });
});

describe('Builder', () => {
  test('vertex returns sequential indices', () => {
    const b = new Builder();
    expect(b.vertex([0, 0, 0], [0, 1, 0], 0, 0)).toBe(0);
    expect(b.vertex([1, 0, 0], [0, 1, 0], 1, 0)).toBe(1);
    expect(b.vertex([1, 1, 0], [0, 1, 0], 1, 1)).toBe(2);
  });

  test('vertex stores 11 floats per vertex', () => {
    const b = new Builder();
    b.vertex([1, 2, 3], [0.5, 0.5, 0.7071], 0.25, 0.75);
    expect(b.vertices.length).toBe(VERTEX_FLOATS);
    // position
    expect(b.vertices[0]).toBe(1);
    expect(b.vertices[1]).toBe(2);
    expect(b.vertices[2]).toBe(3);
    // normal
    expect(b.vertices[3]).toBe(0.5);
    expect(b.vertices[4]).toBe(0.5);
    expect(b.vertices[5]).toBe(0.7071);
    // color (always white)
    expect(b.vertices[6]).toBe(1);
    expect(b.vertices[7]).toBe(1);
    expect(b.vertices[8]).toBe(1);
    // uv
    expect(b.vertices[9]).toBe(0.25);
    expect(b.vertices[10]).toBe(0.75);
  });

  test('quad creates two triangles (CCW)', () => {
    const b = new Builder();
    b.quad(0, 1, 2, 3);
    expect(b.indices).toEqual([0, 1, 2, 0, 2, 3]);
  });

  test('grid creates correct vertex and triangle counts', () => {
    const b = new Builder();
    // 2x3 grid: (2+1)*(3+1) = 12 vertices, 2*3*2 = 12 triangles = 36 indices
    b.grid(2, 3, (u, v) => [
      [u, 0, v],
      [0, 1, 0]
    ]);
    expect(b.vertices.length / VERTEX_FLOATS).toBe(12);
    expect(b.indices.length).toBe(36);
    // All indices should be valid
    const vertexCount = b.vertices.length / VERTEX_FLOATS;
    for (const idx of b.indices) {
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(vertexCount);
    }
  });

  test('grid UV coordinates span 0..1', () => {
    const b = new Builder();
    b.grid(1, 1, (u, v) => [
      [u, 0, v],
      [0, 1, 0]
    ]);
    // (1+1)*(1+1) = 4 vertices
    expect(b.vertices.length / VERTEX_FLOATS).toBe(4);
    // Collect UVs
    const uvs: [number, number][] = [];
    for (let i = 0; i < b.vertices.length; i += VERTEX_FLOATS) {
      uvs.push([b.vertices[i + 9]!, b.vertices[i + 10]!]);
    }
    // Should include corners [0,0], [1,0], [0,1], [1,1]
    expect(uvs).toContainEqual([0, 0]);
    expect(uvs).toContainEqual([1, 0]);
    expect(uvs).toContainEqual([0, 1]);
    expect(uvs).toContainEqual([1, 1]);
  });

  test('grid appends to existing geometry', () => {
    const b = new Builder();
    b.vertex([0, 0, 0], [0, 1, 0], 0, 0); // 1 vertex before the grid
    const before = b.vertices.length;
    b.grid(1, 1, (u, v) => [
      [u, 0, v],
      [0, 1, 0]
    ]);
    expect(b.vertices.length).toBe(before + 4 * VERTEX_FLOATS);
    // Grid indices should reference vertices starting at index 1, not 0
    expect(Math.min(...b.indices)).toBe(1);
  });

  test('disc creates center + rim vertices and triangles', () => {
    const b = new Builder();
    const segs = 8;
    b.disc(0, 0.5, 1, segs);
    // 1 center + (segs+1) rim vertices
    const vertexCount = b.vertices.length / VERTEX_FLOATS;
    expect(vertexCount).toBe(1 + segs + 1);
    // segs triangles, 3 indices each
    expect(b.indices.length).toBe(segs * 3);
    // All indices valid
    for (const idx of b.indices) {
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(vertexCount);
    }
    // Center vertex is at origin
    expect(b.vertices[0]).toBe(0);
    expect(b.vertices[1]).toBe(0);
    expect(b.vertices[2]).toBe(0);
  });

  test('disc facing down reverses winding', () => {
    const b1 = new Builder();
    b1.disc(0, 0.5, 1, 4);
    const b2 = new Builder();
    b2.disc(0, 0.5, -1, 4);
    // Both should have same number of indices but different order
    expect(b1.indices.length).toBe(b2.indices.length);
    // For the first triangle, facing up: center, rim+1, rim; facing down: center, rim, rim+1
    expect(b1.indices[0]).toBe(0); // center
    expect(b2.indices[0]).toBe(0); // center
    expect(b1.indices[1]).toBe(b2.indices[2]); // swapped
    expect(b1.indices[2]).toBe(b2.indices[1]); // swapped
  });
});
