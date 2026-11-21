'use client';

import { useEffect, useRef, useState, type ComponentType } from 'react';
import { clipboard } from '@nayan-ui/engine/clipboard';
import { Play, RotateCcw, Copy, Check } from '@/design/Icons';
import CodeEditor from '@/components/engine/playground/CodeEditor';
import { createCompiler } from '@/components/engine/playground/compiler';
import { evaluateExample } from '@/components/engine/playground/evaluate';
import PreviewBoundary from '@/components/engine/playground/PreviewBoundary';
import PreviewSurface from '@/components/ui/previews/PreviewSurface';
import { exampleModules } from '@/components/ui/previews/exampleModules';
import type { NamedComponentPreview } from '@/components/ui/previews/types';

export type LiveExampleScenario = NamedComponentPreview;

interface Props {
  examples: readonly [LiveExampleScenario, ...LiveExampleScenario[]];
  codeAnchor?: string;
  previewId?: string;
}

export default function LiveExample({ examples, codeAnchor, previewId }: Props) {
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
      options={
        examples.length > 1 && (
          <div className="component-example-picker" role="group" aria-label="Choose an example">
            {examples.map(({ title }, index) => (
              <button key={title} type="button" aria-pressed={index === selected} onClick={() => setSelected(index)}>
                {title}
              </button>
            ))}
          </div>
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
  options
}: {
  ready: boolean;
  example: LiveExampleScenario;
  code: string;
  onChange: (code: string) => void;
  getCompiler: () => ReturnType<typeof createCompiler>;
  codeAnchor?: string;
  previewId?: string;
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
  return (
    <div className="component-workbench" id={codeAnchor} inert={!ready}>
      <div className="component-workbench-toolbar">
        {options}
        <div className="component-workbench-actions">
          <button type="button" className="component-workbench-run" onClick={() => void run(code)} disabled={running}>
            <Play size={14} aria-hidden />
            {running ? 'Running…' : 'Run'}
          </button>
          <button type="button" onClick={reset} disabled={code === example.source && !output && !error && !running}>
            <RotateCcw size={14} aria-hidden />
            Reset
          </button>
          <button type="button" onClick={copy} aria-live="polite">
            {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
      {example.note && <p className="component-workbench-note">{example.note}</p>}
      <div className="component-workbench-panes">
        <section className="component-workbench-code" aria-label="Editable code">
          <div className="component-workbench-pane-title">
            <span className="font-mono">Example.tsx</span>
          </div>
          <div className="component-workbench-editor">
            <CodeEditor
              label="Example source code"
              code={code}
              onChange={onChange}
              onRun={run}
              onComplete={(source, position) => getCompiler().complete(source, position)}
            />
          </div>
        </section>
        <section className="component-workbench-preview" aria-label="Live preview">
          <div className="component-workbench-pane-title">Preview</div>
          <div className="docs-live-preview workbench-grid" data-component-preview={previewId}>
            {Output && output ? (
              <PreviewSurface
                preview={{
                  ...example,
                  host: true,
                  styled: false,
                  height: 'auto',
                  render: (
                    <PreviewBoundary key={output.run} onError={(cause) => setError(cause.message)}>
                      <div className="component-edited-preview">
                        <Output />
                      </div>
                    </PreviewBoundary>
                  )
                }}
              />
            ) : (
              <PreviewSurface preview={example} />
            )}
          </div>
        </section>
      </div>
      {error && (
        <p className="component-workbench-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
