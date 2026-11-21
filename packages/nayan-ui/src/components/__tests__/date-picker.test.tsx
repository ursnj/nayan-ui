import { expect, mock, test } from 'bun:test';
import { NDatePicker } from '../NDatePicker';
import { createComponentRenderer } from '../reconciler';
import type { ComponentNode } from '../types';

const flush = () => new Promise((resolve) => setTimeout(resolve, 30));
test('calendar dates cross the bridge as local days and callbacks restore local midnight', async () => {
  let nodes: ComponentNode[] = [];
  const change = mock((_date: Date) => {});
  const renderer = createComponentRenderer(
    (next) => {
      nodes = next;
    },
    (error) => {
      throw error;
    }
  );
  try {
    renderer.render(<NDatePicker id="birthday" value={new Date(2000, 1, 29, 23, 59)} minimumDate={new Date(1900, 0, 1)} onChange={change} />);
    await flush();
    expect(nodes[0]?.props.value).toBe('2000-02-29');
    expect(nodes[0]?.props.minimumDate).toBe('1900-01-01');
    expect(nodes[0]?.props.onChange).toBeUndefined();
    const callback = renderer.handlers.get('birthday')?.onChange;
    if (typeof callback !== 'function') throw new Error('Missing calendar callback');
    callback('2024-02-29');
    const date = change.mock.calls[0]?.[0];
    expect(date?.getFullYear()).toBe(2024);
    expect(date?.getMonth()).toBe(1);
    expect(date?.getDate()).toBe(29);
    expect(date?.getHours()).toBe(0);
  } finally {
    renderer.dispose();
    await flush();
  }
});

test('invalid dates and reversed constraints are rejected before reaching the native calendar', () => {
  expect(() => NDatePicker({ value: new Date(NaN) })).toThrow(RangeError);
  expect(() => NDatePicker({ minimumDate: new Date(2025, 0, 1), maximumDate: new Date(2024, 0, 1) })).toThrow(RangeError);
});
