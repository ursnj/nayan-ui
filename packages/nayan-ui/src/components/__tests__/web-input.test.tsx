import { act } from 'react';
import { afterAll, expect, mock, test } from 'bun:test';
import { installDom } from '../../__tests__/dom';
import type { ComponentDocument } from '../ComponentDocument';
import type { ComponentSemantic, ComponentSnapshot } from '../types';

mock.module('../../native/surface/DocumentSurface.web', () => ({ DocumentSurface: () => <canvas /> }));
const dom = installDom();
const { createRoot } = await import('react-dom/client');
const { ComponentHost } = await import('../ComponentHost.web');
afterAll(() => dom.cleanup());

const field = (multiline = false): ComponentSemantic => ({
  id: 'name',
  kind: multiline ? 'NTextarea' : 'NInput',
  value: '',
  label: 'Name',
  rect: [10, 20, 200, 48],
  platformEdit: false,
  disabled: false,
  readOnly: false,
  secret: false,
  multiline,
  maxLength: 300,
  inputType: 'text',
  min: 0,
  max: 0,
  step: 1,
  editor: {
    color: '#123456',
    placeholderColor: '#777777',
    placeholder: 'Name...',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    padding: [10, 12, 10, 12],
    textAlign: 'left'
  }
});

test('browser fields keep direct editing, selection and composition without cursor engine calls', async () => {
  for (const multiline of [false, true]) {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    const node = field(multiline);
    const dispatch = mock((_command: Record<string, unknown>) => {});
    const selectKey = mock(() => false);
    const edit = mock((_id: string, value: string, _platform: boolean): ComponentSnapshot => ({
      partial: true,
      revision: 2,
      nodes: [{ ...node, value, platformEdit: true }],
      events: []
    }));
    const handle = {
      id: 1,
      request: () => {},
      dispatch,
      edit,
      selectKey,
      selectText: () => ({ handled: false, text: '', revision: 1 })
    } as unknown as ComponentDocument;
    const accepted = mock((_snapshot: ComponentSnapshot) => {});
    const render = async (next: ComponentSemantic) =>
      act(() => root.render(<ComponentHost document={handle} snapshot={{ revision: 1, nodes: [next], events: [] }} onSnapshot={accepted} />));
    try {
      await render(node);
      const input = container.querySelector<HTMLInputElement | HTMLTextAreaElement>('input,textarea')!;
      expect(input.style.opacity).toBe('1');
      expect(input.placeholder).toBe('Name...');
      expect(input.maxLength).toBe(300);
      await act(() => input.focus());
      dispatch.mockClear();
      const prototype = multiline ? dom.window.HTMLTextAreaElement.prototype : dom.window.HTMLInputElement.prototype;
      const nativeValue = Object.getOwnPropertyDescriptor(prototype, 'value')!.set!;
      await act(() => {
        input.dispatchEvent(new window.CompositionEvent('compositionstart', { bubbles: true }));
        nativeValue.call(input, '日本👋');
        input.dispatchEvent(new window.Event('input', { bubbles: true }));
      });
      expect(input.value).toBe('日本👋');
      expect(edit).toHaveBeenCalledWith('name', '日本👋', true);
      expect(accepted).toHaveBeenCalledTimes(1);
      input.setSelectionRange(2, 4);
      await act(() => input.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true })));
      expect(selectKey).not.toHaveBeenCalled();
      expect(dispatch).not.toHaveBeenCalled();
      await render({ ...node, platformEdit: true, editor: { ...node.editor!, fontSize: 20 } });
      expect(input.value).toBe('日本👋');
      expect(input.selectionStart).toBe(2);
      expect(input.selectionEnd).toBe(4);
      await render({ ...node, value: 'reset' });
      expect(input.value).toBe('reset');
    } finally {
      await act(() => root.unmount());
      container.remove();
    }
  }
});

test('readonly editors allow native selection and popup layers blur and hide underlying inputs', async () => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  const dispatch = mock((_command: Record<string, unknown>) => {});
  const handle = {
    id: 1,
    request: () => {},
    dispatch,
    selectText: () => ({ handled: false, text: '', revision: 1 })
  } as unknown as ComponentDocument;
  const node = { ...field(), value: 'Read me', readOnly: true };
  const render = async (nodes: ComponentSemantic[]) =>
    act(() => root.render(<ComponentHost document={handle} snapshot={{ revision: 1, nodes, events: [] }} onSnapshot={() => {}} />));
  try {
    await render([node]);
    dispatch.mockClear();
    const input = container.querySelector('input')!;
    await act(() => input.focus());
    input.setSelectionRange(0, 4);
    expect(input.selectionEnd).toBe(4);
    expect(dispatch).not.toHaveBeenCalled();
    await render([{ ...node, readOnly: false }]);
    const calendar = { ...node, id: 'date', kind: 'NDatePicker' };
    await render([{ ...node, readOnly: false }, calendar, { ...node, id: 'date:day', kind: 'NButton' }]);
    expect(document.activeElement).not.toBe(input);
    expect(input.tabIndex).toBe(-1);
    expect(input.getAttribute('aria-hidden')).toBe('true');
    expect(input.parentElement!.style.opacity).toBe('0');
  } finally {
    await act(() => root.unmount());
    container.remove();
  }
});
