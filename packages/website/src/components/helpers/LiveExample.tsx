'use client';

import { useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react';
import { NPress, NText, NView } from 'nayan-ui/components';
import { clipboard } from 'nayan-ui/clipboard';
import { Play, RotateCcw, Copy, Check } from '@/design/Icons';
import CodeEditor from '@/components/playground/CodeEditor';
import { createCompiler } from '@/components/playground/compiler';
import { evaluateExample } from '@/components/playground/evaluate';
import PreviewBoundary from '@/components/playground/PreviewBoundary';
import PreviewSurface from '@/components/ui/previews/PreviewSurface';
import { BrowserFrame } from '@/design/Primitives';
import { exampleModules } from '@/components/ui/previews/exampleModules';
import type { NamedComponentPreview } from '@/components/ui/previews/types';

const island = 'rounded-xl border border-border bg-surface shadow-sm';
const paneHeight = 'h-[30rem]';
const paneTitle = 'border-b border-border p-3 text-xs font-semibold text-muted';
const toolbarButton = 'inline-flex min-h-8 flex-row items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold disabled:opacity-50';
const secondaryButton = `${toolbarButton} text-muted hover:text-foreground`;
// These examples use the viewport for floating controls or content that fills the surface.
const viewportExamples = new Set([
  'calendar',
  'components-root',
  'date-picker',
  'date-range-picker',
  'drawer',
  'keyboard',
  'markdown-view',
  'menu',
  'page',
  'popover',
  'refresh-control',
  'scroll-view',
  'select',
  'theme',
  'toast-host',
  'tooltip',
  'use-drawer',
  'use-keyboard',
  'use-theme',
  'video-player'
]);

export type LiveExampleScenario = NamedComponentPreview;

function scrollsPreview(target: EventTarget, region: HTMLDivElement) {
  return region.scrollHeight > region.clientHeight && target instanceof HTMLCanvasElement && target.hasAttribute('data-nayan-component-canvas');
}

function PreviewViewport({ id, children }: { id?: string; children: ReactNode }) {
  const viewport = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const region = viewport.current;
    if (!region) return;
    const update = () => region.toggleAttribute('data-preview-scrollable', region.scrollHeight > region.clientHeight);
    const observer = new ResizeObserver(update);
    observer.observe(region);
    if (region.firstElementChild) observer.observe(region.firstElementChild);
    update();
    return () => observer.disconnect();
  }, []);

  return (
    <NView
      tag="div"
      ref={viewport}
      className="docs-live-preview flex min-h-0 min-w-0 flex-1 items-start justify-center overflow-auto bg-background text-foreground [scrollbar-width:thin] focus-visible:[outline-offset:-3px] data-[preview-scrollable]:[&_canvas[data-nayan-component-canvas]]:touch-pan-y!"
      role="region"
      aria-label="Preview content"
      tabIndex={0}
      data-component-preview={id}
      onWheelCapture={(event) => {
        const { target, currentTarget, deltaX, deltaY, ctrlKey, metaKey, shiftKey } = event;
        if (!ctrlKey && !metaKey && !shiftKey && Math.abs(deltaY) > Math.abs(deltaX) && scrollsPreview(target, currentTarget)) {
          // Let the browser scroll the frame before the canvas can consume the wheel event.
          event.stopPropagation();
        }
      }}
      onKeyDownCapture={(event) => {
        if (!('key' in event)) return;
        const { target, currentTarget, key } = event;
        if (['PageUp', 'PageDown', 'Home', 'End', 'ArrowUp', 'ArrowDown'].includes(key) && scrollsPreview(target, currentTarget))
          event.stopPropagation();
      }}
    >
      {children}
    </NView>
  );
}

interface Props {
  examples: readonly [LiveExampleScenario, ...LiveExampleScenario[]];
  codeAnchor?: string;
  previewId?: string;
  previewPath: string;
}

export default function LiveExample({ examples, codeAnchor, previewId, previewPath }: Props) {
  const [selected, setSelected] = useState(0);
  const [drafts, setDrafts] = useState<Readonly<Record<number, string>>>({});
  const [ready, setReady] = useState(false);
  const compiler = useRef<ReturnType<typeof createCompiler> | undefined>(undefined);
  const example = examples[selected] ?? examples[0];

  useEffect(() => {
    setReady(true);
    return () => {
      compiler.current?.dispose();
      compiler.current = undefined;
    };
  }, []);

  function getCompiler() {
    return (compiler.current ??= createCompiler());
  }

  return (
    <ExampleWorkspace
      key={selected}
      ready={ready}
      example={example}
      code={drafts[selected] ?? example.source}
      onChange={(code) => setDrafts((current) => ({ ...current, [selected]: code }))}
      getCompiler={getCompiler}
      codeAnchor={codeAnchor}
      previewId={previewId}
      previewPath={previewPath}
      options={
        examples.length > 1 && (
          <NView tag="div" className="component-example-picker flex flex-wrap gap-1" role="group" aria-label="Choose an example">
            {examples.map(({ title }, index) => (
              <NPress
                key={title}
                type="button"
                aria-pressed={index === selected}
                className={index === selected ? `${toolbarButton} bg-accent/10 text-accent` : secondaryButton}
                onPress={() => setSelected(index)}
              >
                {title}
              </NPress>
            ))}
          </NView>
        )
      }
    />
  );
}

function ExampleWorkspace({
  ready,
  example,
  code,
  onChange,
  getCompiler,
  codeAnchor,
  previewId,
  previewPath,
  options
}: {
  ready: boolean;
  example: LiveExampleScenario;
  code: string;
  onChange: (code: string) => void;
  getCompiler: () => ReturnType<typeof createCompiler>;
  codeAnchor?: string;
  previewId?: string;
  previewPath: string;
  options: React.ReactNode;
}) {
  const request = useRef(0);
  const [output, setOutput] = useState<{ component: ComponentType; run: number }>();
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(
    () => () => {
      request.current++;
    },
    []
  );
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(timer);
  }, [copied]);

  async function run(source: string) {
    const id = ++request.current;
    setRunning(true);
    setError('');
    try {
      const js = await getCompiler().compile(source);
      if (id !== request.current) return;
      const modules = await exampleModules(js);
      if (id !== request.current) return;
      const component = evaluateExample(js, modules);
      setOutput({ component, run: id });
    } catch (cause) {
      if (id === request.current) setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      if (id === request.current) setRunning(false);
    }
  }

  function reset() {
    request.current++;
    onChange(example.source);
    setOutput(undefined);
    setError('');
    setRunning(false);
    setCopied(false);
  }

  async function copy() {
    try {
      await clipboard.setString(code);
      setCopied(true);
    } catch {
      setError('Clipboard access is unavailable. You can select the code and copy it manually.');
    }
  }

  const Output = output?.component;
  const keepViewport = previewId !== undefined && viewportExamples.has(previewId);
  const keepEditedViewport = keepViewport && example.host;
  return (
    <NView
      tag="div"
      className="component-workbench @container grid min-w-0 gap-3 scroll-mt-[calc(var(--site-header-height)_+_1rem)]"
      id={codeAnchor}
      inert={!ready}
    >
      <NView tag="div" className={`${island} component-workbench-toolbar flex flex-wrap items-center justify-between gap-3 p-3`}>
        {options}
        <NView tag="div" className="component-workbench-actions ml-auto flex flex-wrap gap-1 rounded-lg bg-surface-secondary p-0.5">
          <NPress type="button" className={`${toolbarButton} bg-accent text-accent-foreground`} onPress={() => void run(code)} disabled={running}>
            <Play size={14} aria-hidden />
            {running ? 'Running…' : 'Run'}
          </NPress>
          <NPress type="button" className={secondaryButton} onPress={reset} disabled={code === example.source && !output && !error && !running}>
            <RotateCcw size={14} aria-hidden />
            Reset
          </NPress>
          <NPress type="button" className={secondaryButton} onPress={copy} aria-live="polite">
            {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
            {copied ? 'Copied' : 'Copy'}
          </NPress>
        </NView>
      </NView>
      {example.note && (
        <NText tag="p" className="text-sm text-muted">
          {example.note}
        </NText>
      )}
      <NView tag="div" className="component-workbench-panes grid min-w-0 grid-cols-1 items-start gap-3 @[672px]:grid-cols-2">
        <NView
          tag="section"
          className={`${island} ${paneHeight} component-workbench-code flex min-w-0 flex-col overflow-hidden`}
          aria-label="Editable code"
        >
          <NText tag="div" className={`${paneTitle} shrink-0 font-mono`}>
            Example.tsx
          </NText>
          <NView tag="div" className="component-workbench-editor min-h-0 min-w-0 flex-1">
            <CodeEditor
              label="Example source code"
              code={code}
              onChange={onChange}
              onRun={run}
              onComplete={(source, position) => getCompiler().complete(source, position)}
            />
          </NView>
        </NView>
        <NView tag="section" className={`${paneHeight} component-workbench-preview min-w-0 overflow-hidden`} aria-label="Live preview">
          <BrowserFrame label={`nayanui.com${previewPath}`} className="h-full" padded={false} compact>
            <PreviewViewport id={previewId}>
              {Output && output ? (
                <PreviewSurface
                  fullWidth={previewId === 'video-player'}
                  keepViewport={keepEditedViewport}
                  preview={{
                    ...example,
                    host: true,
                    height: keepEditedViewport ? example.height : 'auto',
                    render: (
                      <PreviewBoundary key={output.run} onError={(cause) => setError(cause.message)}>
                        <NView
                          tag="div"
                          className={`component-edited-preview flex min-w-0 flex-col${keepEditedViewport || example.fillViewport ? ' min-h-0 flex-1' : ''}`}
                        >
                          <Output />
                        </NView>
                      </PreviewBoundary>
                    )
                  }}
                />
              ) : (
                <PreviewSurface preview={example} fullWidth={previewId === 'video-player'} keepViewport={keepViewport} />
              )}
            </PreviewViewport>
          </BrowserFrame>
        </NView>
      </NView>
      {error && (
        <NText tag="p" className="component-workbench-error max-h-36 overflow-auto whitespace-pre-wrap break-words text-xs text-danger" role="alert">
          {error}
        </NText>
      )}
    </NView>
  );
}
