import { act, type PropsWithChildren } from 'react';
import { afterAll, expect, mock, test } from 'bun:test';
import { installReactTestEnvironment } from '../../__tests__/dom';
mock.module('../NPlatformView', () => ({ NPlatformView: ({ children }: PropsWithChildren) => <>{children}</> }));
const { NInput } = await import('../NInput.web');
const dom = await installReactTestEnvironment();
afterAll(() => dom.cleanup());

test('file inputs expose browser selection through the engine with typed events and hidden upload hit areas', async () => {
  const container = document.createElement('div');
  const root = dom.createRoot(container);
  const names: string[] = [];
  try {
    await act(() =>
      root.render(
        <NInput
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => names.push(...Array.from(event.target.files ?? []).map((file) => file.name))}
        />
      )
    );
    const input = container.querySelector('input')!;
    expect(input.type).toBe('file');
    expect(input.accept).toBe('image/*');
    expect(input.style.opacity).toBe('0');
    expect(input.style.height).toBe('100%');
    Object.defineProperty(input, 'files', { value: [new File(['image'], 'profile.png', { type: 'image/png' })], configurable: true });
    await act(() => input.dispatchEvent(new Event('change', { bubbles: true })));
    expect(names).toEqual(['profile.png']);
  } finally {
    await act(() => root.unmount());
  }
});
