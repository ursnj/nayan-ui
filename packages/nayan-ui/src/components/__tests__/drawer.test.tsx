import { act } from 'react';
import { afterAll, expect, mock, test } from 'bun:test';
import { installDom } from '../../__tests__/dom';
import type { DrawerHostProps, NDrawerControls } from '../NDrawer';
let host: DrawerHostProps;
mock.module('../DrawerHost', () => ({
  DrawerHost: (props: DrawerHostProps) => {
    host = props;
    return (
      <>
        {props.children}
        {props.drawerContent}
      </>
    );
  }
}));
const { NDrawer, useNDrawer } = await import('../NDrawer');
const dom = installDom();
const { createRoot } = await import('react-dom/client');
afterAll(() => dom.cleanup());
let controls: NDrawerControls;
function Menu() {
  controls = useNDrawer();
  return <span>{controls.isOpen ? 'open' : 'closed'}</span>;
}

test('drawer controls and native gesture requests share state while retaining navigator children', async () => {
  const container = document.createElement('div');
  const root = createRoot(container);
  const changed = mock((_open: boolean) => {});
  // The element itself stays mounted across control and gesture transitions.
  const page = <input defaultValue="retained route state" />;
  try {
    await act(() =>
      root.render(
        <NDrawer drawerContent={<Menu />} onOpenChange={changed}>
          {page}
        </NDrawer>
      )
    );
    const input = container.querySelector('input');
    expect(host!.open).toBe(false);
    await act(() => controls.open());
    expect(host!.open).toBe(true);
    await act(() => host!.onChange(false));
    expect(host!.open).toBe(false);
    await act(() => host!.onChange(true));
    expect(controls.isOpen).toBe(true);
    await act(() => controls.toggle());
    expect(controls.isOpen).toBe(false);
    expect(container.querySelector('input')).toBe(input);
    expect(input?.value).toBe('retained route state');
    expect(changed.mock.calls.map((args) => args[0])).toEqual([true, false, true, false]);
    changed.mockClear();
    await act(() => {
      host!.onChange(true);
      host!.onChange(false);
    });
    expect(changed.mock.calls.map((args) => args[0])).toEqual([true, false]);
    expect(controls.isOpen).toBe(false);
  } finally {
    await act(() => root.unmount());
  }
});

test('controlled parents can decline a gesture and acknowledge its authoritative target', async () => {
  const root = createRoot(document.createElement('div'));
  const changed = mock((_open: boolean) => {});
  try {
    await act(() =>
      root.render(
        <NDrawer isOpen={false} onOpenChange={changed} drawerContent={<Menu />}>
          <div />
        </NDrawer>
      )
    );
    const command = host!.command;
    await act(() => host!.onChange(true));
    expect(changed).toHaveBeenCalledWith(true);
    expect(host!.open).toBe(false);
    expect(host!.command).toBeGreaterThan(command);
    await act(() =>
      root.render(
        <NDrawer isOpen onOpenChange={changed} drawerContent={<Menu />}>
          <div />
        </NDrawer>
      )
    );
    expect(host!.open).toBe(true);
    await act(() => controls.close());
    expect(changed).toHaveBeenLastCalledWith(false);
    expect(host!.open).toBe(true);
  } finally {
    await act(() => root.unmount());
  }
});

test('disabled drawers reject opening and sanitize non-finite dimensions', async () => {
  const root = createRoot(document.createElement('div'));
  const changed = mock((_open: boolean) => {});
  try {
    await act(() =>
      root.render(
        <NDrawer enabled={false} width={NaN} edgeWidth={Infinity} drawerContent={<Menu />} onOpenChange={changed}>
          <div />
        </NDrawer>
      )
    );
    await act(() => controls.open());
    expect(host!.open).toBe(false);
    expect(host!.width).toBe(300);
    expect(host!.edgeWidth).toBe(24);
    expect(changed).not.toHaveBeenCalled();
  } finally {
    await act(() => root.unmount());
  }
});
