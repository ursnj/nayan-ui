import { describe, expect, mock, test } from 'bun:test';

// Mock react-native so NativeEngine (TurboModuleRegistry) doesn't blow up outside RN.
mock.module('react-native', () => ({
  AssetRegistry: { getAssetByID: () => undefined },
  TurboModuleRegistry: { get: () => null },
  Image: { resolveAssetSource: () => null }
}));

const { DEFAULT_CHARS, layoutText, measureText } = await import('../font');
import type { Font } from '../font';

// A minimal mock font with known metrics for testing layoutText.
function mockFont(glyphs: Record<string, { mesh: number; advance: number }>, capHeight = 0.7): Font {
  return {
    id: 1,
    capHeight,
    glyphs: new Map(Object.entries(glyphs))
  };
}

const simpleFont = mockFont({
  'A': { mesh: 10, advance: 0.6 },
  'B': { mesh: 11, advance: 0.55 },
  'C': { mesh: 12, advance: 0.5 },
  ' ': { mesh: -1, advance: 0.3 },
  '0': { mesh: 20, advance: 0.5 },
  '1': { mesh: 21, advance: 0.3 },
  '2': { mesh: 22, advance: 0.5 },
  '?': { mesh: 30, advance: 0.4 }
});

describe('layoutText', () => {
  test('empty text returns empty array', () => {
    expect(layoutText(simpleFont, '', 'left')).toEqual([]);
  });

  test('left-aligned text starts at x=0', () => {
    const placed = layoutText(simpleFont, 'AB', 'left');
    expect(placed.length).toBe(2);
    expect(placed[0]!.x).toBe(0);
    expect(placed[0]!.mesh).toBe(10); // A
    expect(placed[1]!.x).toBe(0.6); // after A's advance
    expect(placed[1]!.mesh).toBe(11); // B
  });

  test('center-aligned text is shifted by -width/2', () => {
    const placed = layoutText(simpleFont, 'AB', 'center');
    const width = 0.6 + 0.55; // A + B
    expect(placed[0]!.x).toBeCloseTo(-width / 2, 5);
  });

  test('right-aligned text ends at x≈0', () => {
    const placed = layoutText(simpleFont, 'AB', 'right');
    const width = 0.6 + 0.55;
    expect(placed[0]!.x).toBeCloseTo(-width, 5);
    expect(placed[1]!.x).toBeCloseTo(-width + 0.6, 5);
  });

  test('y is set to -capHeight/2 (vertical centering)', () => {
    const placed = layoutText(simpleFont, 'A', 'left');
    expect(placed[0]!.y).toBeCloseTo(-0.7 / 2, 5);
  });

  test('spaces produce no visible glyph (mesh -1)', () => {
    const placed = layoutText(simpleFont, 'A B', 'left');
    // Only A and B should appear (space has mesh -1)
    expect(placed.length).toBe(2);
    expect(placed[0]!.mesh).toBe(10);
    expect(placed[1]!.mesh).toBe(11);
    // B is positioned after A's advance + space advance
    expect(placed[1]!.x).toBeCloseTo(0.6 + 0.3, 5);
  });

  test('letterSpacing adds gap between each letter', () => {
    const placed = layoutText(simpleFont, 'AB', 'left', { letterSpacing: 0.1 });
    expect(placed[1]!.x).toBeCloseTo(0.6 + 0.1, 5);
  });

  test('letterSpacing does not add before first letter', () => {
    const placed = layoutText(simpleFont, 'A', 'left', { letterSpacing: 0.5 });
    expect(placed[0]!.x).toBe(0);
  });

  test('unknown characters fall back to ?', () => {
    const placed = layoutText(simpleFont, 'X', 'left');
    expect(placed.length).toBe(1);
    expect(placed[0]!.mesh).toBe(30); // ? glyph
  });

  test('unknown characters are skipped if no ? glyph', () => {
    const noQuestionFont = mockFont({ A: { mesh: 10, advance: 0.6 } });
    const placed = layoutText(noQuestionFont, 'XA', 'left');
    expect(placed.length).toBe(1);
    expect(placed[0]!.mesh).toBe(10);
  });

  test('tabular digits use widest digit advance', () => {
    const placed = layoutText(simpleFont, '10', 'left', { tabular: true });
    // Widest digit: "0" or "2" = 0.5
    // "1" normally 0.3, but tabular makes it 0.5
    expect(placed.length).toBe(2);
    // "1" at x=0, advance=0.5 (tabular)
    // "0" at x=0.5
    expect(placed[1]!.x).toBeCloseTo(0.5, 5);
  });

  test('tabular centers narrow digits in the wider slot', () => {
    const placed = layoutText(simpleFont, '1', 'left', { tabular: true });
    // "1" has advance 0.3 but tabular width 0.5
    // x = (0.5 - 0.3) / 2 = 0.1 centering offset
    expect(placed[0]!.x).toBeCloseTo(0.1, 5);
  });

  test('non-digit characters unaffected by tabular', () => {
    const withTab = layoutText(simpleFont, 'A', 'left', { tabular: true });
    const without = layoutText(simpleFont, 'A', 'left', { tabular: false });
    expect(withTab[0]!.x).toBe(without[0]!.x);
  });
});

describe('Unicode text layout and measurement', () => {
  const symbols = mockFont({
    'A': { mesh: 10, advance: 0.6 },
    '%': { mesh: 40, advance: 0.8 },
    '·': { mesh: 41, advance: 0.3 },
    '×': { mesh: 42, advance: 0.6 },
    '→': { mesh: 43, advance: 0.9 },
    'é': { mesh: 44, advance: 0.55 },
    '𝛑': { mesh: 45, advance: 0.7 },
    ' ': { mesh: -1, advance: 0.3 },
    '?': { mesh: 30, advance: 0.4 }
  });

  test('the default prewarm covers every printable ASCII character and common symbols', () => {
    for (let code = 32; code <= 126; code++) expect(DEFAULT_CHARS).toContain(String.fromCharCode(code));
    for (const ch of '×÷±−°·•–—…‘’“”') expect(DEFAULT_CHARS).toContain(ch);
  });

  test('special characters keep their own glyphs', () => {
    expect(layoutText(symbols, '%·×→', 'left').map((g) => g.mesh)).toEqual([40, 41, 42, 43]);
  });

  test('surrogate pairs produce one character and one advance', () => {
    expect(layoutText(symbols, '𝛑A', 'left').map((g) => g.mesh)).toEqual([45, 10]);
    expect(measureText(symbols, '𝛑A')).toBeCloseTo(1.3);
  });

  test('decomposed accents use the same glyph and width as precomposed text', () => {
    expect(layoutText(symbols, 'e\u0301', 'left')).toEqual(layoutText(symbols, 'é', 'left'));
    expect(measureText(symbols, 'e\u0301')).toBe(measureText(symbols, 'é'));
  });

  test('invisible presentation and directional controls do not turn into question marks or gaps', () => {
    const plain = layoutText(symbols, 'A→A', 'left', { letterSpacing: 0.1 });
    expect(layoutText(symbols, '\u200EA\u200B→\uFE0F\u{E0100}\u2060A\uFEFF', 'left', { letterSpacing: 0.1 })).toEqual(plain);
    expect(measureText(symbols, 'A→\uFE0FA')).toBe(measureText(symbols, 'A→A'));
  });

  test('nonbreaking locale separators use a blank space when the font lacks them', () => {
    expect(layoutText(symbols, 'A\u00A0A', 'left')).toEqual(layoutText(symbols, 'A A', 'left'));
    expect(measureText(symbols, 'A\u202FA')).toBe(measureText(symbols, 'A A'));
  });

  test('measurement, alignment and spacing use the same fallback advances', () => {
    const text = 'A% ·→☃';
    const width = measureText(symbols, text, { letterSpacing: 0.1 });
    const placed = layoutText(symbols, text, 'right', { letterSpacing: 0.1 });
    expect(placed[0]!.x).toBeCloseTo(-width);
    expect(placed.at(-1)!.mesh).toBe(30);
    expect(placed.at(-1)!.x + 0.4).toBeCloseTo(0);
    expect(measureText(symbols, '')).toBe(0);
  });

  test('measurement honors tabular digit slots', () => {
    expect(measureText(simpleFont, '10', { tabular: true })).toBe(1);
    expect(measureText(simpleFont, '10', { tabular: false })).toBe(0.8);
  });
});
