import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { NView } from '@nayan-ui/engine/components';
import { CodeText } from '@/components/helpers/Code';
import type { Completion } from './compiler';

const editorLayer =
  'absolute inset-0 m-0 h-full w-full rounded-none border-0 px-4 py-3 font-mono text-[13px] leading-[1.62] whitespace-pre [letter-spacing:normal] [tab-size:2] [scrollbar-width:thin]';

interface Props {
  label?: string;
  code: string;
  onChange: (code: string) => void;
  onRun: (code: string) => void;
  onComplete: (code: string, position: number) => Promise<Completion[]>;
}

export default function CodeEditor({ label = 'Playground source code', code, onChange, onRun, onComplete }: Props) {
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
    <NView tag="div" className="site-code-block site-code-editor relative h-full" data-code-embedded>
      <NView tag="pre" ref={highlight} className={`site-code-editor-highlight pointer-events-none overflow-hidden ${editorLayer}`} aria-hidden="true">
        <CodeText code={`${code}\n`} />
      </NView>
      <NView
        tag="textarea"
        ref={input}
        aria-label={label}
        aria-autocomplete="list"
        aria-controls={active ? listId : undefined}
        aria-activedescendant={active ? `${listId}-${active.index}` : undefined}
        className={`site-code-editor-input resize-none overflow-auto bg-transparent text-transparent [caret-color:var(--code-fg)] focus-visible:[outline-offset:-2px] ${editorLayer}`}
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
        <NView
          tag="ul"
          id={listId}
          role="listbox"
          aria-label="Code suggestions"
          className="site-code-suggestions absolute right-3 bottom-3 z-[1] max-h-[min(12rem,48%)] min-w-[min(15rem,90%)] max-w-[calc(100%-1.5rem)] overflow-auto rounded-lg border border-[var(--code-line)] bg-[var(--code-bg)] font-mono text-[13px] shadow-md"
        >
          {active.items.map((item, index) => (
            <NView
              tag="li"
              key={index}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === active.index}
              className={`cursor-pointer px-2.5 py-1 hover:bg-[var(--code-header)] ${index === active.index ? 'bg-[var(--code-header)]' : ''}`}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => insert(item)}
            >
              {item.label}
            </NView>
          ))}
        </NView>
      )}
    </NView>
  );
}
