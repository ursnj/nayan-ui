import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { NView } from 'nayan-ui/components';
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
    <NView
      tag="div"
      className="site-code-block [--code-bg:#fff] [--code-fg:#2b1a43] [--code-header:#f2eafb] [--code-muted:#615371] [--code-line:#e1d5ee] [--code-keyword:#6b21a8] [--code-string:#166353] [--code-name:#24449c] [--code-number:#9a4418] dark:[--code-bg:#211634] dark:[--code-fg:#f1e9ff] dark:[--code-header:#2b1d43] dark:[--code-muted:#c6b5d9] dark:[--code-line:#493760] dark:[--code-keyword:#eca9ff] dark:[--code-string:#cde98d] dark:[--code-name:#b9bcff] dark:[--code-number:#ffba8a] [&[data-code-tone=ink]]:[--code-bg:#211634] [&[data-code-tone=ink]]:[--code-fg:#f1e9ff] [&[data-code-tone=ink]]:[--code-header:#2b1d43] [&[data-code-tone=ink]]:[--code-muted:#c6b5d9] [&[data-code-tone=ink]]:[--code-line:#493760] [&[data-code-tone=ink]]:[--code-keyword:#eca9ff] [&[data-code-tone=ink]]:[--code-string:#cde98d] [&[data-code-tone=ink]]:[--code-name:#b9bcff] [&[data-code-tone=ink]]:[--code-number:#ffba8a] site-code-editor [&_code]:[font:inherit] relative h-full w-full min-w-0 overflow-hidden bg-[var(--code-bg)] [color:var(--code-fg)]"
      data-code-embedded
    >
      <NView tag="pre" ref={highlight} className={`site-code-editor-highlight forced-colors:invisible pointer-events-none overflow-hidden ${editorLayer}`} aria-hidden="true">
        <CodeText code={`${code}\n`} />
      </NView>
      <NView<'textarea'>
        tag="textarea"
        ref={input}
        aria-label={label}
        aria-autocomplete="list"
        aria-controls={active ? listId : undefined}
        aria-activedescendant={active ? `${listId}-${active.index}` : undefined}
        className={`site-code-editor-input selection:[background:color-mix(in_srgb,_var(--accent)_25%,_transparent)] selection:text-transparent forced-colors:[color:CanvasText] forced-colors:[caret-color:auto] forced-colors:selection:[background:Highlight] forced-colors:selection:[color:HighlightText] resize-none overflow-auto bg-transparent text-transparent [caret-color:var(--code-fg)] focus-visible:[outline-offset:-2px] ${editorLayer}`}
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
          className="site-code-suggestions absolute right-3 bottom-3 z-[1] max-h-[min(12rem,48%)] min-w-[min(15rem,90%)] max-w-[calc(100%_-_1.5rem)] overflow-auto rounded-lg border border-[var(--code-line)] bg-[var(--code-bg)] font-mono text-[13px] shadow-md"
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
