import { type PointerEvent, useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import type { ComponentDocument } from './ComponentDocument';
import type { ComponentSnapshot } from './types';

/** Platform pointer routing and clipboard mirror only. Rust owns ranges, glyph hit tests and highlights. */
export function useTextSelection(document: ComponentDocument, snapshot: ComponentSnapshot, active: boolean) {
  const host = useRef<HTMLDivElement>(null);
  const mirror = useRef<HTMLSpanElement>(null);
  const selected = useRef('');
  const revision = useRef(-1);
  const dragging = useRef(false);
  const copied = useRef(-1);
  const editing = () => window.document.activeElement?.matches('input,textarea,select,[contenteditable="true"]');
  const synchronize = useCallback((value: { text: string; revision: number }) => {
    if (value.revision < revision.current || !mirror.current) return;
    revision.current = value.revision;
    if (value.text === selected.current) return;
    const selection = window.getSelection();
    const owned = selection?.anchorNode && mirror.current.contains(selection.anchorNode);
    selected.current = value.text;
    mirror.current.textContent = value.text;
    if (!value.text) {
      if (owned) selection?.removeAllRanges();
    } else if (!editing()) {
      const range = window.document.createRange();
      range.selectNodeContents(mirror.current);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, []);
  const command = useCallback(
    (value: Parameters<ComponentDocument['selectText']>[0]) => {
      if (document.isDisposed) return { handled: false, text: '', revision: -1 };
      const result = document.selectText(value);
      synchronize(result);
      return result;
    },
    [document, synchronize]
  );

  useLayoutEffect(() => {
    synchronize({ text: snapshot.selectionText ?? '', revision: snapshot.revision });
  }, [snapshot.selectionText, snapshot.revision, synchronize]);
  useLayoutEffect(() => {
    if (!active) command({ phase: 'clear' });
  }, [active, command]);

  useEffect(() => {
    const owns = (target: EventTarget | null) => {
      if (!active || !host.current?.getClientRects().length || editing()) return false;
      const dialog = window.document.querySelector('dialog[open]');
      if (dialog && !dialog.contains(host.current)) return false;
      return target instanceof window.Node && (host.current.contains(target) || target === window.document.body);
    };
    const key = (event: KeyboardEvent) => {
      if (event.defaultPrevented || !owns(event.target)) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'a') {
        if (command({ phase: 'all' }).handled) event.preventDefault();
      } else if (event.key === 'Escape' && selected.current) {
        command({ phase: 'clear' });
        event.preventDefault();
      }
    };
    const copy = (event: ClipboardEvent) => {
      if (!owns(event.target) || !selected.current || !event.clipboardData) return;
      const text = command({ phase: 'copy' }).text;
      if (text) {
        event.clipboardData.setData('text/plain', text);
        event.preventDefault();
      }
    };
    const changed = () => {
      const selection = window.getSelection();
      if (selected.current && !mirror.current?.contains(selection?.anchorNode ?? null)) command({ phase: 'clear' });
    };
    const outside = (event: globalThis.PointerEvent) => {
      if (event.button === 0 && event.target instanceof window.Node && !host.current?.contains(event.target) && selected.current)
        command({ phase: 'clear' });
    };
    const dom = window.document;
    dom.addEventListener('keydown', key);
    dom.addEventListener('copy', copy);
    dom.addEventListener('selectionchange', changed);
    dom.addEventListener('pointerdown', outside);
    return () => {
      dom.removeEventListener('keydown', key);
      dom.removeEventListener('copy', copy);
      dom.removeEventListener('selectionchange', changed);
      dom.removeEventListener('pointerdown', outside);
      const selection = window.getSelection();
      if (mirror.current?.contains(selection?.anchorNode ?? null)) selection?.removeAllRanges();
    };
  }, [active, command]);

  const point = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  };
  const consume = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) document.dispatch({ action: 'cancel' });
    dragging.current = true;
    event.preventDefault();
    event.stopPropagation();
  };
  return {
    host,
    mirror,
    copyEvents: (snapshot: ComponentSnapshot) => {
      for (const event of snapshot.events) {
        if (event.type !== 'copy' || event.sequence <= copied.current) continue;
        copied.current = event.sequence;
        const fallback = () => window.document.execCommand('copy');
        if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(String(event.value ?? '')).catch(fallback);
        else fallback();
      }
    },
    onPointerDownCapture: (event: PointerEvent<HTMLDivElement>) => {
      if (!active || event.button !== 0) return;
      dragging.current = false;
      if (event.target !== host.current?.querySelector('canvas')) {
        command({ phase: 'clear' });
        return;
      }
      if (command({ phase: event.pointerType === 'mouse' ? 'start' : 'touchStart', ...point(event), extend: event.shiftKey }).handled) {
        consume(event);
        event.currentTarget.setPointerCapture(event.pointerId);
      }
    },
    onPointerMoveCapture: (event: PointerEvent<HTMLDivElement>) => {
      if (editing()) return;
      if (active && event.buttons === 1 && command({ phase: event.pointerType === 'mouse' ? 'move' : 'touchMove', ...point(event) }).handled)
        consume(event);
    },
    onPointerUpCapture: (event: PointerEvent<HTMLDivElement>) => {
      if (editing()) return;
      if (active && event.button === 0 && command({ phase: event.pointerType === 'mouse' ? 'end' : 'touchEnd', ...point(event) }).handled)
        consume(event);
      dragging.current = false;
    },
    onPointerCancelCapture: () => {
      dragging.current = false;
      command({ phase: 'clear' });
    },
    onClickCapture: (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.target !== host.current?.querySelector('canvas') || event.detail < 2) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      if (command({ phase: event.detail >= 3 ? 'block' : 'word', x: event.clientX - bounds.left, y: event.clientY - bounds.top }).handled) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    onContextMenuCapture: (event: React.MouseEvent<HTMLDivElement>) => {
      if (!active || !selected.current || event.target !== host.current?.querySelector('canvas')) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      if (command({ phase: 'menu', x: event.clientX - bounds.left, y: event.clientY - bounds.top }).handled) event.preventDefault();
    }
  };
}
