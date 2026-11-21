import { beforeEach, expect, mock, test } from 'bun:test';
import type { ComponentNode } from '../types';

const commands: Record<string, unknown>[] = [];
let revision = 0;
mock.module('../../native/NativeNayanEngine', () => ({
  default: {
    drawingCreate: () => 1,
    drawingDestroy() {},
    drawingCommand: (_id: number, text: string) => {
      const command = JSON.parse(text);
      commands.push(command);
      const value =
        command.action === 'value'
          ? { partial: true, revision: ++revision, nodes: [{ id: command.id, value: command.value }], events: [] }
          : command.snapshot === false
            ? null
            : { revision, nodes: [], events: [] };
      return JSON.stringify({ ok: true, value });
    }
  }
}));
mock.module('../../assets/source', () => ({ imageAssetSource: (source: unknown) => source }));
const { ComponentDocument } = await import('../ComponentDocument');
const form = (value: string, label = 'Name'): ComponentNode[] => [
  {
    id: 'wrapper',
    kind: 'NView',
    props: {},
    children: [
      { id: 'field', kind: 'NInput', props: { value, label }, children: [] },
      { id: 'button', kind: 'NButton', props: { label: 'Save' }, children: [] }
    ]
  }
];
beforeEach(() => {
  commands.length = 0;
});

test('typing and matching controlled echoes need one compact transaction per change', () => {
  const doc = new ComponentDocument();
  doc.setTree(form(''));
  commands.length = 0;
  for (const text of ['A', 'AB', 'AB👋', '日本', '']) {
    doc.edit('field', text, true);
    doc.setTree(form(text));
  }
  expect(commands).toHaveLength(5);
  expect(commands.every((command) => command.action === 'value' && command.compact === true)).toBe(true);
  doc.dispose();
});

test('external resets, rejected edits and other UI changes still reach Rust', () => {
  const doc = new ComponentDocument();
  doc.setTree(form(''));
  commands.length = 0;
  doc.edit('field', 'rejected', true);
  doc.setTree(form(''));
  expect(commands.at(-1)).toMatchObject({ action: 'tree', snapshot: false });
  doc.edit('field', 'accepted', true);
  doc.setTree(form('accepted', 'Changed label'));
  expect(commands.at(-1)).toMatchObject({ action: 'tree', snapshot: false });
  commands.length = 0;
  doc.setTree(form('accepted', 'Changed label'));
  expect(commands).toHaveLength(0);
  doc.setTree(form('reset'));
  expect(commands).toHaveLength(1);
  expect(JSON.stringify(commands[0])).toContain('reset');
  doc.dispose();
});

test('uncontrolled draft callbacks and repeated identical renders do not resend a tree', () => {
  const doc = new ComponentDocument();
  const draft: ComponentNode[] = [{ id: 'field', kind: 'NInput', props: { defaultValue: 'Hello' }, children: [] }];
  doc.setTree(draft);
  commands.length = 0;
  doc.edit('field', 'Hello world', true);
  doc.setTree(structuredClone(draft));
  expect(commands).toHaveLength(1);
  expect(commands[0]?.action).toBe('value');
  doc.dispose();
});

test('switching away from a controlled value is a real tree change', () => {
  const doc = new ComponentDocument();
  doc.setTree(form('A'));
  doc.edit('field', 'AB', true);
  commands.length = 0;
  const next = form('A');
  delete next[0]!.children[0]!.props.value;
  doc.setTree(next);
  expect(commands).toHaveLength(1);
  expect(commands[0]?.action).toBe('tree');
  doc.dispose();
});
