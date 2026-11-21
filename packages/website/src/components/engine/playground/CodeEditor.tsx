import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { CodeText } from '@/components/helpers/Code';
import type { Completion } from './compiler';

interface Props {
  code: string;
  onChange: (code: string) => void;
  onRun: (code: string) => void;
  onComplete: (code: string, position: number) => Promise<Completion[]>;
}

export default function CodeEditor({ code, onChange, onRun, onComplete }: Props) {
  const input = useRef<HTMLTextAreaElement>(null);
  const highlight = useRef<HTMLPreElement>(null);
  const sequence = useRef(0);
  const listId = useId();
  const [suggestions, setSuggestions] = useState<{ code: string; items: Completion[]; index: number } | null>(null);
  const active = suggestions?.code === code ? suggestions : null;

  function dismiss() {
    sequence.current++;
    setSuggestions(null);
  }

  async function complete(element: HTMLTextAreaElement) {
    const { value, selectionStart, selectionEnd } = element;
    if (selectionStart !== selectionEnd) return;
    const request = ++sequence.current;
    try {
      const items = await onComplete(value, selectionStart);
      if (
        request === sequence.current &&
        document.activeElement === element &&
        element.value === value &&
        element.selectionStart === selectionStart &&
        element.selectionEnd === selectionEnd
      ) {
        setSuggestions(items.length ? { code: value, items, index: 0 } : null);
      }
    } catch {
      if (request === sequence.current) dismiss();
    }
  }

  function insert({ text, start, end }: Completion) {
    const element = input.current;
    if (!element) return;
    element.setRangeText(text, start, end, 'end');
    dismiss();
    onChange(element.value);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.nativeEvent.isComposing) return;
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      dismiss();
      onRun(event.currentTarget.value);
    } else if ((event.metaKey || event.ctrlKey) && event.code === 'Space') {
      event.preventDefault();
      void complete(event.currentTarget);
    } else if (active && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      event.preventDefault();
      const offset = event.key === 'ArrowDown' ? 1 : -1;
      const index = (active.index + offset + active.items.length) % active.items.length;
      setSuggestions({ ...active, index });
    } else if (active && event.key === 'Enter') {
      event.preventDefault();
      insert(active.items[active.index]!);
    } else if (['Escape', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      dismiss();
    }
  }

  return (
    <div className="site-code-block site-code-editor" data-code-embedded>
      <pre ref={highlight} className="site-code-editor-highlight" aria-hidden="true">
        <CodeText code={`${code}\n`} />
      </pre>
      <textarea
        ref={input}
        aria-label="Playground source code"
        aria-autocomplete="list"
        aria-controls={active ? listId : undefined}
        aria-activedescendant={active ? `${listId}-${active.index}` : undefined}
        className="site-code-editor-input"
        value={code}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        wrap="off"
        onChange={(event) => {
          const element = event.currentTarget;
          onChange(element.value);
          dismiss();
          if (
            !('isComposing' in event.nativeEvent && event.nativeEvent.isComposing) &&
            /\.[\w$]*$/.test(element.value.slice(0, element.selectionStart))
          )
            void complete(element);
        }}
        onBlur={dismiss}
        onClick={dismiss}
        onKeyDown={onKeyDown}
        onScroll={({ currentTarget }) => {
          if (highlight.current) highlight.current.scrollTo(currentTarget.scrollLeft, currentTarget.scrollTop);
        }}
      />
      {active && (
        <ul id={listId} role="listbox" aria-label="Code suggestions" className="site-code-suggestions">
          {active.items.map((item, index) => (
            <li
              key={index}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === active.index}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => insert(item)}
            >
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
