import { act, createElement, type ReactNode } from 'react';
import { afterAll, expect, mock, test } from 'bun:test';
import { installReactTestEnvironment } from '../../__tests__/dom';
import type { NPatternRecipe } from '../NPattern';

const requests = mock(async (_bytes: ArrayBufferLike, command: string) => {
  const { width, height } = JSON.parse(command);
  return JSON.stringify({ ok: true, value: `data:image/png;base64,${width}x${height}` });
});
mock.module('../../native/NativeNayanEngine', () => ({ default: { iconRequest: requests } }));
mock.module('../../native/prepare', () => ({ prepareEngine: async () => {} }));
mock.module('react-native', () => ({
  PixelRatio: { get: () => 3 },
  StyleSheet: { absoluteFill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } },
  View: ({ children, ...props }: { children?: ReactNode }) => createElement('div', { 'data-props': JSON.stringify(props) }, children),
  Image: (props: Record<string, unknown>) => createElement('img', { 'data-props': JSON.stringify(props) })
}));
const { patternImage } = await import('../patternImage');
const { NPattern } = await import('../NPattern');
const dom = await installReactTestEnvironment();
afterAll(() => dom.cleanup());
const recipe: NPatternRecipe = { shapes: [{ kind: 'circle', cx: '50%', cy: '50%', r: 12, color: '#ff000080' }] };

test('backgrounds and blur copies share bounded native jobs, with theme/density/size in their keys', async () => {
  const first = patternImage(recipe, 390, 844, 3);
  expect(patternImage(recipe, 390, 844, 3)).toBe(first);
  expect(await first).toBe('data:image/png;base64,390x844');
  const command = JSON.parse(requests.mock.calls.at(-1)![1]);
  expect(command).toEqual({ action: 'patternImage', recipe, width: 390, height: 844, density: 3 });
  expect(patternImage(recipe, 390, 844, 2)).not.toBe(first);
  expect(patternImage(recipe, 844, 390, 3)).not.toBe(first);
  expect(patternImage({ shapes: [] }, 390, 844, 3)).not.toBe(first);
  await Promise.all([patternImage(recipe, 390, 844, 2), patternImage(recipe, 844, 390, 3), patternImage({ shapes: [] }, 390, 844, 3)]);
  for (let width = 100; width < 110; width++) await patternImage(recipe, width, 200, 1);
  expect(patternImage(recipe, 390, 844, 3)).not.toBe(first);
});

test('failed background jobs can retry without retaining a rejected cached promise', async () => {
  requests.mockResolvedValueOnce(JSON.stringify({ ok: false, error: 'Invalid recipe' }));
  await expect(patternImage(recipe, 313, 651, 2)).rejects.toThrow('Invalid recipe');
  expect(await patternImage(recipe, 313, 651, 2)).toBe('data:image/png;base64,313x651');
});

test('native backgrounds are noninteractive, hidden from accessibility, and update after rotation', async () => {
  const container = document.createElement('div');
  const root = dom.createRoot(container);
  try {
    await act(async () => root.render(<NPattern recipe={recipe} width={320} height={720} />));
    let image = JSON.parse(container.querySelector('img')!.getAttribute('data-props')!);
    expect(image.source.uri).toBe('data:image/png;base64,320x720');
    const view = JSON.parse(container.querySelector('div')!.getAttribute('data-props')!);
    expect(view.pointerEvents).toBe('none');
    expect(view.accessible).toBe(false);
    expect(view.importantForAccessibility).toBe('no-hide-descendants');
    expect(image.fadeDuration).toBe(0);
    await act(async () => root.render(<NPattern recipe={recipe} width={720} height={320} />));
    image = JSON.parse(container.querySelector('img')!.getAttribute('data-props')!);
    expect(image.source.uri).toBe('data:image/png;base64,720x320');
  } finally {
    await act(async () => root.unmount());
  }
});
