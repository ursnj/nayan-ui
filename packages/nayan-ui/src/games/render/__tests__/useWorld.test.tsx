import { act } from 'react';
import { afterAll, expect, mock, test } from 'bun:test';
import { installDom } from '../../../__tests__/dom';
import { createTestCore } from '../../../native/__tests__/core';
import type { World } from '../../world/World';

const dom = installDom();
const native = await createTestCore();
mock.module('../../../native/NativeNayanEngine', () => ({ default: native }));
mock.module('react-native', () => ({
  AssetRegistry: { getAssetByID: () => undefined },
  Image: { resolveAssetSource: () => null }
}));
let warmFailure: Error | null = null;
mock.module('../../../native/prepare', () => ({
  prepareEngine: () => (warmFailure ? Promise.reject(warmFailure) : undefined)
}));
const { createRoot } = await import('react-dom/client');
const { useWorld } = await import('../useWorld');
afterAll(() => dom.cleanup());

type Seen = { world: World | null };

function Probe(props: { capacity: number; seen: Seen; setup?: (w: World) => void | (() => void); onError?: (e: Error) => void; deps?: unknown[] }) {
  props.seen.world = useWorld(props.capacity, props.setup, props.deps, props.onError);
  return null;
}

async function render(root: ReturnType<typeof createRoot>, element: React.ReactElement) {
  await act(async () => {
    root.render(element);
  });
}

test('useWorld creates, sets up and disposes a world, and recreates it when deps change', async () => {
  const root = createRoot(dom.window.document.createElement('div') as unknown as HTMLElement);
  const seen: Seen = { world: null };
  const cleanup = mock(() => {});
  const setup = mock((w: World) => {
    w.spawn({ mesh: 'cube', color: '#ff0000' });
    return cleanup;
  });
  await render(root, <Probe capacity={8} seen={seen} setup={setup} deps={['a']} />);
  const first = seen.world!;
  expect(first).not.toBeNull();
  expect(first.capacity).toBe(8);
  expect(first.count).toBe(1);
  expect(setup).toHaveBeenCalledTimes(1);

  // A re-render with a new inline setup keeps the world; new deps replace it.
  await render(root, <Probe capacity={8} seen={seen} setup={(w) => setup(w)} deps={['a']} />);
  expect(seen.world).toBe(first);
  await render(root, <Probe capacity={8} seen={seen} setup={setup} deps={['b']} />);
  expect(cleanup).toHaveBeenCalledTimes(1);
  expect(first.isDisposed).toBe(true);
  const second = seen.world!;
  expect(second).not.toBe(first);

  await act(async () => root.unmount());
  expect(cleanup).toHaveBeenCalledTimes(2);
  expect(second.isDisposed).toBe(true);
});

test('useWorld reports setup and warm-up failures and stays null', async () => {
  const root = createRoot(dom.window.document.createElement('div') as unknown as HTMLElement);
  const seen: Seen = { world: null };
  const errors: string[] = [];
  await render(
    root,
    <Probe
      capacity={4}
      seen={seen}
      setup={() => {
        throw new Error('bad setup');
      }}
      onError={(e) => errors.push(e.message)}
    />
  );
  expect(seen.world).toBeNull();
  expect(errors).toEqual(['bad setup']);
  await act(async () => root.unmount());

  warmFailure = new Error('no GPU');
  const again = createRoot(dom.window.document.createElement('div') as unknown as HTMLElement);
  await render(again, <Probe capacity={4} seen={seen} onError={(e) => errors.push(e.message)} />);
  expect(seen.world).toBeNull();
  expect(errors).toEqual(['bad setup', 'no GPU']);
  await act(async () => again.unmount());
  warmFailure = null;
});
