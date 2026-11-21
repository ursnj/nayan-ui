import { expect, mock, test } from 'bun:test';
import { KeyboardStore } from '../keyboardStore';

test('focus traversal follows the full Rust field order, including offscreen fields', () => {
  const dismiss = mock(() => {});
  const focus = mock((_id: string) => {});
  const store = new KeyboardStore(dismiss);
  const group = Symbol();
  const unregister = store.register(group, focus);
  store.update(group, ['name', 'mobile', 'about']);
  store.didFocus(group, 'name');
  expect(store.getSnapshot()).toMatchObject({ focusedInput: 'name', hasPrevious: false, hasNext: true });
  expect(store.focusPrevious()).toBe(false);
  expect(store.focusNext()).toBe(true);
  expect(focus).toHaveBeenLastCalledWith('mobile');
  // The old OS editor may blur after the destination has been selected.
  store.didBlur(group, 'name');
  expect(store.getSnapshot().focusedInput).toBe('mobile');
  expect(store.focusNext()).toBe(true);
  expect(store.focusNext()).toBe(false);
  expect(store.getSnapshot()).toMatchObject({ focusedInput: 'about', hasPrevious: true, hasNext: false });
  expect(store.focusPrevious()).toBe(true);
  expect(store.focus('name')).toBe(true);
  expect(store.focus('missing')).toBe(false);
  unregister();
  expect(store.getSnapshot().focusedInput).toBeNull();
  expect(store.focusNext()).toBe(false);
});

test('separate screen scopes never move or dismiss each other’s editors', () => {
  const a = new KeyboardStore(mock(() => {}));
  const bDismiss = mock(() => {});
  const b = new KeyboardStore(bDismiss);
  const group = Symbol();
  const unregister = a.register(
    group,
    mock(() => {})
  );
  a.update(group, ['same-id']);
  a.didFocus(group, 'same-id');
  b.register(
    group,
    mock(() => {})
  );
  b.update(group, ['same-id']);
  b.didFocus(group, 'same-id');
  unregister();
  expect(b.getSnapshot().focusedInput).toBe('same-id');
  expect(bDismiss).not.toHaveBeenCalled();
});

test('disabling or removing the active field dismisses it and transitions are bounded', () => {
  const dismiss = mock(() => {});
  const store = new KeyboardStore(dismiss);
  const group = Symbol();
  const listener = mock(() => {});
  const unsubscribe = store.subscribe(listener);
  store.register(group, () => {});
  store.update(group, ['name']);
  store.didFocus(group, 'name');
  store.setKeyboard(true, 320);
  listener.mockClear();
  const before = store.getSnapshot();
  for (let index = 0; index < 100; index++) {
    store.setKeyboard(true, 320);
    store.update(group, ['name']);
  }
  expect(store.getSnapshot()).toBe(before);
  expect(listener).not.toHaveBeenCalled();
  store.update(group, []);
  expect(dismiss).toHaveBeenCalledTimes(1);
  expect(store.getSnapshot().focusedInput).toBeNull();
  store.dismiss();
  expect(store.getSnapshot()).toMatchObject({ visible: false, height: 0 });
  store.setKeyboard(true, NaN);
  expect(store.getSnapshot().height).toBe(0);
  unsubscribe();
});
