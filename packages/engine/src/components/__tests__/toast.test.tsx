import { afterAll, beforeEach, expect, mock, test } from 'bun:test';
import { createTestCore } from '../../native/__tests__/core';
import { createComponentRenderer } from '../reconciler';
import type { ComponentNode } from '../types';

const core = await createTestCore();
mock.module('../../native/NativeNayanEngine', () => ({ default: core }));
mock.module('../../native/prepare', () => ({ prepareEngine: () => undefined }));
const { NToast, performToastAction, toastStore } = await import('../toastService');
const { NToastContent } = await import('../NToastContent');
const flush = () => Bun.sleep(35);
beforeEach(async () => {
  NToast.clear();
  await flush();
});
afterAll(async () => {
  NToast.clear();
  await flush();
});

test('simple strings, status options and legacy titles use the same Rust queue', async () => {
  NToast.success('Saved', { title: 'Profile', duration: 0 });
  NToast.error('Try again', 'Upload failed');
  await flush();
  expect(toastStore.getSnapshot().toast).toMatchObject({ message: 'Saved', title: 'Profile', type: 'success', duration: 0 });
  expect(toastStore.getSnapshot().wakeAfter).toBeNull();
  NToast.dismiss();
  await flush();
  expect(toastStore.getSnapshot().toast).toMatchObject({ message: 'Try again', title: 'Upload failed', type: 'error' });
  expect(toastStore.getSnapshot().wakeAfter).toBeGreaterThan(3500);
  NToast.show('Another message', { duration: 0 });
  NToast.dismiss();
  await flush();
  expect(toastStore.getSnapshot().toast?.message).toBe('Another message');
});

test('compact and legacy actions execute once and promote the next message', async () => {
  const undo = mock(() => {});
  NToast.show('Deleted', { duration: 0, action: { label: 'Undo', onPress: undo } });
  NToast.info('Next', { duration: 0 });
  await flush();
  const toast = toastStore.getSnapshot().toast!;
  expect(toast.actionLabel).toBe('Undo');
  expect('action' in toast).toBe(false);
  performToastAction(toast.id);
  performToastAction(toast.id);
  await flush();
  expect(undo).toHaveBeenCalledTimes(1);
  expect(toastStore.getSnapshot().toast?.message).toBe('Next');
  NToast.clear();
  NToast.show({ message: 'Legacy', duration: 0, actionLabel: 'Retry', onActionPress: undo });
  await flush();
  performToastAction(toastStore.getSnapshot().toast!.id);
  await flush();
  expect(undo).toHaveBeenCalledTimes(2);
  expect(toastStore.getSnapshot().toast).toBeNull();
});

test('toast content keeps message text neutral and exposes status, action and dismiss controls', async () => {
  const action = mock(() => {});
  NToast.error('Could not upload your image.', { title: 'Upload failed', duration: 0, action: { label: 'Retry', onPress: action } });
  await flush();
  let nodes: ComponentNode[] = [];
  const renderer = createComponentRenderer(
    (value) => {
      nodes = value;
    },
    (error) => {
      throw error;
    }
  );
  const all = (items = nodes): ComponentNode[] => items.flatMap((node) => [node, ...all(node.children)]);
  try {
    renderer.render(<NToastContent toast={toastStore.getSnapshot().toast!} />);
    await flush();
    const message = all().find(
      (node) => node.kind === 'NText' && node.children.some((child) => child.props.text === 'Could not upload your image.')
    )!;
    expect(message.props.className).toContain('text-foreground');
    expect(message.props.className).not.toContain('text-danger');
    expect(all().find((node) => node.kind === 'NIcon' && node.props.name === 'circle-x')?.props.className).toBe('text-danger');
    const retry = all().find((node) => node.props.accessibilityLabel === 'Retry')!;
    const press = renderer.handlers.get(retry.id)?.onPress as () => void;
    press();
    await flush();
    expect(action).toHaveBeenCalledTimes(1);
    expect(toastStore.getSnapshot().toast).toBeNull();
    expect(all().some((node) => node.props.accessibilityLabel === 'Dismiss notification')).toBe(true);
    renderer.render(<NToastContent toast={{ id: 10, message: 'Working', dismissible: false }} />);
    await flush();
    expect(all().some((node) => node.props.accessibilityLabel === 'Dismiss notification')).toBe(false);
  } finally {
    renderer.dispose();
    await flush();
  }
});
