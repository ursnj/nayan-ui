import { act, type PropsWithChildren, useContext, useEffect } from 'react';
import { afterAll, expect, mock, spyOn, test } from 'bun:test';
import { installDom } from '../../__tests__/dom';
import { NScrollView } from '../NScrollView';
import { SafeAreaInsetsContext } from '../safeAreaContext';
import { PageContentInsetsContext, PageContext } from '../theme/contexts';

const Box = ({ children }: PropsWithChildren) => <div>{children}</div>;
mock.module('../PageHost', () => ({ PageHost: Box }));
mock.module('../ComponentsRoot', () => ({ ComponentsRoot: Box }));
mock.module('../NView', () => ({
  NView: ({ children, ...props }: PropsWithChildren<Record<string, unknown>>) => <div data-view={JSON.stringify(props)}>{children}</div>
}));
const { NPage } = await import('../NPage');
const dom = installDom();
const { createRoot } = await import('react-dom/client');
afterAll(() => dom.cleanup());

function Sheet({ id }: { id: string }) {
  const page = useContext(PageContext)!;
  useEffect(() => {
    page.portal(id, <input aria-label={id} defaultValue={id} />);
    return () => page.portal(id, null);
  }, [page, id]);
  return null;
}

test('page sheets keep their identity and input when an earlier sheet closes, without missing-key warnings', async () => {
  const node = document.createElement('div');
  const root = createRoot(node);
  const errors = spyOn(console, 'error').mockImplementation(() => {});
  const render = (first: boolean) => (
    <NPage>
      {first && <Sheet key="first" id="first" />}
      <Sheet key="second" id="second" />
    </NPage>
  );
  try {
    await act(() => root.render(render(true)));
    const second = node.querySelector<HTMLInputElement>('[aria-label="second"]')!;
    second.value = 'retained sheet input';
    await act(() => root.render(render(false)));
    expect(node.querySelector('[aria-label="first"]')).toBeNull();
    expect(node.querySelector('[aria-label="second"]')).toBe(second);
    expect(second.value).toBe('retained sheet input');
    expect(
      errors.mock.calls
        .flat()
        .map(String)
        .filter((message) => /unique.*key|same key/i.test(message))
    ).toEqual([]);
  } finally {
    await act(() => root.unmount());
    errors.mockRestore();
  }
});

function InsetProbe({ name }: { name: string }) {
  const area = useContext(PageContentInsetsContext);
  return <span data-probe={name}>{JSON.stringify(area)}</span>;
}

test('NPage transports the measured bottom inset without padding its native host and supports opt-out', async () => {
  const node = document.createElement('div');
  const root = createRoot(node);
  const render = (bottom: number, safeArea = true) => (
    <SafeAreaInsetsContext.Provider value={{ top: 62, right: 0, bottom, left: 0 }}>
      <NPage safeArea={safeArea}>
        <InsetProbe name="content" />
      </NPage>
    </SafeAreaInsetsContext.Provider>
  );
  try {
    await act(() => root.render(render(34)));
    let props = JSON.parse(node.querySelector('[data-view]')!.getAttribute('data-view')!);
    expect(props.pageSafeArea.insets.bottom).toBe(34);
    expect(props.pageSafeArea.edges).toEqual({ bottom: 'maximum' });
    expect(props.style).toBeUndefined();
    await act(() => root.render(render(0)));
    props = JSON.parse(node.querySelector('[data-view]')!.getAttribute('data-view')!);
    expect(props.pageSafeArea.insets.bottom).toBe(0);
    await act(() => root.render(render(34, false)));
    expect(node.querySelector('[data-probe]')!.textContent).toBe('null');
  } finally {
    await act(() => root.unmount());
  }
});

test('scroll content consumes the page inset once, leaving nested content unmodified', async () => {
  const node = document.createElement('div');
  const root = createRoot(node);
  try {
    await act(() =>
      root.render(
        <SafeAreaInsetsContext.Provider value={{ top: 0, right: 0, bottom: 34, left: 0 }}>
          <NPage>
            <InsetProbe name="page" />
            <NScrollView contentContainerClassName="p-3">
              <InsetProbe name="nested" />
            </NScrollView>
          </NPage>
        </SafeAreaInsetsContext.Provider>
      )
    );
    expect(JSON.parse(node.querySelector('[data-probe="page"]')!.textContent!).insets.bottom).toBe(34);
    expect(node.querySelector('[data-probe="nested"]')!.textContent).toBe('null');
    const views = Array.from(node.querySelectorAll('[data-view]')).map((n) => JSON.parse(n.getAttribute('data-view')!));
    expect(views.filter((n) => n.pageScrollContent === true)).toHaveLength(1);
  } finally {
    await act(() => root.unmount());
  }
});
