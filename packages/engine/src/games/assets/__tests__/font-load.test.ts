import { describe, expect, mock, test } from 'bun:test';

// Exercise the real loader and mesh registration with an outline-font-like native bridge.
const glyphs = new Map<number, number[]>();
const supported = new Set('A? %·×÷—’→€é𝛑0123456789');
const meshes = new Map<string, number>();
let nextFont = 0;
let nextMesh = 100;
let failNext = false;
const bytes = new ArrayBuffer(8);
const native = {
  fontLoad: mock((_bytes: object, _depth: number, chars: string, _weight: number) => {
    if (failNext) {
      failNext = false;
      return -1;
    }
    const data: number[] = [];
    for (const ch of new Set(chars)) {
      if (!supported.has(ch)) continue;
      if (!meshes.has(ch)) meshes.set(ch, ch === ' ' ? -1 : nextMesh++);
      data.push(ch.codePointAt(0)!, meshes.get(ch)!, ch === '1' ? 0.3 : 0.6);
    }
    const id = nextFont++;
    glyphs.set(id, [...data, 0.7]);
    return id;
  }),
  fontGlyphs: (id: number) => glyphs.get(id)!,
  loadError: () => 'font registry unavailable',
  renderMesh: mock(() => {}),
  modelVertices: () => new Float32Array(33).buffer,
  modelIndices: () => new Uint32Array([0, 1, 2]).buffer
};
mock.module('../../../native/NativeNayanEngine', () => ({ default: native }));
mock.module('../../../assets/source', () => ({
  assetUri: (source: number | string) => String(source),
  loadAssetBytes: async (source: number | string) => ({
    bytes,
    uri: String(source)
  })
}));
const { loadFont, layoutText, measureText } = await import('../font');
let sourceId = 0;
const font = () =>
  loadFont(`file:///symbols-${sourceId++}.ttf`, {
    chars: 'A',
    depth: 0,
    weight: 600
  });

describe('on-demand Unicode glyph loading', () => {
  test('a narrow preload still includes space and a fallback glyph', async () => {
    const f = await font();
    expect([...f.glyphs.keys()]).toEqual(['A', ' ', '?']);
    expect(f.glyphs.has('%')).toBe(false);
  });

  test("new symbols load together once and keep the font's bytes, depth and weight", async () => {
    const f = await font();
    const before = native.fontLoad.mock.calls.length;
    const placed = layoutText(f, '%·→%—€𝛑', 'left');
    expect(native.fontLoad.mock.calls.length).toBe(before + 1);
    expect(native.fontLoad.mock.calls.at(-1)).toEqual([bytes, 0, '%·→—€𝛑', 600]);
    expect(placed.map((g) => g.mesh)).toEqual([...'%·→%—€𝛑'].map((ch) => f.glyphs.get(ch)!.mesh));
    layoutText(f, '%·→%—€𝛑', 'center');
    measureText(f, '%·→%—€𝛑');
    expect(native.fontLoad.mock.calls.length).toBe(before + 1);
  });

  test('measurement prepares glyphs before wrapping or alignment and drawing reuses them', async () => {
    const f = await font();
    const before = native.fontLoad.mock.calls.length;
    const width = measureText(f, 'A%·→', { letterSpacing: 0.1 });
    expect(native.fontLoad.mock.calls.length).toBe(before + 1);
    const placed = layoutText(f, 'A%·→', 'right', { letterSpacing: 0.1 });
    expect(placed[0]!.x).toBeCloseTo(-width);
    expect(native.fontLoad.mock.calls.length).toBe(before + 1);
  });

  test('missing font characters are attempted once then use a stable fallback', async () => {
    const f = await font();
    const before = native.fontLoad.mock.calls.length;
    for (let i = 0; i < 5; i++) {
      expect(layoutText(f, '☃', 'left')[0]!.mesh).toBe(f.glyphs.get('?')!.mesh);
      expect(measureText(f, '☃')).toBeCloseTo(0.6);
    }
    expect(native.fontLoad.mock.calls.length).toBe(before + 1);
  });

  test('format controls never allocate meshes and accents normalize before loading', async () => {
    const f = await font();
    const before = native.fontLoad.mock.calls.length;
    layoutText(f, 'A\uFE0F\u200B\u200E\u2060', 'left');
    expect(native.fontLoad.mock.calls.length).toBe(before);
    expect(layoutText(f, 'e\u0301', 'left')[0]!.mesh).toBe(f.glyphs.get('é')!.mesh);
    expect(native.fontLoad.mock.calls.at(-1)![2]).toBe('é');
  });

  test('tabular layout prepares all digits so future values keep the same slot width', async () => {
    const f = await font();
    expect(measureText(f, '1', { tabular: true })).toBeCloseTo(0.6);
    expect(native.fontLoad.mock.calls.at(-1)![2]).toBe('1023456789');
    const before = native.fontLoad.mock.calls.length;
    expect(measureText(f, '9', { tabular: true })).toBeCloseTo(0.6);
    expect(native.fontLoad.mock.calls.length).toBe(before);
  });

  test('a failed extension can retry without permanently caching absent glyphs', async () => {
    const f = await font();
    failNext = true;
    expect(() => layoutText(f, '%', 'left')).toThrow("couldn't build additional glyphs");
    expect(layoutText(f, '%', 'left')[0]!.mesh).toBe(f.glyphs.get('%')!.mesh);
  });

  test('the original font instance and cached load are retained while symbols are added', async () => {
    const source = `file:///symbols-${sourceId++}.ttf`;
    const f = await loadFont(source, { chars: 'A' });
    const id = f.id;
    layoutText(f, '×÷’', 'left');
    expect(await loadFont(source, { chars: 'A' })).toBe(f);
    expect(f.id).toBe(id);
  });
  test('different prewarm sets extend one font instead of rebuilding shared glyphs', async () => {
    const source = `file:///symbols-${sourceId++}.ttf`;
    const first = await loadFont(source, { chars: 'A' });
    const calls = native.fontLoad.mock.calls.length;
    const second = await loadFont(source, { chars: 'A%→' });
    expect(second).toBe(first);
    expect(native.fontLoad.mock.calls.length).toBe(calls + 1);
    expect(native.fontLoad.mock.calls.at(-1)?.[2]).toBe('%→');
    expect(await loadFont(source, { chars: '→%A' })).toBe(first);
    expect(native.fontLoad.mock.calls.length).toBe(calls + 1);
  });
});
