import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ComponentDocument } from './ComponentDocument';
import { KeyboardContext } from './theme/contexts';
import type { ComponentSemantic, ComponentSnapshot } from './types';
interface Editor {
  focus(): void;
}

/** Platform editor refs only; Rust owns field eligibility, order and scrolling. */
export function useKeyboardFields(document: ComponentDocument, snapshot: ComponentSnapshot) {
  const controller = useContext(KeyboardContext);
  const group = useRef(Symbol('keyboard-fields')).current;
  const editors = useRef(new Map<string, Editor>());
  const pending = useRef<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const focusedEditor = useRef<string | null>(null);
  const ids =
    snapshot.inputFields ??
    snapshot.nodes
      .filter((node) => ['NInput', 'NTextarea', 'NSearchField', 'NInputOtp'].includes(node.kind) && !node.disabled && !node.readOnly)
      .map((node) => node.id);
  const signature = JSON.stringify(ids);
  useEffect(
    () =>
      controller?.register(group, (id) => {
        if (document.isDisposed) return;
        pending.current = id;
        document.dispatch({ action: 'focusInput', id });
        const editor = editors.current.get(id);
        if (editor) {
          pending.current = null;
          editor.focus();
        }
      }),
    [controller, group, document]
  );
  useEffect(() => {
    controller?.update(group, JSON.parse(signature) as string[]);
    if (focusedEditor.current) controller?.didFocus(group, focusedEditor.current);
  }, [controller, group, signature]);
  const bind = useCallback((id: string, editor: Editor) => {
    editors.current.set(id, editor);
    if (pending.current === id) {
      pending.current = null;
      editor.focus();
    }
    return () => {
      if (editors.current.get(id) === editor) editors.current.delete(id);
    };
  }, []);
  const focus = useCallback(
    (id: string) => {
      focusedEditor.current = id;
      setFocused(id);
      controller?.didFocus(group, id);
      if (!document.isDisposed) document.dispatch({ action: 'focusInput', id });
    },
    [controller, document, group]
  );
  const blur = useCallback(
    (id: string) => {
      if (focusedEditor.current === id) focusedEditor.current = null;
      setFocused((previous) => (previous === id ? null : previous));
      controller?.didBlur(group, id);
    },
    [controller, group]
  );
  const submit = useCallback(() => {
    if (!controller) return false;
    if (!controller.focusNext()) controller.dismiss();
    return true;
  }, [controller]);
  const reveal = useCallback(() => {
    const id = controller?.getSnapshot().focusedInput;
    if (id && editors.current.has(id) && !document.isDisposed) document.dispatch({ action: 'focusInput', id });
  }, [controller, document]);
  // Keep a focused OS editor alive if its Rust field scrolls outside the viewport.
  // It must not steal taps or screen-reader focus from content now occupying its old rect.
  const retained = useRef<ComponentSemantic | null>(null);
  const active = focused;
  if (retained.current?.id !== active) retained.current = null;
  const visible = snapshot.nodes.find((node) => node.id === active);
  if (visible) retained.current = visible;
  if (!active || !ids.includes(active)) retained.current = null;
  const nodes =
    retained.current && !visible
      ? [...snapshot.nodes, { ...retained.current, rect: [-10000, 0, 1, 1] as ComponentSemantic['rect'] }]
      : snapshot.nodes;
  return { bind, focus, blur, submit, reveal, nodes, lastInput: ids.at(-1), hasController: Boolean(controller) };
}
